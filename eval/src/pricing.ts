/**
 * API list prices copied from official pages on 2026-11-26 (Asia/Riyadh).
 * Label: VERIFIED FACT for the values below, at that date. Prices change; re-check before any live run.
 * Subscription prices (Claude Pro/Max, ChatGPT Plus/Pro, Claude Code) are NOT API prices and are not used.
 */
export type ModelPrice = {
  provider: "anthropic" | "openai";
  model: string;
  tier: "cost-efficient" | "higher-capability" | "flagship-reference";
  inputPerMTok: number;
  outputPerMTok: number;
  cachedInputPerMTok: number | null;
  priceCondition: string;
  contextWindow: string;
  maxOutput: string;
  sources: string[];
  verifiedOn: string;
};

const ANTHROPIC_SOURCES = [
  "https://docs.anthropic.com/en/docs/about-claude/models/overview",
  "https://docs.anthropic.com/en/docs/about-claude/pricing",
];
const OPENAI_PRICING = "https://platform.openai.com/docs/pricing";

export const PRICES: ModelPrice[] = [
  {
    provider: "anthropic",
    model: "claude-haiku-5-5",
    tier: "cost-efficient",
    inputPerMTok: 0.1,
    outputPerMTok: 0.5,
    cachedInputPerMTok: 0.01,
    priceCondition: "Prompts up to 100,000 tokens. Over 100,000 tokens: $0.50 in / $2.50 out.",
    contextWindow: "1M tokens",
    maxOutput: "128K tokens",
    sources: ANTHROPIC_SOURCES,
    verifiedOn: "2026-11-26",
  },
  {
    provider: "anthropic",
    model: "claude-sonnet-5-5",
    tier: "higher-capability",
    inputPerMTok: 2,
    outputPerMTok: 10,
    cachedInputPerMTok: 0.1,
    priceCondition: "Base price.",
    contextWindow: "1M tokens",
    maxOutput: "128K tokens",
    sources: ANTHROPIC_SOURCES,
    verifiedOn: "2026-11-26",
  },
  {
    provider: "anthropic",
    model: "claude-opus-5-5",
    tier: "flagship-reference",
    inputPerMTok: 4,
    outputPerMTok: 20,
    cachedInputPerMTok: 0.2,
    priceCondition: "Base price.",
    contextWindow: "1M tokens",
    maxOutput: "128K tokens",
    sources: ANTHROPIC_SOURCES,
    verifiedOn: "2026-11-26",
  },
  {
    provider: "openai",
    model: "gpt-6-luna",
    tier: "cost-efficient",
    inputPerMTok: 0.1,
    outputPerMTok: 0.5,
    cachedInputPerMTok: 0.01,
    priceCondition: "Standard, short context. Over 272K input tokens: 2x input, 1.5x output.",
    contextWindow: "1,050,000 tokens",
    maxOutput: "128,000 tokens",
    sources: [OPENAI_PRICING, "https://platform.openai.com/docs/models/gpt-6-luna"],
    verifiedOn: "2026-11-26",
  },
  {
    provider: "openai",
    model: "gpt-6.2-sol",
    tier: "higher-capability",
    inputPerMTok: 2,
    outputPerMTok: 10,
    cachedInputPerMTok: 0.1,
    priceCondition: "Standard, short context. Over 272K input tokens: 2x input, 1.5x output.",
    contextWindow: "1,050,000 tokens",
    maxOutput: "128,000 tokens",
    sources: [OPENAI_PRICING, "https://platform.openai.com/docs/models/gpt-6.2-sol"],
    verifiedOn: "2026-11-26",
  },
  {
    provider: "openai",
    model: "gpt-6.2-astra",
    tier: "flagship-reference",
    inputPerMTok: 8,
    outputPerMTok: 40,
    cachedInputPerMTok: 0.4,
    priceCondition: "Standard, short context. Over 272K: $16 in / $60 out.",
    contextWindow: "1,050,000 tokens",
    maxOutput: "128,000 tokens",
    sources: [OPENAI_PRICING, "https://platform.openai.com/docs/models/gpt-6.2-astra"],
    verifiedOn: "2026-11-26",
  },
];

export function priceFor(model: string): ModelPrice | null {
  return PRICES.find((item) => item.model === model) ?? null;
}

export function costUsd(model: string, inputTokens: number, outputTokens: number): number | null {
  const price = priceFor(model);
  if (!price) return null;
  return (inputTokens * price.inputPerMTok + outputTokens * price.outputPerMTok) / 1_000_000;
}
