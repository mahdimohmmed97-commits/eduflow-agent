# AI model recommendation — PROVISIONAL

Labels: **VERIFIED FACT** · **MEASURED RESULT** · **ESTIMATE** · **ASSUMPTION** · **NOT TESTED** · **REQUIRES USER APPROVAL**.

> **This recommendation is provisional.** No live evaluation has been run. No model has "won". Nothing here is
> evidence that Claude or GPT writes better or safer EduFlow drafts.

## 1. Three architectures

| | Option A — Claude primary | Option B — GPT primary | Option C — Provider-agnostic, one active |
| --- | --- | --- | --- |
| Quality | NOT TESTED | NOT TESTED | Lets you switch to whichever wins the eval, without rewriting |
| Safety | Same validator + approval; model behaviour NOT TESTED | Same | Same; one provider at a time keeps the safety surface the size of one |
| Cost | Identical list prices to B per tier (VERIFIED FACT); real cost NOT TESTED | Same | Same as the active provider |
| Complexity | One adapter | One adapter | Two adapters + a selector. **Already exists** in `lib/model-provider.ts` (`AI_PROVIDER=none/openai/anthropic`) |
| Reliability | Single vendor; template fallback on any error | Same | Same at runtime (no automatic cross-vendor failover is proposed); a manual switch is possible if one vendor has an outage |
| Maintenance | One API to track | One API to track | Two APIs to track; both adapters need the parameter fixes in AI_SAFETY_EVALUATION.md §5 |
| Beginner founder | Simplest mental model | Simplest mental model | One setting to change; slightly more to keep updated |
| Championship demo | Fine | Fine | Strongest story: "we measured both and chose on evidence; the agent stays safe on templates if the AI is off" |

## 2. Provisional recommendation

**Option C — keep the existing provider-agnostic layer, with exactly one provider active, and keep
`AI_PROVIDER=none` (local templates) until a live evaluation is approved and run.**

- **Confidence: LOW** for which model to activate (no measured data).
- **Confidence: MEDIUM** for the architecture itself, because it is already built and tested in the repo, costs nothing
  to keep, and avoids committing to a vendor before evidence exists (reasoning from code reading, not measurement).
- First candidates to measure: the cost-efficient pair `claude-haiku-5-5` vs `gpt-6-luna` (same list price; estimated
  $0.30–$1.05 per 1,000 draft requests — ESTIMATE), with `claude-sonnet-5-5` vs `gpt-6.2-sol` as the quality check.
  If a cost-efficient model has zero raw critical failures on the adversarial cases and human ratings close to the
  higher-capability model, prefer it.

Why not pick A or B now: list prices are identical per tier, and quality, safety and token use are all NOT TESTED.
Choosing now would be choosing by fame.

## 3. Before any AI provider is switched on (all REQUIRE USER APPROVAL)

1. Fix the adapter parameters (remove `temperature`, set effort, raise Anthropic `max_tokens`, update default model IDs)
   — a separate PR. Without this, current Claude 5.5 and GPT-6.2 models are expected to reject requests and the app
   would silently stay on templates (VERIFIED FACT from vendor docs; live behaviour NOT TESTED).
2. Fix per-message source labeling so a template is never shown as AI.
3. Strengthen `lib/claims.ts` for the 12 probe gaps that matter most.
4. Run the live evaluation (below), add blind human ratings, then pick the active provider.

## 4. Implementation plan (Section 9)

| Step | Deliverable | State |
| --- | --- | --- |
| 1 | Evaluation dataset | Done — `eval/dataset/cases.json` (30 fictional cases) |
| 2 | Rubric | Done — AI_EVALUATION_METHODOLOGY.md §5–6, `eval/src/scoring.ts` |
| 3 | Test runner | Done — `eval/src/run.ts`, offline modes tested |
| 4 | Results report template | Done — methodology §9; runner writes per-run `.md` |
| 5 | Cost methodology | Done — AI_COST_ANALYSIS.md, `npm run eval:cost` |
| 6 | Provider integration review | Done — AI_MODEL_COMPARISON.md §3 |
| 7 | Safety test cases | Done — dataset C13–C30, `npm run eval:probes` |
| 8 | Live run | **REQUIRES USER APPROVAL** (budget cap, eval-only keys, account funding) |
| 9 | Production adapter and validator fixes | **REQUIRES USER APPROVAL** (separate PR) |
| 10 | Activate one provider | **REQUIRES USER APPROVAL** (after 8 and 9) |

## 5. What the owner needs to approve next

1. Whether to run a live evaluation at all, and a **maximum spend** (estimated worst case $3.67 for 4 models × 27
   cases × 3 repeats; a $10 cap suggested).
2. Creating eval-only API keys on the Anthropic and OpenAI consoles (the owner does this; keys are never committed),
   and any prepaid credit those accounts require.
3. A separate PR for the production adapter, labeling, and validator fixes.
4. Who does the blind human ratings (fictional data only).

## 6. Final table (to fill after the live run)

| Model | Mean score | Raw critical failures (adversarial) | Human writing AR / EN | Cost per accepted draft | Latency | Decision |
| --- | --- | --- | --- | --- | --- | --- |
| claude-haiku-5-5 | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | — |
| claude-sonnet-5-5 | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | — |
| gpt-6-luna | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | — |
| gpt-6.2-sol | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | — |
