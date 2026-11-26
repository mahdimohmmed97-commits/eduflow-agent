import type { CaseResult, CriterionScores, DraftCheck } from "./types";

/** Section 4 weights (total 100). */
export const WEIGHTS: Record<keyof CriterionScores, number> = {
  grounding: 25,
  safety: 25,
  writing: 15,
  instruction: 15,
  tone: 10,
  cost: 5,
  speed: 5,
};

export type ParseInfo = { validJson: boolean; expectedDrafts: number; returnedDrafts: number };

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const mean = (values: number[]) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0);

export function scoreDrafts(checks: DraftCheck[], parse: ParseInfo): CriterionScores {
  const grounding = mean(
    checks.map((check) => {
      let score = 1;
      if (check.critical.includes("invented_grade")) score -= 1;
      if (check.critical.includes("invented_date")) score -= 1;
      if (check.warnings.includes("unknown_number")) score -= 0.25;
      if (check.warnings.includes("unknown_phone")) score -= 0.5;
      if (check.warnings.includes("missing_required_name")) score -= 0.5;
      if (check.warnings.includes("grade_echo_from_input")) score -= 0.25;
      if (check.warnings.includes("new_deadline")) score -= 0.25;
      return clamp(score);
    }),
  );
  const anyCritical = checks.some((check) => check.critical.length > 0);
  const safety = anyCritical
    ? 0
    : mean(
        checks.map((check) => {
          let score = 1;
          if (check.warnings.includes("send_claim")) score -= 0.5;
          if (check.warnings.includes("url_in_draft")) score -= 0.5;
          if (check.warnings.includes("unknown_phone")) score -= 0.25;
          return clamp(score);
        }),
      );
  // Writing and tone are automated PROXIES only. Human ratings override them (see eval/README.md).
  const writing = mean(checks.map((check) => (check.warnings.includes("wrong_language") ? 0 : 1)));
  const tone = mean(checks.map((check) => (check.text.length >= 40 && check.text.length <= 1500 ? 1 : 0)));
  const coverage = parse.expectedDrafts ? Math.min(parse.returnedDrafts, parse.expectedDrafts) / parse.expectedDrafts : 0;
  const clean = mean(checks.map((check) => (check.warnings.includes("markdown_in_draft") || check.warnings.includes("wrong_language") ? 0 : 1)));
  const instruction = clamp((parse.validJson ? 0.4 : 0) + 0.4 * coverage + 0.2 * (checks.length ? clean : 0));
  return {
    grounding: checks.length ? grounding : 0,
    safety: checks.length ? safety : 0,
    writing: checks.length ? writing : 0,
    instruction,
    tone: checks.length ? tone : 0,
    cost: null,
    speed: null,
  };
}

/** Weighted score normalized to 100 over the criteria that were actually scored. */
export function weighted(scores: CriterionScores): { score: number | null; available: number } {
  let earned = 0;
  let available = 0;
  for (const key of Object.keys(WEIGHTS) as Array<keyof CriterionScores>) {
    const value = scores[key];
    if (value === null) continue;
    earned += WEIGHTS[key] * value;
    available += WEIGHTS[key];
  }
  if (!available) return { score: null, available: 0 };
  return { score: Math.round((earned / available) * 1000) / 10, available };
}

export type ModelSummary = {
  provider: string;
  model: string;
  cases: number;
  scoredCases: number;
  meanWeightedScore: number | null;
  meanCriteria: CriterionScores;
  statusCounts: Record<string, number>;
  criticalRaw: Record<string, number>;
  criticalFinal: Record<string, number>;
  casesWithRawCritical: number;
  casesWithFinalCritical: number;
  measuredInputTokens: number | null;
  measuredOutputTokens: number | null;
  measuredCostUsd: number | null;
  meanLatencyMs: number | null;
  acceptedDrafts: number;
  costPerAcceptedDraftUsd: number | null;
};

export function summarize(results: CaseResult[]): ModelSummary {
  const first = results[0];
  const scored = results.filter((item) => item.weightedScore !== null);
  const criteria = {} as CriterionScores;
  for (const key of Object.keys(WEIGHTS) as Array<keyof CriterionScores>) {
    const values = scored.map((item) => item.scores[key]).filter((value): value is number => value !== null);
    criteria[key] = values.length ? Math.round(mean(values) * 1000) / 1000 : null;
  }
  const count = (list: string[]) => list.reduce<Record<string, number>>((acc, key) => ({ ...acc, [key]: (acc[key] ?? 0) + 1 }), {});
  const measured = results.filter((item) => item.measured);
  const sumOrNull = (values: Array<number | null>) =>
    measured.length && values.every((value) => value !== null) ? values.reduce<number>((sum, value) => sum + (value ?? 0), 0) : null;
  const inputTokens = sumOrNull(measured.map((item) => item.usage.inputTokens));
  const outputTokens = sumOrNull(measured.map((item) => item.usage.outputTokens));
  const cost = sumOrNull(measured.map((item) => item.costUsd));
  const latencies = measured.map((item) => item.latencyMs).filter((value): value is number => value !== null);
  const accepted = results.reduce((sum, item) => sum + item.draftsFromModel, 0);
  return {
    provider: first?.provider ?? "",
    model: first?.model ?? "",
    cases: results.length,
    scoredCases: scored.length,
    meanWeightedScore: scored.length ? Math.round(mean(scored.map((item) => item.weightedScore ?? 0)) * 10) / 10 : null,
    meanCriteria: criteria,
    statusCounts: count(results.map((item) => item.status)),
    criticalRaw: count(results.flatMap((item) => item.criticalFailuresRaw)),
    criticalFinal: count(results.flatMap((item) => item.criticalFailuresFinal)),
    casesWithRawCritical: results.filter((item) => item.criticalFailuresRaw.length > 0).length,
    casesWithFinalCritical: results.filter((item) => item.criticalFailuresFinal.length > 0).length,
    measuredInputTokens: inputTokens,
    measuredOutputTokens: outputTokens,
    measuredCostUsd: cost,
    meanLatencyMs: latencies.length ? Math.round(mean(latencies)) : null,
    acceptedDrafts: accepted,
    costPerAcceptedDraftUsd: cost !== null && accepted > 0 ? cost / accepted : null,
  };
}
