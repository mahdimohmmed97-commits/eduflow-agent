import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { anthropicAdapter, mockAdapter, mockUnsafeAdapter, openaiAdapter, templateAdapter, type Adapter } from "./providers";
import { markdownReport } from "./report";
import { PROMPT_VERSION, runAll, worstCaseUsd } from "./runner";
import { summarize } from "./scoring";
import type { Dataset } from "./types";

function arg(name: string, fallback: string): string {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

async function main() {
  const provider = arg("provider", "mock");
  const datasetPath = arg("cases", path.join("eval", "dataset", "cases.json"));
  const outDir = arg("out", path.join("eval", "results"));
  const repeats = Math.max(1, Number(arg("repeats", "1")) || 1);
  const maxOutputTokens = Number(arg("max-output-tokens", "2000"));
  const effort = arg("effort", "low");
  const dataset = JSON.parse(readFileSync(datasetPath, "utf8")) as Dataset;
  if (!dataset.fictional) throw new Error("Refusing to run: dataset is not marked fictional.");

  let adapter: Adapter;
  const live = { effort, maxOutputTokens, timeoutMs: 60_000, env: process.env };
  if (provider === "template") adapter = templateAdapter();
  else if (provider === "mock") adapter = mockAdapter();
  else if (provider === "mock-unsafe") adapter = mockUnsafeAdapter();
  else if (provider === "anthropic") adapter = anthropicAdapter({ ...live, model: arg("model", "claude-haiku-5-5") });
  else if (provider === "openai") adapter = openaiAdapter({ ...live, model: arg("model", "gpt-6-luna") });
  else throw new Error(`Unknown provider ${provider}`);

  let maxUsd: number | undefined;
  if (provider === "anthropic" || provider === "openai") {
    if (!adapter.live) {
      console.error(`Live ${provider} run is disabled (${String(adapter.params.disabledReason)}). No API call was made.`);
      console.error("A live run needs the owner's written approval and a spending cap. See eval/README.md.");
      process.exitCode = 2;
      return;
    }
    maxUsd = Number(process.env.EDUFLOW_EVAL_MAX_USD);
    const ceiling = worstCaseUsd(dataset.cases, adapter.model, maxOutputTokens, repeats);
    if (ceiling === null || ceiling > maxUsd) {
      console.error(`Refusing to run: worst-case estimate $${ceiling?.toFixed(4) ?? "unknown"} exceeds the cap $${maxUsd}.`);
      process.exitCode = 3;
      return;
    }
  }

  const startedAt = new Date().toISOString();
  const results = await runAll(adapter, dataset.cases, { repeats, maxUsd });
  const summary = summarize(results);
  const meta = {
    runAt: startedAt,
    datasetVersion: dataset.datasetVersion,
    promptVersion: PROMPT_VERSION,
    provider: adapter.provider,
    model: adapter.model,
    live: adapter.live,
    params: adapter.params,
    repeats,
  };
  mkdirSync(outDir, { recursive: true });
  const stamp = startedAt.replace(/[:.]/g, "-");
  const base = path.join(outDir, `${adapter.provider}-${adapter.model}-${stamp}`);
  writeFileSync(`${base}.json`, JSON.stringify({ meta, summary, results }, null, 2));
  writeFileSync(`${base}.md`, markdownReport(meta, summary, results));
  console.log(JSON.stringify({ meta, summary }, null, 2));
  console.log(`Wrote ${base}.json and ${base}.md`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
