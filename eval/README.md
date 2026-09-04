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
```

Two backends, picked from the model id:

| Model id | Backend | Credentials | Notes |
|---|---|---|---|
| `anthropic/claude-sonnet-5` (contains `/`) | OpenRouter | `OPENROUTER_API_KEY` | OpenAI-compatible chat completions with OpenRouter's `reasoning.effort`; a `:batch` suffix buys the half-price, slower tier on the same call |
| `claude-opus-5` (bare) | Anthropic API | `ANTHROPIC_API_KEY` or an `ant auth login` profile | `submit`/`collect` use the Message Batches API (half price, results within 24 h) |

```bash
python run_eval.py dry-run --benchmark all --limit 2                                # prompts + live-priced estimate, no API
python run_eval.py sync    --benchmark winogrande --limit 20 --model anthropic/claude-sonnet-5 --effort low
python run_eval.py sync    --benchmark winogrande --model anthropic/claude-sonnet-5 --effort low --concurrency 8
python run_eval.py sync    --resume results/winogrande/anthropic__claude-sonnet-5_2026-09-03.json   # after an interruption
python run_eval.py submit  --benchmark all --model claude-opus-5 --effort high      # Anthropic batches only
python run_eval.py collect results/boolq/claude-opus-5_2026-09-03.json --wait
python run_eval.py status
```

Progress is saved every 25 items and Ctrl-C keeps what is done, so a run can be
resumed. Raw dataset downloads are cached under `data/` (gitignored); results
under `results/` are committed so every number on the tracker is reproducible.

Start small: WinoGrande is the smallest set (1,267 items) and a low-effort
Sonnet 5 pass over it costs well under a dollar; DROP (9,536 items) is close to
half of everything.

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

## Two findings from the first runs

**Subsets of these datasets are not random samples.** The validation files ship
in a fixed order and the early items are easier. On WinoGrande the first 300
items overstated the full-set score by about three points for both models
measured:

| Model | First 300 | Full 1,267 |
|---|---|---|
| Claude Sonnet 5 | 91.00% | 87.37% |
| Claude Opus 4.6 | 93.67% | 91.08% |

Use `--limit` to check plumbing and cost, never to produce a number. Shuffling
before slicing would fix this and is not yet implemented.

**Adaptive thinking is not the same as thinking.** Reasoning-token counts show
Opus 4.6 spending 128 tokens on a hard arithmetic item and none at all on a
WinoGrande item, which is the model correctly judging the task trivial rather
than a configuration failure. Sonnet 5 returns zero reasoning tokens on this
route even for the hard item. Record which of the two a result is: `usage.reasoning`
is stored per run in the results file.
