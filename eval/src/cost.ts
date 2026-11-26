import { PRICES } from "./pricing";

/**
 * Prints ESTIMATED costs from VERIFIED list prices and STATED ASSUMPTIONS. Nothing here is measured.
 * Unit: one "draft request" = one student, producing one student message and one parent message.
 */
export const ASSUMPTIONS = {
  inputTokensPerRequest: 1000,
  visibleOutputTokensPerRequest: 400,
  reasoningTokensLow: 0,
  reasoningTokensHigh: 1500,
  retryRate: 0.1,
  acceptanceRates: [0.9, 0.7],
  volumes: [100, 1_000, 10_000, 100_000],
};

export function perRequestUsd(inputPerMTok: number, outputPerMTok: number, reasoningTokens: number): number {
  const a = ASSUMPTIONS;
  return (a.inputTokensPerRequest * inputPerMTok + (a.visibleOutputTokensPerRequest + reasoningTokens) * outputPerMTok) / 1_000_000;
}

function money(value: number): string {
  if (value < 0.01) return `$${value.toFixed(5)}`;
  if (value < 1) return `$${value.toFixed(4)}`;
  if (value < 100) return `$${value.toFixed(2)}`;
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

export function costTable(): string {
  const a = ASSUMPTIONS;
  const rows = [
    "| Model | Tier | Per request (no reasoning) | Per request (+1,500 reasoning tokens) | 100 | 1,000 | 10,000 | 100,000 | 100,000 with 10% retries, high reasoning |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
  ];
  for (const price of PRICES) {
    const low = perRequestUsd(price.inputPerMTok, price.outputPerMTok, a.reasoningTokensLow);
    const high = perRequestUsd(price.inputPerMTok, price.outputPerMTok, a.reasoningTokensHigh);
    const range = (n: number) => `${money(low * n)}–${money(high * n)}`;
    rows.push(
      `| ${price.model} | ${price.tier} | ${money(low)} | ${money(high)} | ${range(100)} | ${range(1_000)} | ${range(10_000)} | ${range(100_000)} | ${money(high * 100_000 * (1 + a.retryRate))} |`,
    );
  }
  rows.push("", "Cost per ACCEPTED draft request at the high-reasoning assumption (rejected outputs are still billed):", "");
  rows.push("| Model | 90% accepted | 70% accepted |", "| --- | --- | --- |");
  for (const price of PRICES) {
    const high = perRequestUsd(price.inputPerMTok, price.outputPerMTok, a.reasoningTokensHigh);
    rows.push(`| ${price.model} | ${money(high / 0.9)} | ${money(high / 0.7)} |`);
  }
  return rows.join("\n");
}

if (process.argv[1]?.endsWith("cost.ts")) {
  console.log("ESTIMATE ONLY. Assumptions:", JSON.stringify(ASSUMPTIONS));
  console.log(costTable());
}
