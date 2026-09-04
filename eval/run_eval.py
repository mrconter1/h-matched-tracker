#!/usr/bin/env python
"""
Measure a frontier model on the benchmarks nobody reports any more.

    python run_eval.py dry-run  --benchmark all --limit 3                       # prompts + cost estimate, no API
    python run_eval.py sync     --benchmark winogrande --limit 20 \
                                --model anthropic/claude-sonnet-5 --effort low   # via OpenRouter (model id has a '/')
    python run_eval.py sync     --benchmark boolq --model claude-opus-5          # via the Anthropic API directly
    python run_eval.py sync     --resume results/winogrande/<file>.json          # continue an interrupted run
    python run_eval.py submit   --benchmark all --model claude-opus-5            # Anthropic Message Batches, 50% pricing
    python run_eval.py collect  results/boolq/claude-opus-5_2026-09-03.json --wait
    python run_eval.py status

Backends
    openrouter   any model id containing '/', e.g. anthropic/claude-sonnet-5. Needs OPENROUTER_API_KEY.
                 OpenAI-compatible chat completions with OpenRouter's `reasoning` parameter; ':batch'
                 suffixed ids are accepted as-is (OpenRouter's half-price, slower tier).
    anthropic    bare Anthropic ids, e.g. claude-opus-5. Needs ANTHROPIC_API_KEY (or an `ant auth` profile).

Every run writes one JSON under results/<benchmark>/ with the exact prompts,
model settings, per-item replies and scores, so the number on the tracker can
be reproduced from the file alone.
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import os
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import requests

from benchmarks import SPECS, SYSTEM_PROMPT, Spec, load_examples, summarize
from data import DATA_DIR, Example

RESULTS_DIR = Path(__file__).resolve().parent / "results"
DEFAULT_MODEL = "anthropic/claude-sonnet-5"


def load_dotenv() -> None:
    """Read KEY=VALUE lines from eval/.env (gitignored) into the environment, without overriding it."""
    env_file = Path(__file__).resolve().parent / ".env"
    if not env_file.exists():
        return
    for line in env_file.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip("\"'"))


load_dotenv()

# Anthropic first-party list prices, USD per million tokens (input, output). Batches halve both.
ANTHROPIC_PRICES = {
    "claude-fable-5-1": (10.0, 50.0),
    "claude-fable-5": (10.0, 50.0),
    "claude-opus-5": (5.0, 25.0),
    "claude-opus-4-8": (5.0, 25.0),
    "claude-sonnet-5": (2.0, 10.0),
    "claude-haiku-4-5": (1.0, 5.0),
}

# Rough visible+thinking output tokens per item at each effort, for the estimate only.
OUTPUT_GUESS = {"minimal": 30, "low": 60, "medium": 250, "high": 600, "xhigh": 1200, "max": 2500}


class OutOfCredit(RuntimeError):
    """Raised on HTTP 402 so the run stops instead of failing every remaining item."""


@dataclass
class Reply:
    text: str
    stop_reason: str | None
    usage: dict[str, int] | None
    error: str | None = None


# ---------- backends ----------

class AnthropicBackend:
    name = "anthropic"

    def __init__(self) -> None:
        import anthropic  # imported lazily so OpenRouter-only users need not have it

        self.anthropic = anthropic
        self.client = anthropic.Anthropic()

    def params(self, spec: Spec, example: Example, model: str, effort: str, max_tokens: int) -> dict[str, Any]:
        # `thinking` is deliberately omitted: Fable and Opus 5 run adaptive thinking by default and
        # reject other configurations; effort is the one knob that works across the current models.
        return dict(
            model=model,
            max_tokens=max_tokens,
            system=[{"type": "text", "text": SYSTEM_PROMPT, "cache_control": {"type": "ephemeral"}}],
            output_config={"effort": effort},
            messages=[{"role": "user", "content": spec.build_prompt(example)}],
        )

    def complete(self, spec: Spec, example: Example, model: str, effort: str, max_tokens: int) -> Reply:
        try:
            message = self.client.messages.create(**self.params(spec, example, model, effort, max_tokens))
        except self.anthropic.APIStatusError as e:
            return Reply("", None, None, error=f"{e.status_code}: {e.message}")
        return self.reply_from_message(message)

    @staticmethod
    def reply_from_message(message: Any) -> Reply:
        text = "".join(block.text for block in message.content if block.type == "text")
        return Reply(
            text=text,
            stop_reason=message.stop_reason,
            usage={
                "input": message.usage.input_tokens,
                "output": message.usage.output_tokens,
                "cache_read": getattr(message.usage, "cache_read_input_tokens", 0) or 0,
            },
        )

    def price(self, model: str) -> tuple[float, float]:
        return ANTHROPIC_PRICES.get(model, (5.0, 25.0))


class OpenRouterBackend:
    name = "openrouter"
    BASE_URL = "https://openrouter.ai/api/v1"

    def __init__(self) -> None:
        from openai import OpenAI  # OpenRouter speaks the OpenAI chat-completions dialect

        api_key = os.environ.get("OPENROUTER_API_KEY")
        if not api_key:
            sys.exit("OPENROUTER_API_KEY is not set")
        self.client = OpenAI(
            base_url=self.BASE_URL,
            api_key=api_key,
            default_headers={"HTTP-Referer": "https://h-matched.vercel.app", "X-Title": "h-matched tracker eval"},
            max_retries=3,
            timeout=600,
        )

    def complete(self, spec: Spec, example: Example, model: str, effort: str, max_tokens: int) -> Reply:
        from openai import APIStatusError

        try:
            response = self.client.chat.completions.create(
                model=model,
                max_tokens=max_tokens,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": spec.build_prompt(example)},
                ],
                extra_body={"reasoning": {"effort": effort, "exclude": True}},
            )
        except APIStatusError as e:
            if e.status_code == 402:
                raise OutOfCredit(e.message) from e
            return Reply("", None, None, error=f"{e.status_code}: {e.message}")
        if not response.choices:
            err = getattr(response, "error", None)
            return Reply("", None, None, error=f"no choices: {err}")
        choice = response.choices[0]
        usage = response.usage
        details = getattr(usage, "completion_tokens_details", None) if usage else None
        return Reply(
            text=choice.message.content or "",
            stop_reason=choice.finish_reason,
            usage={
                "input": usage.prompt_tokens if usage else 0,
                "output": usage.completion_tokens if usage else 0,
                "cache_read": 0,
                "reasoning": getattr(details, "reasoning_tokens", 0) or 0 if details else 0,
            },
        )

    @staticmethod
    def price(model: str) -> tuple[float, float]:
        """Live list price from OpenRouter, cached for a day under data/."""
        cache = DATA_DIR / "openrouter_models.json"
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        if not cache.exists() or time.time() - cache.stat().st_mtime > 86400:
            cache.write_bytes(requests.get(f"{OpenRouterBackend.BASE_URL}/models", timeout=60).content)
        for m in json.loads(cache.read_text(encoding="utf-8"))["data"]:
            if m["id"] == model:
                p = m["pricing"]
                return float(p["prompt"]) * 1e6, float(p["completion"]) * 1e6
        sys.exit(f"{model} is not an OpenRouter model id (see https://openrouter.ai/models)")


def backend_for(model: str) -> AnthropicBackend | OpenRouterBackend:
    return OpenRouterBackend() if "/" in model else AnthropicBackend()


def price_for(model: str) -> tuple[float, float]:
    return OpenRouterBackend.price(model) if "/" in model else ANTHROPIC_PRICES.get(model, (5.0, 25.0))


# ---------- helpers ----------

def select_examples(spec: Spec, limit: int | None) -> list[Example]:
    examples = load_examples(spec.name)
    return examples[:limit] if limit else examples


def prompt_fingerprint(spec: Spec, examples: list[Example]) -> str:
    h = hashlib.sha256(SYSTEM_PROMPT.encode())
    for ex in examples[:50]:
        h.update(spec.build_prompt(ex).encode())
    return h.hexdigest()[:12]


def new_run_record(spec: Spec, examples: list[Example], model: str, effort: str, max_tokens: int, mode: str) -> dict[str, Any]:
    return {
        "benchmark": spec.name,
        "display_name": spec.display_name,
        "split": spec.split,
        "model": model,
        "backend": "openrouter" if "/" in model else "anthropic",
        "effort": effort,
        "max_tokens": max_tokens,
        "mode": mode,
        "system_prompt": SYSTEM_PROMPT,
        "prompt_fingerprint": prompt_fingerprint(spec, examples),
        "created": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "n_requested": len(examples),
        "status": "pending",
        "batch_id": None,
        "summary": None,
        "items": [],
    }


def run_path(spec: Spec, model: str) -> Path:
    stamp = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%d")
    slug = model.replace("/", "__").replace(":", "-")
    path = RESULTS_DIR / spec.name / f"{slug}_{stamp}.json"
    counter = 1
    while path.exists():
        counter += 1
        path = RESULTS_DIR / spec.name / f"{slug}_{stamp}-{counter}.json"
    return path


def display_path(path: Path) -> str:
    """Path relative to the repo where possible; --resume may be given any path."""
    try:
        return str(path.resolve().relative_to(RESULTS_DIR.parent))
    except ValueError:
        return str(path)


def save(path: Path, record: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".tmp")
    tmp.write_text(json.dumps(record, indent=2, ensure_ascii=False), encoding="utf-8")
    tmp.replace(path)


def record_item(spec: Spec, example: Example, reply: Reply) -> dict[str, Any]:
    parsed = spec.parse(reply.text) if reply.text else None
    # An unparseable reply scores zero. The accuracy scorer handles None itself; DROP needs spans.
    scores = spec.score(parsed, example) if parsed is not None or spec.metric == "accuracy" else {"em": 0.0, "f1": 0.0}
    return {
        "id": example.id,
        "prompt": spec.build_prompt(example),
        "gold": example.gold,
        "response": reply.text,
        "parsed": parsed,
        "scores": scores,
        "stop_reason": reply.stop_reason,
        "usage": reply.usage,
        "error": reply.error,
    }


def finalize(spec: Spec, record: dict[str, Any]) -> None:
    record["summary"] = summarize(spec, record["items"])
    record["status"] = "done"
    usage = [i["usage"] for i in record["items"] if i.get("usage")]
    record["usage_total"] = {
        "input": sum(u.get("input", 0) for u in usage),
        "output": sum(u.get("output", 0) for u in usage),
        "cache_read": sum(u.get("cache_read", 0) for u in usage),
        "reasoning": sum(u.get("reasoning", 0) for u in usage),
    }
    pin, pout = price_for(record["model"])
    record["cost_usd_est"] = round((record["usage_total"]["input"] * pin + record["usage_total"]["output"] * pout) / 1e6, 4)


def print_summary(spec: Spec, record: dict[str, Any]) -> None:
    s = record["summary"]
    headline = f"accuracy {s['accuracy']}%" if spec.metric == "accuracy" else f"EM {s['em']}  F1 {s['f1']}"
    verdict = "H-MATCHED" if s["h_matched"] else "below human"
    print(f"    {spec.display_name}: {headline}  vs human {s['human_score']}{s['human_unit']} ({s['human_baseline']})  "
          f"-> {verdict} ({s['margin']:+.2f}); n={s['n']}, unparsed={s['unparsed']}, refused={s['refused']}, errors={sum(1 for i in record['items'] if i.get('error'))}")
    u = record.get("usage_total")
    if u:
        print(f"    tokens: in {u['input']:,}  out {u['output']:,} (reasoning {u['reasoning']:,}, cache reads {u['cache_read']:,})  "
              f"cost ~${record.get('cost_usd_est', 0):.2f}")


def resolve_benchmarks(arg: str) -> list[str]:
    if arg == "all":
        return list(SPECS)
    names = [n.strip() for n in arg.split(",")]
    unknown = [n for n in names if n not in SPECS]
    if unknown:
        sys.exit(f"unknown benchmark(s): {unknown}; choose from {list(SPECS)} or 'all'")
    return names


# ---------- commands ----------

def cmd_dry_run(args: argparse.Namespace) -> None:
    pin, pout = price_for(args.model)
    total = 0.0
    for name in resolve_benchmarks(args.benchmark):
        spec = SPECS[name]
        examples = load_examples(name)
        chars = sum(len(spec.build_prompt(ex)) for ex in examples)
        est_in = int(chars / 3.6) + len(examples) * 60   # rough tokens incl. system prompt share
        est_out = len(examples) * OUTPUT_GUESS[args.effort]
        cost = (est_in * pin + est_out * pout) / 1e6
        total += cost
        print(f"=== {spec.display_name}  [{spec.split}]  n={len(examples)}  human={spec.human_score}{spec.human_unit}")
        print(f"    est. tokens: in ~{est_in:,}  out ~{est_out:,}   cost on {args.model} @ effort={args.effort}: ~${cost:.2f}")
        for ex in examples[: args.limit or 0]:
            print("-" * 72)
            print(spec.build_prompt(ex))
            print(f"[gold: {ex.gold if spec.metric == 'accuracy' else ex.gold[0]}]")
        print()
    print(f"TOTAL estimate on {args.model} (${pin:.2f} in / ${pout:.2f} out per M) @ effort={args.effort}: ~${total:.2f} "
          "(the output-token guess is the uncertain part - thinking length varies)")


def run_sync(spec: Spec, examples: list[Example], record: dict[str, Any], path: Path, args: argparse.Namespace) -> None:
    backend = backend_for(args.model)
    done_ids = {item["id"] for item in record["items"]}
    todo = [ex for ex in examples if ex.id not in done_ids]
    print(f"=== {spec.display_name}: {len(todo)} items to run ({len(done_ids)} already done), {backend.name}, "
          f"{args.model} @ {args.effort}, concurrency {args.concurrency} -> {display_path(path)}")
    lock = threading.Lock()
    finished = 0
    correct = 0.0

    def work(ex: Example) -> dict[str, Any]:
        return record_item(spec, ex, backend.complete(spec, ex, args.model, args.effort, args.max_tokens))

    with ThreadPoolExecutor(max_workers=args.concurrency) as pool:
        futures = {pool.submit(work, ex): ex for ex in todo}
        try:
            for future in as_completed(futures):
                item = future.result()
                with lock:
                    record["items"].append(item)
                    finished += 1
                    correct += item["scores"].get("correct", item["scores"].get("f1", 0.0))
                    if finished % 10 == 0 or finished == len(todo):
                        running = 100.0 * correct / finished
                        print(f"  {finished:>5}/{len(todo)}  running score {running:5.1f}%  last: parsed={item['parsed']!r} stop={item['stop_reason']}"
                              + (f" error={item['error']}" if item["error"] else ""))
                    if finished % 25 == 0:
                        save(path, record)
        except KeyboardInterrupt:
            print("\ninterrupted - saving progress; resume with --resume", display_path(path))
            pool.shutdown(wait=False, cancel_futures=True)
            save(path, record)
            raise SystemExit(130)
        except OutOfCredit as e:
            print(f"\nout of credit: {e}")
            print(f"  {len(record['items'])} items kept. Top up, then:")
            print(f"  python run_eval.py sync --resume {display_path(path)}")
            pool.shutdown(wait=False, cancel_futures=True)
            save(path, record)
            raise SystemExit(2)

    order = {ex.id: i for i, ex in enumerate(examples)}
    record["items"].sort(key=lambda item: order.get(item["id"], 1 << 30))
    finalize(spec, record)
    save(path, record)
    print_summary(spec, record)


def cmd_sync(args: argparse.Namespace) -> None:
    if args.resume:
        path = Path(args.resume).resolve()
        record = json.loads(path.read_text(encoding="utf-8"))
        spec = SPECS[record["benchmark"]]
        args.model, args.effort, args.max_tokens = record["model"], record["effort"], record["max_tokens"]
        failed = [i for i in record["items"] if i.get("error")]
        if failed:
            print(f"retrying {len(failed)} previously errored items")
            record["items"] = [i for i in record["items"] if not i.get("error")]
        examples = select_examples(spec, record["n_requested"])
        run_sync(spec, examples, record, path, args)
        return
    for name in resolve_benchmarks(args.benchmark):
        spec = SPECS[name]
        examples = select_examples(spec, args.limit)
        record = new_run_record(spec, examples, args.model, args.effort, args.max_tokens, "sync")
        run_sync(spec, examples, record, run_path(spec, args.model), args)


def cmd_submit(args: argparse.Namespace) -> None:
    if "/" in args.model:
        sys.exit("submit uses the Anthropic Message Batches API; for OpenRouter use `sync` with a ':batch' model id")
    from anthropic.types.message_create_params import MessageCreateParamsNonStreaming
    from anthropic.types.messages.batch_create_params import Request

    backend = AnthropicBackend()
    for name in resolve_benchmarks(args.benchmark):
        spec = SPECS[name]
        examples = select_examples(spec, args.limit)
        record = new_run_record(spec, examples, args.model, args.effort, args.max_tokens, "batch")
        path = run_path(spec, args.model)
        reqs = [
            Request(custom_id=ex.id, params=MessageCreateParamsNonStreaming(**backend.params(spec, ex, args.model, args.effort, args.max_tokens)))
            for ex in examples
        ]
        batch = backend.client.messages.batches.create(requests=reqs)
        record["batch_id"] = batch.id
        record["status"] = "submitted"
        save(path, record)
        print(f"=== {spec.display_name}: submitted {len(reqs)} requests as {batch.id} -> {path.relative_to(RESULTS_DIR.parent)}")
    print("Collect later with:  python run_eval.py collect <results file>   (or `status` to check progress)")


def cmd_collect(args: argparse.Namespace) -> None:
    backend = AnthropicBackend()
    client = backend.client
    path = Path(args.results_file)
    record = json.loads(path.read_text(encoding="utf-8"))
    spec = SPECS[record["benchmark"]]
    batch = client.messages.batches.retrieve(record["batch_id"])
    while batch.processing_status != "ended":
        counts = batch.request_counts
        print(f"{record['batch_id']}: {batch.processing_status} - processing {counts.processing}, succeeded {counts.succeeded}, errored {counts.errored}")
        if not args.wait:
            return
        time.sleep(60)
        batch = client.messages.batches.retrieve(record["batch_id"])
    examples = {ex.id: ex for ex in load_examples(spec.name)}
    items: dict[str, dict[str, Any]] = {}
    for result in client.messages.batches.results(record["batch_id"]):
        ex = examples[result.custom_id]
        if result.result.type == "succeeded":
            items[ex.id] = record_item(spec, ex, backend.reply_from_message(result.result.message))
        else:
            detail = getattr(result.result, "error", None)
            items[ex.id] = record_item(spec, ex, Reply("", None, None, error=f"{result.result.type}: {detail}"))
    record["items"] = [items[ex_id] for ex_id in examples if ex_id in items]
    finalize(spec, record)
    save(path, record)
    print_summary(spec, record)


def cmd_status(args: argparse.Namespace) -> None:
    client = None
    for path in sorted(RESULTS_DIR.glob("*/*.json")):
        record = json.loads(path.read_text(encoding="utf-8"))
        rel = path.relative_to(RESULTS_DIR.parent)
        if record.get("batch_id") and record.get("status") != "done":
            client = client or AnthropicBackend().client
            batch = client.messages.batches.retrieve(record["batch_id"])
            c = batch.request_counts
            print(f"{rel}: {batch.processing_status} (processing {c.processing}, succeeded {c.succeeded}, errored {c.errored})")
        else:
            s = record.get("summary") or {}
            headline = s.get("accuracy", s.get("f1"))
            done = len(record.get("items", []))
            print(f"{rel}: {record['status']}  {done}/{record['n_requested']} items  score={headline}  model={record['model']} effort={record['effort']}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="command", required=True)

    def common(p: argparse.ArgumentParser) -> None:
        p.add_argument("--benchmark", default="all", help="comma-separated names or 'all'")
        p.add_argument("--model", default=DEFAULT_MODEL, help="OpenRouter id with a '/', or a bare Anthropic id")
        p.add_argument("--effort", default="low", choices=list(OUTPUT_GUESS))
        p.add_argument("--max-tokens", type=int, default=16000, help="room for thinking; the visible answer is a few tokens")
        p.add_argument("--limit", type=int, default=None, help="only the first N items")

    common(sub.add_parser("dry-run", help="print prompts and a cost estimate, no API calls"))
    p_sync = sub.add_parser("sync", help="call the API item by item, in parallel")
    common(p_sync)
    p_sync.add_argument("--concurrency", type=int, default=8)
    p_sync.add_argument("--resume", default=None, help="results file of an interrupted run to continue")
    common(sub.add_parser("submit", help="submit an Anthropic Message Batch per benchmark (50%% pricing)"))
    p_collect = sub.add_parser("collect", help="fetch a finished Anthropic batch into its results file")
    p_collect.add_argument("results_file")
    p_collect.add_argument("--wait", action="store_true", help="poll until the batch has ended")
    sub.add_parser("status", help="show every results file and batch state")

    args = parser.parse_args()
    {"dry-run": cmd_dry_run, "sync": cmd_sync, "submit": cmd_submit, "collect": cmd_collect, "status": cmd_status}[args.command](args)


if __name__ == "__main__":
    main()
