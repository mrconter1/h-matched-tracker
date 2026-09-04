"""
DROP scoring, ported from the official evaluation script
(allennlp/allennlp-reading-comprehension `drop_eval.py`, Dua et al. 2019).

Kept deliberately close to the original so numbers are comparable with
published results: same normalisation, same bag-of-words F1 per span, same
optimal alignment between predicted and gold spans, same "best of all
validated answers" rule. The only substitution is the alignment solver:
the original uses scipy's Hungarian algorithm; this file brute-forces the
assignment for the small bag sizes DROP has (and falls back to greedy for
anything larger), which gives identical results on real data.
"""
from __future__ import annotations

import itertools
import re
import string
from typing import Any, Iterable, Sequence

_EXCLUDE = set(string.punctuation)
_ARTICLES = re.compile(r"\b(a|an|the)\b", re.UNICODE)


def _is_number(text: str) -> bool:
    try:
        float(text)
        return True
    except ValueError:
        return False


def _normalize_number(text: str) -> str:
    return str(float(text)) if _is_number(text) else text


def _remove_articles(text: str) -> str:
    return _ARTICLES.sub(" ", text)


def _white_space_fix(text: str) -> str:
    return " ".join(text.split())


def _remove_punc(text: str) -> str:
    if _is_number(text):
        return text
    return "".join(ch for ch in text if ch not in _EXCLUDE)


def _tokenize(text: str) -> list[str]:
    return re.split(" |-", text)


def normalize_answer(text: str) -> str:
    """Lower text and remove punctuation, articles and extra whitespace."""
    parts = [
        _white_space_fix(_remove_articles(_normalize_number(_remove_punc(token.lower()))))
        for token in _tokenize(text)
    ]
    parts = [part for part in parts if part.strip()]
    return " ".join(parts).strip()


def _answer_to_bags(answer: str | Sequence[str]) -> tuple[list[str], list[set[str]]]:
    raw_spans = list(answer) if isinstance(answer, (list, tuple)) else [answer]
    normalized_spans: list[str] = []
    token_bags: list[set[str]] = []
    for raw_span in raw_spans:
        normalized = normalize_answer(raw_span)
        normalized_spans.append(normalized)
        token_bags.append(set(normalized.split()))
    return normalized_spans, token_bags


def _compute_f1(predicted_bag: set[str], gold_bag: set[str]) -> float:
    intersection = len(gold_bag & predicted_bag)
    precision = intersection / len(predicted_bag) if predicted_bag else 1.0
    recall = intersection / len(gold_bag) if gold_bag else 1.0
    if precision == 0.0 and recall == 0.0:
        return 0.0
    return (2 * precision * recall) / (precision + recall)


def _match_numbers_if_present(gold_bag: set[str], predicted_bag: set[str]) -> bool:
    gold_numbers = {w for w in gold_bag if _is_number(w)}
    predicted_numbers = {w for w in predicted_bag if _is_number(w)}
    return not gold_numbers or bool(gold_numbers & predicted_numbers)


def _align_bags(predicted: list[set[str]], gold: list[set[str]]) -> list[float]:
    """Best one-to-one alignment of predicted spans to gold spans, F1 per gold span."""
    scores = [
        [
            _compute_f1(pred_item, gold_item) if _match_numbers_if_present(gold_item, pred_item) else 0.0
            for pred_item in predicted
        ]
        for gold_item in gold
    ]
    n_gold, n_pred = len(gold), len(predicted)
    size = max(n_gold, n_pred)
    max_scores = [0.0] * size
    if n_gold == 0 or n_pred == 0:
        return max_scores

    # Optimal assignment: exhaustive for the small bag counts DROP actually has.
    if min(n_gold, n_pred) <= 7:
        best_total, best_pairs = -1.0, []
        if n_gold <= n_pred:
            for perm in itertools.permutations(range(n_pred), n_gold):
                total = sum(scores[g][p] for g, p in enumerate(perm))
                if total > best_total:
                    best_total, best_pairs = total, list(enumerate(perm))
        else:
            for perm in itertools.permutations(range(n_gold), n_pred):
                total = sum(scores[g][p] for p, g in enumerate(perm))
                if total > best_total:
                    best_total, best_pairs = total, [(g, p) for p, g in enumerate(perm)]
        for g, p in best_pairs:
            max_scores[g] = max(max_scores[g], scores[g][p])
        return max_scores

    # Greedy fallback for pathological sizes.
    used_pred: set[int] = set()
    for g in sorted(range(n_gold), key=lambda i: -max(scores[i])):
        candidates = [(scores[g][p], p) for p in range(n_pred) if p not in used_pred]
        if candidates:
            s, p = max(candidates)
            used_pred.add(p)
            max_scores[g] = s
    return max_scores


def get_metrics(predicted: str | Sequence[str], gold: str | Sequence[str]) -> tuple[float, float]:
    """Exact match and F1 for one prediction against one gold answer (a span, or several)."""
    predicted_spans, predicted_bags = _answer_to_bags(predicted)
    gold_spans, gold_bags = _answer_to_bags(gold)
    exact_match = 1.0 if set(predicted_spans) == set(gold_spans) and len(predicted_spans) == len(gold_spans) else 0.0
    f1_per_bag = _align_bags(predicted_bags, gold_bags)
    f1 = round(sum(f1_per_bag) / len(f1_per_bag), 2) if f1_per_bag else 0.0
    return exact_match, f1


def answer_json_to_strings(answer: dict[str, Any]) -> tuple[tuple[str, ...], str]:
    """Flatten one DROP answer object (number / spans / date) to the strings the metric compares."""
    if answer.get("number"):
        return (str(answer["number"]),), "number"
    if answer.get("spans"):
        return tuple(answer["spans"]), "span" if len(answer["spans"]) == 1 else "spans"
    date = answer.get("date") or {}
    return ("{0} {1} {2}".format(date.get("day", ""), date.get("month", ""), date.get("year", "")),), "date"


def score_against_candidates(predicted: str | Sequence[str], candidates: Iterable[dict[str, Any]]) -> tuple[float, float]:
    """Best exact match and best F1 over every accepted answer for a question, as the official script does."""
    best_em, best_f1 = 0.0, 0.0
    for candidate in candidates:
        gold_strings, _ = answer_json_to_strings(candidate)
        if not gold_strings or not any(gold_strings):
            continue
        em, f1 = get_metrics(predicted, gold_strings)
        best_em, best_f1 = max(best_em, em), max(best_f1, f1)
    return best_em, best_f1
