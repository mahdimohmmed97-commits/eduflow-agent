# AI model comparison — Claude vs GPT for EduFlow

Verification date for every fact below: **2026-11-26** (Asia/Riyadh). Prices are API list prices in USD per
million tokens (MTok). Subscription prices (Claude Pro/Max, Claude Code, ChatGPT Plus/Pro) are not API prices
and are not used anywhere in this evaluation.

Labels: **VERIFIED FACT** (read on an official page on the date above) · **MEASURED RESULT** · **ESTIMATE** ·
**ASSUMPTION** · **NOT TESTED** · **REQUIRES USER APPROVAL**.

> **NOT TESTED:** No Claude or GPT model has been called. There are no measured quality, safety, latency,
> or token results for any model in this document.

## 1. Candidate models

| Provider | Role in eval | Exact API model ID | Input $/MTok | Output $/MTok | Cached input $/MTok | Context window | Max output | Label |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Anthropic | Cost-efficient | `claude-haiku-5-5` | 0.10 (prompts ≤100K tokens) · 0.50 (>100K) | 0.50 (≤100K) · 2.50 (>100K) | 0.01 (≤100K) | 1M | 128K | VERIFIED FACT |
| Anthropic | Higher-capability | `claude-sonnet-5-5` | 2 | 10 | 0.10 | 1M | 128K | VERIFIED FACT |
| Anthropic | Flagship reference (optional) | `claude-opus-5-5` | 4 | 20 | 0.20 | 1M | 128K | VERIFIED FACT |
| OpenAI | Cost-efficient | `gpt-6-luna` | 0.10 | 0.50 | 0.01 | 1,050,000 | 128,000 | VERIFIED FACT |
| OpenAI | Higher-capability | `gpt-6.2-sol` | 2 | 10 | 0.10 | 1,050,000 | 128,000 | VERIFIED FACT |
| OpenAI | Flagship reference (optional) | `gpt-6.2-astra` | 8 | 40 | 0.40 | 1,050,000 | 128,000 | VERIFIED FACT |

OpenAI prices are Standard, short-context. Over 272K input tokens OpenAI charges 2x input and 1.5x output for the
whole request (VERIFIED FACT). EduFlow prompts are about 1.5K characters, far below both thresholds (MEASURED RESULT on
the dataset prompts; see AI_COST_ANALYSIS.md).

**VERIFIED FACT:** At list price the two cost-efficient models cost the same per token ($0.10 / $0.50), and so do the
two higher-capability models ($2 / $10). Any real cost difference will come from how many tokens each model uses
(tokenizer, reasoning or thinking tokens, retries). That can only be known by measurement (**NOT TESTED**).

### Sources

- Anthropic models overview: https://docs.anthropic.com/en/docs/about-claude/models/overview
- Anthropic pricing: https://docs.anthropic.com/en/docs/about-claude/pricing
- Anthropic rate limits: https://docs.anthropic.com/en/api/rate-limits
- Anthropic Sonnet 5.5 migration guide (sampling and thinking): https://platform.claude.com/docs/en/models/sonnet-5-5/migration-guide
- Anthropic thinking reference: https://platform.claude.com/docs/en/build-with-claude/thinking
- OpenAI models: https://platform.openai.com/docs/models
- OpenAI pricing: https://platform.openai.com/docs/pricing
- OpenAI model pages: https://platform.openai.com/docs/models/gpt-6-luna · https://platform.openai.com/docs/models/gpt-6.2-sol · https://platform.openai.com/docs/models/gpt-6.2-astra
- OpenAI GPT-6 guide (parameter compatibility): https://developers.openai.com/api/docs/guides/latest-model/gpt-6-astra
- OpenAI reasoning guide: https://developers.openai.com/api/docs/guides/reasoning

## 2. Features and limits that matter for EduFlow

