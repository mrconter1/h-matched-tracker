"""
One adapter per benchmark: how to phrase the question, how to read the reply,
how to score it, and what the paper's human baseline was.

Prompting is deliberately plain and identical in shape across benchmarks:
zero-shot, the item in a fixed template, and an instruction to reply with the
answer only. Anything unparseable counts as wrong - a model that will not
follow the answer format has not answered the question.
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any, Callable

from data import LOADERS, Example
from drop_eval import score_against_candidates

SYSTEM_PROMPT = (
    "You are being evaluated on a published benchmark. Read the item carefully and reply with "
    "only the final answer in exactly the format the item asks for. No explanation, no restating "
    "the question, no markdown."
)

LETTERS = "ABCD"


@dataclass(frozen=True)
class Spec:
    name: str
    display_name: str
    split: str
    human_score: float
    human_unit: str          # "%" or "F1"
    human_baseline: str      # who the humans were, for the record
    metric: str              # "accuracy" or "em_f1"
    build_prompt: Callable[[Example], str]
    parse: Callable[[str], Any]
    score: Callable[[Any, Example], dict[str, float]]


# ---------- shared pieces ----------

def _options_block(options: list[str]) -> str:
    return "\n".join(f"{LETTERS[i]}. {opt.strip()}" for i, opt in enumerate(options))


def _letter_instruction(n: int) -> str:
    letters = ", ".join(LETTERS[:n])
    return f"Answer with only the letter ({letters})."


_LETTER_LINE = re.compile(r"^\W*([A-D])\W*$", re.IGNORECASE)
_LETTER_LEAD = re.compile(r"^\W*([A-D])\b", re.IGNORECASE)
_YESNO = re.compile(r"^\W*(yes|no)\b", re.IGNORECASE)


def parse_letter(text: str, n: int) -> str | None:
    """The reply should be a bare letter; accept 'B', 'B.', '(B)', '**B**', 'Answer: B' on its own last line."""
    lines = [ln.strip() for ln in text.strip().splitlines() if ln.strip()]
    if not lines:
        return None
    for candidate in (lines[-1], lines[0]):
        candidate = re.sub(r"^(answer|final answer)\s*[:\-]\s*", "", candidate, flags=re.IGNORECASE)
        for pattern in (_LETTER_LINE, _LETTER_LEAD):
            m = pattern.match(candidate)
            if m and m.group(1).upper() in LETTERS[:n]:
                return m.group(1).upper()
    return None


def parse_yes_no(text: str) -> str | None:
    lines = [ln.strip() for ln in text.strip().splitlines() if ln.strip()]
    for candidate in (lines[-1] if lines else "", lines[0] if lines else ""):
        candidate = re.sub(r"^(answer|final answer)\s*[:\-]\s*", "", candidate, flags=re.IGNORECASE)
        m = _YESNO.match(candidate)
        if m:
            return m.group(1).lower()
    return None


def _accuracy(parsed: Any, example: Example) -> dict[str, float]:
    return {"correct": 1.0 if parsed is not None and parsed == example.gold else 0.0}


def _mcq_spec(name: str, display: str, split: str, human: float, who: str, prompt: Callable[[Example], str], n_options: int) -> Spec:
    return Spec(
        name=name, display_name=display, split=split, human_score=human, human_unit="%", human_baseline=who,
        metric="accuracy", build_prompt=prompt, parse=lambda t: parse_letter(t, n_options), score=_accuracy,
    )


# ---------- prompts ----------

def prompt_boolq(ex: Example) -> str:
    return (
        f"Passage:\n{ex.fields['passage'].strip()}\n\n"
        f"Question: {ex.fields['question'].strip().rstrip('?')}?\n\n"
        "Answer with only Yes or No."
    )


def prompt_piqa(ex: Example) -> str:
    return (
        f"Goal: {ex.fields['goal'].strip()}\n\n"
        f"Which solution is the correct way to achieve the goal?\n{_options_block(ex.fields['options'])}\n\n"
        f"{_letter_instruction(2)}"
    )


def prompt_winogrande(ex: Example) -> str:
    return (
        f"Sentence: {ex.fields['sentence'].strip()}\n\n"
        f"Which option correctly fills in the blank (_)?\n{_options_block(ex.fields['options'])}\n\n"
        f"{_letter_instruction(2)}"
    )


def prompt_socialiqa(ex: Example) -> str:
    return (
        f"Context: {ex.fields['context'].strip()}\n\n"
        f"Question: {ex.fields['question'].strip()}\n{_options_block(ex.fields['options'])}\n\n"
        f"{_letter_instruction(3)}"
    )


def prompt_race(ex: Example) -> str:
    return (
        f"Article:\n{ex.fields['article'].strip()}\n\n"
        f"Question: {ex.fields['question'].strip()}\n{_options_block(ex.fields['options'])}\n\n"
        f"{_letter_instruction(4)}"
    )


def prompt_drop(ex: Example) -> str:
    return (
        f"Passage:\n{ex.fields['passage'].strip()}\n\n"
        f"Question: {ex.fields['question'].strip()}\n\n"
        "Answer with only the answer: a number, a date, or a short span copied from the passage. "
        "If the answer is several separate spans, separate them with ' | '. No units unless they are part of the span."
    )


def parse_drop(text: str) -> list[str]:
    lines = [ln.strip() for ln in text.strip().splitlines() if ln.strip()]
    if not lines:
        return [""]
    answer = re.sub(r"^(answer|final answer)\s*[:\-]\s*", "", lines[-1], flags=re.IGNORECASE)
    answer = answer.strip().strip("*`\"'")
    spans = [s.strip() for s in answer.split("|") if s.strip()]
    return spans or [""]


def score_drop(parsed: list[str], example: Example) -> dict[str, float]:
    em, f1 = score_against_candidates(parsed, example.gold)
    return {"em": em, "f1": f1}


# ---------- registry ----------

SPECS: dict[str, Spec] = {
    "boolq": Spec(
        name="boolq", display_name="BoolQ", split="validation (3,270)", human_score=90.0, human_unit="%",
        human_baseline="paper's human estimate", metric="accuracy",
        build_prompt=prompt_boolq, parse=parse_yes_no, score=_accuracy,
    ),
    "piqa": _mcq_spec("piqa", "PIQA", "validation (1,838)", 94.9, "crowdworkers", prompt_piqa, 2),
    "winogrande": _mcq_spec("winogrande", "WinoGrande", "validation, xl (1,267)", 94.0, "crowdworkers", prompt_winogrande, 2),
    "socialiqa": _mcq_spec("socialiqa", "SocialIQA", "dev (1,954)", 84.4, "crowdworkers", prompt_socialiqa, 3),
    "race": _mcq_spec("race", "RACE", "test, all (4,934)", 94.5, "ceiling performance", prompt_race, 4),
    "drop": Spec(
        name="drop", display_name="DROP", split="dev (9,536)", human_score=96.4, human_unit="F1",
        human_baseline="expert annotators", metric="em_f1",
        build_prompt=prompt_drop, parse=parse_drop, score=score_drop,
    ),
}


def load_examples(name: str) -> list[Example]:
    return LOADERS[name]()


def summarize(spec: Spec, scored: list[dict[str, Any]]) -> dict[str, Any]:
    """Aggregate per-item scores into the headline number and compare with the human baseline."""
    n = len(scored)
    unparsed = sum(1 for s in scored if s.get("parsed") in (None, [""]))
    refused = sum(1 for s in scored if s.get("stop_reason") == "refusal")
    if spec.metric == "accuracy":
        acc = 100.0 * sum(s["scores"]["correct"] for s in scored) / n if n else 0.0
        headline = {"accuracy": round(acc, 2)}
        model_score = acc
    else:
        em = 100.0 * sum(s["scores"]["em"] for s in scored) / n if n else 0.0
        f1 = 100.0 * sum(s["scores"]["f1"] for s in scored) / n if n else 0.0
        headline = {"em": round(em, 2), "f1": round(f1, 2)}
        model_score = f1
    return {
        **headline,
        "n": n,
        "unparsed": unparsed,
        "refused": refused,
        "human_score": spec.human_score,
        "human_unit": spec.human_unit,
        "human_baseline": spec.human_baseline,
        "h_matched": model_score >= spec.human_score,
        "margin": round(model_score - spec.human_score, 2),
    }
