import type { ModelSummary } from "./scoring";
import type { CaseResult } from "./types";

export function markdownReport(meta: Record<string, unknown>, summary: ModelSummary, results: CaseResult[]): string {
  const live = Boolean(meta.live);
  const label = live ? "MEASURED RESULT (live API run)" : "NOT A MODEL RESULT (offline run: mock or template). Do not cite as model evidence.";
  const lines = [
    `# EduFlow AI evaluation run — ${summary.provider} / ${summary.model}`,
    "",
    `**Label:** ${label}`,
    "",
    "| Field | Value |",
    "| --- | --- |",
    ...Object.entries(meta).map(([key, value]) => `| ${key} | ${typeof value === "string" ? value : JSON.stringify(value)} |`),
    "",
    "## Summary",
    "",
    "| Metric | Value |",
    "| --- | --- |",
    `| Cases | ${summary.cases} (scored: ${summary.scoredCases}) |`,
    `| Mean weighted score (normalized over scored criteria) | ${summary.meanWeightedScore ?? "n/a"} |`,
    `| Status counts | ${JSON.stringify(summary.statusCounts)} |`,
    `| Cases with a critical failure in RAW model output | ${summary.casesWithRawCritical} |`,
    `| Critical failures, raw | ${JSON.stringify(summary.criticalRaw)} |`,
    `| Cases with a critical failure in FINAL drafts (after validator/fallback) | ${summary.casesWithFinalCritical} |`,
    `| Critical failures, final | ${JSON.stringify(summary.criticalFinal)} |`,
    `| Measured input / output tokens | ${summary.measuredInputTokens ?? "not measured"} / ${summary.measuredOutputTokens ?? "not measured"} |`,
    `| Measured cost (USD, tokens x verified list price) | ${summary.measuredCostUsd ?? "not measured"} |`,
    `| Mean latency (ms) | ${summary.meanLatencyMs ?? "not measured"} |`,
    `| Drafts accepted from model | ${summary.acceptedDrafts} |`,
    `| Cost per accepted draft (USD) | ${summary.costPerAcceptedDraftUsd ?? "not measured"} |`,
    "",
    "Criterion means (0–1; writing and tone are automated proxies until human ratings are added):",
    "",
    "```json",
    JSON.stringify(summary.meanCriteria, null, 2),
    "```",
    "",
    "## Per case",
    "",
    "| Case | Difficulty | Status | Score | Raw critical | Final critical | Warnings (raw) |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...results.map((item) => {
      const warnings = [...new Set(item.rawChecks.flatMap((check) => check.warnings))].join(", ") || "—";
      return `| ${item.caseId} | ${item.difficulty} | ${item.status} | ${item.weightedScore ?? "—"} | ${item.criticalFailuresRaw.join(", ") || "—"} | ${item.criticalFailuresFinal.join(", ") || "—"} | ${warnings} |`;
    }),
    "",
  ];
  return lines.join("\n");
}
