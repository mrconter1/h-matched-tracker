"""
Dataset loaders for the six "unreported" benchmarks.

Every loader returns the split the paper's human baseline was measured on,
as a list of Example objects, and caches the raw download under eval/data/
(gitignored) so a re-run never touches the network. Sources:

  BoolQ, WinoGrande, RACE   Hugging Face parquet conversions (public, no token)
  PIQA                      the authors' own files on yonatanbisk.com
  SocialIQA                 the AI2 release zip (dev.jsonl + dev-labels.lst)
  DROP                      the AllenNLP release zip - the HF mirror flattens the
                            per-annotator answers, which breaks the official metric
"""
from __future__ import annotations

import io
import json
import zipfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable

import pyarrow.parquet as pq
import requests

DATA_DIR = Path(__file__).resolve().parent / "data"
HF_PARQUET = "https://huggingface.co/datasets/{repo}/resolve/refs%2Fconvert%2Fparquet/{config}/{split}/0000.parquet"


@dataclass
class Example:
    id: str
    fields: dict[str, Any]
    gold: Any
    meta: dict[str, Any] = field(default_factory=dict)


def _fetch(url: str, cache_name: str) -> bytes:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    path = DATA_DIR / cache_name
    if path.exists():
        return path.read_bytes()
    response = requests.get(url, timeout=120)
    response.raise_for_status()
    path.write_bytes(response.content)
    return response.content


def _parquet_rows(repo: str, config: str, split: str) -> list[dict[str, Any]]:
    raw = _fetch(HF_PARQUET.format(repo=repo, config=config, split=split), f"{repo.replace('/', '__')}.{config}.{split}.parquet")
    return pq.read_table(io.BytesIO(raw)).to_pylist()


def load_boolq() -> list[Example]:
    rows = _parquet_rows("google/boolq", "default", "validation")
    return [
        Example(id=f"boolq-{i}", fields={"passage": r["passage"], "question": r["question"]}, gold="yes" if r["answer"] else "no")
        for i, r in enumerate(rows)
    ]


def load_winogrande() -> list[Example]:
    rows = _parquet_rows("allenai/winogrande", "winogrande_xl", "validation")
    return [
        Example(
            id=f"winogrande-{i}",
            fields={"sentence": r["sentence"], "options": [r["option1"], r["option2"]]},
            gold="AB"[int(r["answer"]) - 1],
        )
        for i, r in enumerate(rows)
    ]


def load_race() -> list[Example]:
    rows = _parquet_rows("ehovy/race", "all", "test")
    return [
        Example(
            id=f"race-{i}",
            fields={"article": r["article"], "question": r["question"], "options": list(r["options"])},
            gold=r["answer"].strip().upper(),
            meta={"example_id": r["example_id"]},
        )
        for i, r in enumerate(rows)
    ]


def load_piqa() -> list[Example]:
    base = "https://yonatanbisk.com/piqa/data/"
    items = [json.loads(line) for line in _fetch(base + "valid.jsonl", "piqa.valid.jsonl").decode("utf-8").splitlines() if line.strip()]
    labels = [int(line) for line in _fetch(base + "valid-labels.lst", "piqa.valid-labels.lst").decode("utf-8").split()]
    assert len(items) == len(labels), (len(items), len(labels))
    return [
        Example(id=f"piqa-{i}", fields={"goal": item["goal"], "options": [item["sol1"], item["sol2"]]}, gold="AB"[label])
        for i, (item, label) in enumerate(zip(items, labels))
    ]


def load_socialiqa() -> list[Example]:
    raw = _fetch("https://storage.googleapis.com/ai2-mosaic/public/socialiqa/socialiqa-train-dev.zip", "socialiqa-train-dev.zip")
    with zipfile.ZipFile(io.BytesIO(raw)) as zf:
        names = {Path(n).name: n for n in zf.namelist()}
        items = [json.loads(line) for line in zf.read(names["dev.jsonl"]).decode("utf-8").splitlines() if line.strip()]
        labels = [int(line) for line in zf.read(names["dev-labels.lst"]).decode("utf-8").split()]
    assert len(items) == len(labels), (len(items), len(labels))
    return [
        Example(
            id=f"socialiqa-{i}",
            fields={"context": item["context"], "question": item["question"], "options": [item["answerA"], item["answerB"], item["answerC"]]},
            gold="ABC"[label - 1],
        )
        for i, (item, label) in enumerate(zip(items, labels))
    ]


def load_drop() -> list[Example]:
    raw = _fetch("https://s3-us-west-2.amazonaws.com/allennlp/datasets/drop/drop_dataset.zip", "drop_dataset.zip")
    with zipfile.ZipFile(io.BytesIO(raw)) as zf:
        dev_name = next(n for n in zf.namelist() if n.endswith("drop_dataset_dev.json"))
        dev = json.loads(zf.read(dev_name).decode("utf-8"))
    examples: list[Example] = []
    for section_id, section in dev.items():
        for qa in section["qa_pairs"]:
            candidates = [qa["answer"]] + list(qa.get("validated_answers", []))
            examples.append(
                Example(
                    id=f"drop-{qa['query_id']}",
                    fields={"passage": section["passage"], "question": qa["question"]},
                    gold=candidates,
                    meta={"section_id": section_id},
                )
            )
    return examples


LOADERS: dict[str, Callable[[], list[Example]]] = {
    "boolq": load_boolq,
    "piqa": load_piqa,
    "winogrande": load_winogrande,
    "socialiqa": load_socialiqa,
    "race": load_race,
    "drop": load_drop,
}