| Topic | Anthropic (Haiku 5.5 / Sonnet 5.5) | OpenAI (GPT-6 Luna / GPT-6.2 Sol) | Label |
| --- | --- | --- | --- |
| Arabic and English | "Multilingual capabilities" listed for all current models | "Multilingual capabilities" listed for all latest models | VERIFIED FACT (vendor claim). Arabic quality for EduFlow: NOT TESTED |
| Reasoning / thinking | Adaptive thinking on by default. Default effort: Haiku 5.5 `medium`, Sonnet 5.5 `high`. Haiku 5.5 can turn thinking off (`disabled`) at `high` effort or below; Sonnet 5.5 uses `between_tools` instead | `reasoning_effort` supported. Luna: `none`…`max`, default `medium`. GPT-6.2 Sol rejects `none` | VERIFIED FACT |
| Thinking/reasoning tokens billed | Thinking tokens are billed as output tokens | Reasoning tokens are output tokens (model pages list "reasoning token support") | VERIFIED FACT (Anthropic, stated explicitly). OpenAI billing of reasoning tokens as output: ASSUMPTION based on the reasoning guide, re-check before a live run |
| Sampling parameters | `temperature`, `top_p`, `top_k` at non-default values return HTTP 400 on Haiku 5.5, Sonnet 5.5 and Opus 5.5 | Remove `temperature`/`top_p` when reasoning effort is not `none` (GPT-6 guide). GPT-6.2 Sol rejects `none` | VERIFIED FACT |
| JSON output | Structured output: not checked in this pass | `structured_outputs` listed on both model pages; Chat Completions supported | OpenAI: VERIFIED FACT. Anthropic structured outputs: NOT VERIFIED here |
| Endpoint used by EduFlow | `POST /v1/messages` | `POST /v1/chat/completions` (supported for both models) | VERIFIED FACT |
| Rate limits (lowest paid tier) | Start tier: Haiku 5.5 and Sonnet 5.5 each 4,000 RPM, 2,000,000 input tokens/min, 400,000 output tokens/min. Start-tier monthly spend cap $500. New orgs may start in a lower "Evaluation" tier | Build tier: Luna 5,000 RPM / 2,000,000 TPM; GPT-6.2 Sol 5,000 RPM / 1,000,000 TPM | VERIFIED FACT. Your own account's tier: NOT VERIFIED |
| Retirement | Haiku 5.5 not sooner than 2027-10-07; Sonnet 5.5 not sooner than 2027-09-28 | Not stated on the pages read | VERIFIED FACT (Anthropic); OpenAI: UNVERIFIED |
| Data residency | Not checked | EU data residency available for Luna | Not relevant to the Gulf decision yet; UAE/KSA residency: UNVERIFIED for both |

## 3. Compatibility of the current EduFlow code with these models

Read from `lib/model-provider.ts` and `.env.example` at commit `af2467d`:

| Finding | Effect | Label |
| --- | --- | --- |
| Both adapters send `temperature: 0.4` | Per the official docs above, Claude Haiku/Sonnet/Opus 5.5 return HTTP 400 for non-default temperature. GPT-6.2 Sol cannot run at effort `none`, so temperature must be removed. The route catches the error and silently uses the local template, so **AI drafts would never appear** with these models. | VERIFIED FACT (docs) + code reading. Live behaviour: NOT TESTED |
| Default `ANTHROPIC_MODEL=claude-sonnet-4-5` | Anthropic lists Claude Sonnet 4.5 as deprecated on the Claude API ($3 / $15). | VERIFIED FACT |
| Default `OPENAI_MODEL=gpt-4o-mini` | Still on the OpenAI pricing page ($0.15 / $0.60) but not among the current flagship models. | VERIFIED FACT |
| Anthropic `max_tokens: 1200` | On models with thinking on by default, `max_tokens` covers thinking plus text, so output can be cut off. | VERIFIED FACT (docs); effect on EduFlow: NOT TESTED |
| Anthropic adapter reads only `text` blocks | Correct for responses that start with `thinking` blocks. | Code reading |
| No token usage or latency is recorded by the app | Production cost cannot be measured from the app today. | Code reading |

Fixing these is a production change. It is **not** part of this PR (**REQUIRES USER APPROVAL**). The evaluation
harness (`eval/src/providers.ts`) already omits sampling parameters and records usage and latency.

## 4. What is still unknown

| Question | Status |
| --- | --- |
| Which model writes better Arabic follow-ups for Gulf parents? | NOT TESTED |
| Which model resists the 8 injection cases? | NOT TESTED |
| Real tokens per draft, including thinking/reasoning tokens | NOT TESTED |
| Latency from the Gulf region | NOT TESTED |
| Whether `output_config.effort` is accepted by Haiku 5.5 with API version `2023-06-01` | ASSUMPTION — confirm in the first approved run |
| Minimum prepaid credit purchase on each platform | UNVERIFIED |
