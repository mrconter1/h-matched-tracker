#!/usr/bin/env python
"""
Measure a frontier model on the benchmarks nobody reports any more.

    python run_eval.py dry-run  --benchmark all --limit 3          # prompts + cost estimate, no API
    python run_eval.py sync     --benchmark boolq --limit 20       # small live check, standard pricing
    python run_eval.py submit   --benchmark all                    # Message Batches, 50% pricing
    python run_eval.py collect  results/boolq/claude-opus-5_2026-09-03.json
    python run_eval.py status                                      # every submitted batch

Every run writes one JSON under results/<benchmark>/ with the exact prompts,
model settings, per-item replies and scores, so the number on the tracker can
be reproduced from the file alone.
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import sys
import time
from pathlib import Path
from typing import Any

import anthropic
from anthropic.types.message_create_params import MessageCreateParamsNonStreaming
from anthropic.types.messages.batch_create_params import Request

from benchmarks import SPECS, SYSTEM_PROMPT, Spec, load_examples, summarize
from data import Example

RESULTS_DIR = Path(__file__).resolve().parent / "results"
DEFAULT_MODEL = "claude-opus-5"

# Anthropic first-party list prices, USD per million tokens (input, output). Batches halve both.
PRICES = {
    "claude-fable-5-1": (10.0, 50.0),
    "claude-fable-5": (10.0, 50.0),
    "claude-opus-5": (5.0, 25.0),
    "claude-opus-4-8": (5.0, 25.0),
    "claude-sonnet-5": (2.0, 10.0),
    "claude-haiku-4-5": (1.0, 5.0),
}


# ---------- request construction ----------

def message_params(spec: Spec, example: Example, model: str, effort: str, max_tokens: int) -> MessageCreateParamsNonStreaming:
    # `thinking` is deliberately omitted: Fable and Opus 5 run adaptive thinking by default and
    # reject other configurations; effort is the one knob that works across the current models.
    return MessageCreateParamsNonStreaming(
        model=model,
        max_tokens=max_tokens,
        system=[{"type": "text", "text": SYSTEM_PROMPT, "cache_control": {"type": "ephemeral"}}],
        output_config={"effort": effort},
        messages=[{"role": "user", "content": spec.build_prompt(example)}],
    )


def select_examples(spec: Spec, limit: int | None) -> list[Example]:
    examples = load_examples(spec.name)
    return examples[:limit] if limit else examples


def prompt_fingerprint(spec: Spec, examples: list[Example]) -> str:
    h = hashlib.sha256(SYSTEM_PROMPT.encode())
    for ex in examples[:50]:
        h.update(spec.build_prompt(ex).encode())
    return h.hexdigest()[:12]


# ---------- result files ----------

def new_run_record(spec: Spec, examples: list[Example], model: str, effort: str, max_tokens: int, mode: str) -> dict[str, Any]:
    return {
        "benchmark": spec.name,
        "display_name": spec.display_name,
        "split": spec.split,
        "model": model,
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


def run_path(spec: Spec, model: str, stamp: str | None = None) -> Path:
    stamp = stamp or dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%d")
    path = RESULTS_DIR / spec.name / f"{model}_{stamp}.json"
    counter = 1
    while path.exists():
        counter += 1
        path = RESULTS_DIR / spec.name / f"{model}_{stamp}-{counter}.json"
    return path


def save(path: Path, record: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(record, indent=2, ensure_ascii=False), encoding="utf-8")


def record_item(spec: Spec, example: Example, message: anthropic.types.Message | None, error: str | None = None) -> dict[str, Any]:
    text = ""
    stop_reason = None
    usage = None
    if message is not None:
        text = "".join(block.text for block in message.content if block.type == "text")
        stop_reason = message.stop_reason
        usage = {
            "input": message.usage.input_tokens,
            "output": message.usage.output_tokens,
            "cache_read": getattr(message.usage, "cache_read_input_tokens", 0) or 0,
        }
    parsed = spec.parse(text) if text else None
    # An unparseable reply scores zero. The accuracy scorer handles None itself; DROP needs spans.
    scores = spec.score(parsed, example) if parsed is not None or spec.metric == "accuracy" else {"em": 0.0, "f1": 0.0}
    return {
        "id": example.id,
        "prompt": spec.build_prompt(example),
        "gold": example.gold,
        "response": text,
        "parsed": parsed,
        "scores": scores,
        "stop_reason": stop_reason,
        "usage": usage,
        "error": error,
    }


def finalize(spec: Spec, record: dict[str, Any]) -> None:
    record["summary"] = summarize(spec, record["items"])
    record["status"] = "done"
    usage = [i["usage"] for i in record["items"] if i.get("usage")]
    record["usage_total"] = {
        "input": sum(u["input"] for u in usage),
        "output": sum(u["output"] for u in usage),
        "cache_read": sum(u["cache_read"] for u in usage),
    }


# ---------- commands ----------

def cmd_dry_run(args: argparse.Namespace) -> None:
    total_cost_batch = 0.0
    total_cost_sync = 0.0
    for name in resolve_benchmarks(args.benchmark):
        spec = SPECS[name]
        examples = load_examples(name)
        shown = examples[: args.limit or 2]
        chars = sum(len(spec.build_prompt(ex)) for ex in examples)
        est_in = int(chars / 3.6) + len(examples) * 60   # rough tokens incl. system prompt share
        est_out = len(examples) * {"low": 60, "medium": 250, "high": 600, "xhigh": 1200, "max": 2500}[args.effort]
        pin, pout = PRICES.get(args.model, (5.0, 25.0))
        sync_cost = (est_in * pin + est_out * pout) / 1e6
        total_cost_sync += sync_cost
        total_cost_batch += sync_cost / 2
        print(f"=== {spec.display_name}  [{spec.split}]  n={len(examples)}  human={spec.human_score}{spec.human_unit}")
        print(f"    est. tokens: in ~{est_in:,}  out ~{est_out:,}   cost on {args.model} @ effort={args.effort}: "
              f"~${sync_cost:.0f} sync / ~${sync_cost/2:.0f} batch")
        for ex in shown:
            print("-" * 72)
            print(spec.build_prompt(ex))
            print(f"[gold: {ex.gold if spec.metric == 'accuracy' else ex.gold[0]}]")
        print()
    print(f"TOTAL estimate on {args.model} @ effort={args.effort}: ~${total_cost_sync:.0f} sync / ~${total_cost_batch:.0f} batch "
          "(output-token guess is the uncertain part - thinking length varies)")


def cmd_sync(args: argparse.Namespace) -> None:
    client = anthropic.Anthropic()
    for name in resolve_benchmarks(args.benchmark):
        spec = SPECS[name]
        examples = select_examples(spec, args.limit)
        record = new_run_record(spec, examples, args.model, args.effort, args.max_tokens, "sync")
        path = run_path(spec, args.model)
        print(f"=== {spec.display_name}: {len(examples)} items, sync, {args.model} @ {args.effort} -> {path.relative_to(RESULTS_DIR.parent)}")
        for i, ex in enumerate(examples, 1):
            try:
                message = client.messages.create(**message_params(spec, ex, args.model, args.effort, args.max_tokens))
                item = record_item(spec, ex, message)
            except anthropic.APIStatusError as e:
                item = record_item(spec, ex, None, error=f"{e.status_code}: {e.message}")
            record["items"].append(item)
            flag = "ok " if item["scores"].get("correct", item["scores"].get("f1", 0)) else "   "
            print(f"  [{i:>4}/{len(examples)}] {flag} gold={item['gold'] if spec.metric == 'accuracy' else '...'} parsed={item['parsed']!r} stop={item['stop_reason']}")
            if i % 10 == 0:
                save(path, record)
        finalize(spec, record)
        save(path, record)
        print_summary(spec, record)


def cmd_submit(args: argparse.Namespace) -> None:
    client = anthropic.Anthropic()
    for name in resolve_benchmarks(args.benchmark):
        spec = SPECS[name]
        examples = select_examples(spec, args.limit)
        record = new_run_record(spec, examples, args.model, args.effort, args.max_tokens, "batch")
        path = run_path(spec, args.model)
        requests = [
            Request(custom_id=ex.id, params=message_params(spec, ex, args.model, args.effort, args.max_tokens))
            for ex in examples
        ]
        batch = client.messages.batches.create(requests=requests)
        record["batch_id"] = batch.id
        record["status"] = "submitted"
        save(path, record)
        print(f"=== {spec.display_name}: submitted {len(requests)} requests as {batch.id} -> {path.relative_to(RESULTS_DIR.parent)}")
    print("Collect later with:  python run_eval.py collect <results file>   (or `status` to check progress)")


def cmd_collect(args: argparse.Namespace) -> None:
    client = anthropic.Anthropic()
    path = Path(args.results_file)
    record = json.loads(path.read_text(encoding="utf-8"))
    spec = SPECS[record["benchmark"]]
    batch = client.messages.batches.retrieve(record["batch_id"])
    if batch.processing_status != "ended":
        if not args.wait:
            counts = batch.request_counts
            print(f"{record['batch_id']}: {batch.processing_status} - processing {counts.processing}, succeeded {counts.succeeded}, errored {counts.errored}")
            return
        while batch.processing_status != "ended":
            counts = batch.request_counts
            print(f"  waiting: processing {counts.processing}, succeeded {counts.succeeded}, errored {counts.errored}")
            time.sleep(60)
            batch = client.messages.batches.retrieve(record["batch_id"])
    examples = {ex.id: ex for ex in load_examples(spec.name)}
    items: dict[str, dict[str, Any]] = {}
    for result in client.messages.batches.results(record["batch_id"]):
        ex = examples[result.custom_id]
        if result.result.type == "succeeded":
            items[ex.id] = record_item(spec, ex, result.result.message)
        else:
            detail = getattr(result.result, "error", None)
            items[ex.id] = record_item(spec, ex, None, error=f"{result.result.type}: {detail}")
    # keep the original request order
    order = [ex_id for ex_id in examples if ex_id in items]
    record["items"] = [items[ex_id] for ex_id in order]
    finalize(spec, record)
    save(path, record)
    print_summary(spec, record)


def cmd_status(args: argparse.Namespace) -> None:
    client = anthropic.Anthropic()
    for path in sorted(RESULTS_DIR.glob("*/*.json")):
        record = json.loads(path.read_text(encoding="utf-8"))
        if record.get("batch_id") and record.get("status") != "done":
            batch = client.messages.batches.retrieve(record["batch_id"])
            c = batch.request_counts
            print(f"{path.relative_to(RESULTS_DIR.parent)}: {batch.processing_status} (processing {c.processing}, succeeded {c.succeeded}, errored {c.errored})")
        else:
            s = record.get("summary") or {}
            headline = s.get("accuracy", s.get("f1"))
            print(f"{path.relative_to(RESULTS_DIR.parent)}: {record['status']}  {headline}")


def print_summary(spec: Spec, record: dict[str, Any]) -> None:
    s = record["summary"]
    headline = f"accuracy {s['accuracy']}%" if spec.metric == "accuracy" else f"EM {s['em']}  F1 {s['f1']}"
    verdict = "H-MATCHED" if s["h_matched"] else "below human"
    print(f"    {spec.display_name}: {headline}  vs human {s['human_score']}{s['human_unit']} ({s['human_baseline']})  "
          f"-> {verdict} ({s['margin']:+.2f}); n={s['n']}, unparsed={s['unparsed']}, refused={s['refused']}")
    u = record.get("usage_total")
    if u:
        print(f"    tokens: in {u['input']:,} (cache reads {u['cache_read']:,})  out {u['output']:,}")


def resolve_benchmarks(arg: str) -> list[str]:
    if arg == "all":
        return list(SPECS)
    names = [n.strip() for n in arg.split(",")]
    unknown = [n for n in names if n not in SPECS]
    if unknown:
        sys.exit(f"unknown benchmark(s): {unknown}; choose from {list(SPECS)} or 'all'")
    return names


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="command", required=True)

    def common(p: argparse.ArgumentParser) -> None:
        p.add_argument("--benchmark", default="all", help="comma-separated names or 'all'")
        p.add_argument("--model", default=DEFAULT_MODEL)
        p.add_argument("--effort", default="high", choices=["low", "medium", "high", "xhigh", "max"])
        p.add_argument("--max-tokens", type=int, default=16000, help="room for thinking; the visible answer is a few tokens")
        p.add_argument("--limit", type=int, default=None, help="only the first N items")

    common(sub.add_parser("dry-run", help="print prompts and a cost estimate, no API calls"))
    common(sub.add_parser("sync", help="call the API item by item (standard pricing)"))
    common(sub.add_parser("submit", help="submit a Message Batch per benchmark (50%% pricing)"))
    p_collect = sub.add_parser("collect", help="fetch a finished batch into its results file")
    p_collect.add_argument("results_file")
    p_collect.add_argument("--wait", action="store_true", help="poll until the batch has ended")
    sub.add_parser("status", help="show every results file and batch state")

    args = parser.parse_args()
    {"dry-run": cmd_dry_run, "sync": cmd_sync, "submit": cmd_submit, "collect": cmd_collect, "status": cmd_status}[args.command](args)


if __name__ == "__main__":
    main()
