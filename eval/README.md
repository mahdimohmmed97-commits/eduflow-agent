# EduFlow AI evaluation harness

Offline-first harness for comparing Claude and GPT on EduFlow homework follow-up drafts.
**No live model has been evaluated yet.** Everything this folder produces without a live run is labeled
"NOT A MODEL RESULT".

## What it does

- Loads 30 fictional cases from `dataset/cases.json` (`EVAL-DS-1`).
- Sends each case through the production request parser (`explainAgentRequest`) and the production prompt
  (`messagesFor`, prompt version `P1-production-messagesFor@af2467d`), so every provider sees identical input.
  The SHA-256 of the exact messages is stored per case.
- Runs one adapter: `template`, `mock`, `mock-unsafe`, `anthropic`, or `openai`.
- Checks the **raw** model output (to measure the model) and the **final** drafts after the production
  validator and template fallback (to measure the pipeline).
- Scores each case with the Section 4 weights; records critical failures separately.
- Pushes every final draft through the production approval path and confirms `sent: false`.
- Writes `eval/results/<provider>-<model>-<time>.json` and `.md` (git-ignored).

Status values: `success`, `rejected_unsafe_output` (production validator replaced at least one draft
with the template), `fallback_template` (no model called), `api_failure`, `timeout`, `incomplete`
(invalid JSON, a missing draft, or a length stop), `input_rejected` (the parser rejected the record
before any model call, as the case expected), `unexpected_input_rejection`.

## Commands (all offline, no network, no cost)

```bash
npm run eval:template      # local templates only
npm run eval:mock          # deterministic compliant stand-in (NOT a model)
npm run eval:mock-unsafe   # deterministic unsafe stand-in; proves the checks catch failures
npm run eval:probes        # probes the production validator with fictional drafts
npm run eval:heldout       # Phase 9 held-out set: legacy vs Phase 9 validator, templates before/after
npm run eval:postfix       # Phase 9 post-fix probes (written after the fixes, not used for tuning)
npm run eval:cost          # cost ESTIMATES from verified list prices + stated assumptions
```

## Live runs: disabled. They need the owner's written approval and a spending cap

A live run is impossible unless **all** of these are set by a person, outside the repo:

| Variable | Meaning |
| --- | --- |
| `EDUFLOW_EVAL_LIVE` | must equal `i-have-written-approval-and-a-budget` |
| `EDUFLOW_EVAL_MAX_USD` | the approved spending cap in USD |
| `EDUFLOW_EVAL_ANTHROPIC_KEY` / `EDUFLOW_EVAL_OPENAI_KEY` | an eval-only key; the app's `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` are never read |

The model must also have a verified price in `src/pricing.ts`. Before the first call, the runner computes a
worst-case cost (every case at the full output cap) and refuses to start if it exceeds the cap. During the
run it stops when measured spend reaches the cap.

Example (do **not** run without approval):

```bash
npx tsx eval/src/run.ts --provider anthropic --model claude-haiku-5-5 --effort low --max-output-tokens 2000 --repeats 3
npx tsx eval/src/run.ts --provider openai    --model gpt-6-luna       --effort low --max-output-tokens 2000 --repeats 3
```

## Human ratings

Writing quality (15) and tone (10) are scored by automated **proxies** (language/script check and length
bounds). They are not a judgment of quality. Before any recommendation is final, two people should rate
each live draft 0–1 for writing and tone, blind to the model name, and those ratings should replace the proxies.

## Limits of the checks

The checks are pattern-based. They miss grades written in words, behaviour or attendance claims, and
leaks of names that the case does not list. They can also flag false positives (for example a short
Arabic given name inside a longer word). Passing them is not proof of safety; teacher review stays mandatory.
