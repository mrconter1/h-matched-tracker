# Eval harness for the unreported benchmarks

Seven benchmarks on the tracker are marked *unreported*: no lab has published a
frontier-model score on them for about two years, so nobody knows whether they
are still below the human baseline. Six of them are public, cheap to run and
have a clear human number. This folder measures them.

| Benchmark  | Split used (same as the paper's human baseline) | Items | Human | Metric |
|------------|--------------------------------------------------|------:|------:|--------|
| BoolQ      | validation                                       | 3,270 | 90%   | accuracy |
| PIQA       | validation                                       | 1,838 | 94.9% | accuracy |
| WinoGrande | validation, xl                                   | 1,267 | 94.0% | accuracy |
| SocialIQA  | dev                                              | 1,954 | 84.4% | accuracy |
| RACE       | test, middle + high                              | 4,934 | 94.5% | accuracy |
| DROP       | dev                                              | 9,536 | 96.4  | F1 (official script) |

SpatialSense is the seventh and is image-based with no maintained release, so it
is left out.

## Method

- Zero-shot. One fixed system prompt, one fixed template per benchmark, the item
  verbatim, and an instruction to answer with the letter / Yes-No / the span only.
  The full prompts are stored in every results file.
- Adaptive thinking at the chosen `--effort` (default `high`). No sampling
  parameters are sent: the current models reject them.
- Strict parsing. A reply that is not a bare answer in the requested format counts
  as wrong and is reported in `unparsed`. A model that will not follow a
  two-word format instruction has not answered the question.
- DROP is scored with a line-by-line port of the official `drop_eval.py`
  (normalisation, per-span bag-of-words F1, optimal span alignment, best of all
  validated answers). Multi-span answers are requested as `span | span`.
- Contamination caveat: every one of these datasets is old enough to be in any
  pretraining corpus. A pass answers "is this benchmark still open?", not "has the
  model learned the skill". The tracker says so where the numbers are used.

## Running

```bash
pip install -r requirements.txt
# credentials: ANTHROPIC_API_KEY in the environment, or an `ant auth login` profile

python run_eval.py dry-run --benchmark all --limit 2          # prompts + cost estimate, no API
python run_eval.py sync    --benchmark boolq --limit 20       # quick live smoke test
python run_eval.py submit  --benchmark all --model claude-opus-5 --effort high
python run_eval.py status
python run_eval.py collect results/boolq/claude-opus-5_2026-09-03.json --wait
```

`submit` uses the Message Batches API (half price, results within 24 h).
`collect` fetches a finished batch, scores it and writes the summary into the
same file. Raw dataset downloads are cached under `data/` (gitignored); results
under `results/` are committed so every number on the tracker is reproducible.

## Results file

```
results/<benchmark>/<model>_<date>.json
  benchmark, split, model, effort, max_tokens, system_prompt, prompt_fingerprint
  summary: accuracy | em + f1, n, unparsed, refused, human_score, h_matched, margin
  items[]: id, prompt, gold, response, parsed, scores, stop_reason, usage
```

## Adding the result to the tracker

Set `solved.date` to the run date, `solved.model` / `solved.score` from the
summary, `solved.conditions` to `"zero-shot, effort=<x>, measured by this repo"`,
and link the results file as a reference. Leave `status: "unreported"` in place
if the run is below the baseline - it is now *measured and open*, so drop the
status field and let it fall into the open group instead.
