# AI cost analysis

Labels: **VERIFIED FACT** · **MEASURED RESULT** · **ESTIMATE** · **ASSUMPTION** · **NOT TESTED** · **REQUIRES USER APPROVAL**.

**No actual API cost has been measured.** Every dollar figure below is an **ESTIMATE** = verified list price ×
assumed tokens. Reproduce with `npm run eval:cost` (prices live in `eval/src/pricing.ts`).

## 1. Unit

One **draft request** = one student → one student message + one parent message (the shape EduFlow already uses).

## 2. Inputs

| Input | Value | Label |
| --- | --- | --- |
| List prices | See AI_MODEL_COMPARISON.md §1 (2026-11-26) | VERIFIED FACT |
| Production prompt size, single-student cases | 1,421–1,499 characters, mean 1,456 (24 cases) | MEASURED RESULT (characters, from `messagesFor()` on the dataset) |
| Template output size per student (student + parent message) | English mean 691 chars, Arabic mean 611 chars | MEASURED RESULT (characters, local templates) |
| Input tokens per request | 1,000 | ASSUMPTION (conservative; ~1.5K characters is likely fewer tokens, but Arabic tokenizes less efficiently and token counts differ by tokenizer) |
| Visible output tokens per request | 400 | ASSUMPTION |
| Thinking/reasoning tokens per request | 0 (low) to 1,500 (high) | ASSUMPTION — the biggest unknown; both vendors bill them as output |
| Retry rate | 10% | ASSUMPTION |
| Acceptance rate (drafts kept after validation) | 90% and 70% shown | ASSUMPTION |

## 3. Estimated cost (USD)

| Model | Tier | Per request (no reasoning) | Per request (+1,500 reasoning tokens) | 100 | 1,000 | 10,000 | 100,000 | 100,000 with 10% retries, high reasoning |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| claude-haiku-5-5 | cost-efficient | $0.00030 | $0.00105 | $0.0300–$0.1050 | $0.3000–$1.05 | $3.00–$10.50 | $30.00–$105 | $116 |
| claude-sonnet-5-5 | higher-capability | $0.00600 | $0.0210 | $0.6000–$2.10 | $6.00–$21.00 | $60.00–$210 | $600–$2,100 | $2,310 |
| claude-opus-5-5 | flagship-reference | $0.0120 | $0.0420 | $1.20–$4.20 | $12.00–$42.00 | $120–$420 | $1,200–$4,200 | $4,620 |
| gpt-6-luna | cost-efficient | $0.00030 | $0.00105 | $0.0300–$0.1050 | $0.3000–$1.05 | $3.00–$10.50 | $30.00–$105 | $116 |
| gpt-6.2-sol | higher-capability | $0.00600 | $0.0210 | $0.6000–$2.10 | $6.00–$21.00 | $60.00–$210 | $600–$2,100 | $2,310 |
| gpt-6.2-astra | flagship-reference | $0.0240 | $0.0840 | $2.40–$8.40 | $24.00–$84.00 | $240–$840 | $2,400–$8,400 | $9,240 |

Cost per ACCEPTED draft request at the high-reasoning assumption (rejected outputs are still billed):

| Model | 90% accepted | 70% accepted |
| --- | --- | --- |
| claude-haiku-5-5 | $0.00117 | $0.00150 |
| claude-sonnet-5-5 | $0.0233 | $0.0300 |
| claude-opus-5-5 | $0.0467 | $0.0600 |
| gpt-6-luna | $0.00117 | $0.00150 |
| gpt-6.2-sol | $0.0233 | $0.0300 |
| gpt-6.2-astra | $0.0933 | $0.1200 |

How to read it: for 1,000 draft requests a month, the cost-efficient models are estimated at **$0.30–$1.05**, and the
higher-capability models at **$6–$21** (ESTIMATE). The cost-efficient pair (Haiku 5.5 vs GPT-6 Luna) and the
higher-capability pair (Sonnet 5.5 vs GPT-6.2 Sol) have identical list prices, so the estimates are identical. Real
differences will come only from measured token use.

## 4. Monthly scenarios (ESTIMATE)

| Scenario (ASSUMPTION) | Draft requests / month | Cost-efficient model | Higher-capability model |
| --- | --- | --- | --- |
| One teacher, championship pilot | 100 | $0.03–$0.11 | $0.60–$2.10 |
| One school | 1,000 | $0.30–$1.05 | $6–$21 |
| Group of schools | 10,000 | $3–$10.50 | $60–$210 |
| Large network | 100,000 | $30–$105 ($116 with 10% retries) | $600–$2,100 ($2,310 with 10% retries) |

## 5. Retries and fallback

- **Retries:** each retry is billed in full. At 10% retries, cost rises ~10% (last column of §3).
- **Rejected output:** if the validator rejects a draft, the tokens are still billed and the teacher gets the free
  local template. Cost per *accepted* draft = cost ÷ acceptance rate (table in §3). Acceptance is NOT TESTED.
- **Fallback:** `AI_PROVIDER=none` or any API error uses the local template at $0 model cost. The demo can run
  entirely on templates for free.
- **Batch APIs** are 50% cheaper on both platforms (VERIFIED FACT) but asynchronous, so not suitable for a teacher
  waiting on screen; possible for overnight drafting. Not used in the estimates.

## 6. Rate limits (VERIFIED FACT, lowest standard paid tier)

| Model | Requests/min | Tokens/min |
| --- | --- | --- |
| claude-haiku-5-5 (Start tier) | 4,000 | 2,000,000 input · 400,000 output |
| claude-sonnet-5-5 (Start tier) | 4,000 | 2,000,000 input · 400,000 output |
| gpt-6-luna (Build tier) | 5,000 | 2,000,000 |
| gpt-6.2-sol (Build tier) | 5,000 | 1,000,000 |

Anthropic Start tier also has a $500/month spend cap; new organizations may begin in a lower "Evaluation" tier
(VERIFIED FACT). At EduFlow's scale (well under 100 requests a minute) none of these limits binds (ESTIMATE).

## 7. Cost of the proposed live evaluation (ESTIMATE)

Worst case computed by the harness's budget guard (every case uses the full 2,000-token output cap; input estimated at
1 token per 2 characters): 27 model cases × 3 repeats.

| Model | Worst case, 1 run | Worst case, 3 runs |
| --- | --- | --- |
| claude-haiku-5-5 | $0.03 | $0.09 |
| claude-sonnet-5-5 | $0.58 | $1.75 |
| gpt-6-luna | $0.03 | $0.09 |
| gpt-6.2-sol | $0.58 | $1.75 |
| **Total** | | **$3.67** |

A cap of **$10** would cover this with margin. Choosing the cap, and funding each account (minimum credit purchase:
UNVERIFIED), **REQUIRES USER APPROVAL**.

## 8. Measured costs

| Model | Tokens | Cost | Cost per accepted draft |
| --- | --- | --- | --- |
| all | NOT TESTED | NOT TESTED | NOT TESTED |
