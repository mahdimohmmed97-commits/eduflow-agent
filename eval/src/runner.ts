import { createHash } from "node:crypto";
import {
  explainAgentRequest,
  localResult,
  messagesFor,
  reminderTemplates,
  resultFromModel,
  type ReminderDraft,
  type ReminderRequest,
} from "@/lib/agent";
import { approveDraft, createPendingDraft, deliverApprovedDraft } from "@/lib/approval";
import { allowedParts, checkDraft, otherNamesFor } from "./checks";
import { costUsd } from "./pricing";
import type { Adapter } from "./providers";
import { scoreDrafts, weighted } from "./scoring";
import type { CaseResult, CriticalFailure, DraftCheck, EvalCase, RunStatus } from "./types";

/** P1 = the production prompt from lib/agent.ts messagesFor(), unchanged, at commit af2467d. */
export const PROMPT_VERSION = "P1-production-messagesFor@af2467d";

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function readJson(content: string): { drafts?: unknown } | null {
  const trimmed = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const attempt = (text: string) => {
    try {
      const value = JSON.parse(text) as unknown;
      return value && typeof value === "object" ? (value as { drafts?: unknown }) : null;
    } catch {
      return null;
    }
  };
  const direct = attempt(trimmed);
  if (direct) return direct;
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  return start >= 0 && end > start ? attempt(trimmed.slice(start, end + 1)) : null;
}

function rawDrafts(content: string | null): { valid: boolean; drafts: Array<Partial<ReminderDraft>> } {
  if (content === null) return { valid: false, drafts: [] };
  const parsed = readJson(content);
  if (!parsed || !Array.isArray(parsed.drafts)) return { valid: false, drafts: [] };
  return { valid: true, drafts: parsed.drafts.filter((item): item is Partial<ReminderDraft> => !!item && typeof item === "object") };
}

function checkSet(request: ReminderRequest, evalCase: EvalCase, drafts: Array<Partial<ReminderDraft>>): DraftCheck[] {
  const checks: DraftCheck[] = [];
  for (const student of request.students) {
    const draft = drafts.find((item) => item.studentId === student.id);
    for (const audience of ["student", "parent"] as const) {
      const text = audience === "student" ? draft?.studentMessage : draft?.parentMessage;
      if (typeof text !== "string" || !text.trim()) continue;
      checks.push(checkDraft(text, { request, student, audience, expect: evalCase.expect }));
    }
  }
  return checks;
}

function unique(list: CriticalFailure[]): CriticalFailure[] {
  return [...new Set(list)];
}

/** Structural check: approval must never deliver. Runs the production approval path on every final draft. */
function approvalNeverSends(request: ReminderRequest, evalCase: EvalCase, drafts: ReminderDraft[]): boolean {
  for (const draft of drafts) {
    const student = request.students.find((item) => item.id === draft.studentId);
    if (!student) continue;
    for (const audience of ["student", "parent"] as const) {
      const text = audience === "student" ? draft.studentMessage : draft.parentMessage;
      const pending = createPendingDraft({ studentId: draft.studentId, assignmentId: `eval-${evalCase.id}`, audience, text });
      const decision = approveDraft(pending, "teacher", { allowedParts: allowedParts(request, student), otherNames: otherNamesFor(request, student, evalCase.expect) });
      if (decision.sent !== false) return false;
      if (decision.ok && deliverApprovedDraft(decision.draft).sent !== false) return false;
    }
  }
  return true;
}

export async function runCase(adapter: Adapter, evalCase: EvalCase, caseIndex: number): Promise<CaseResult> {
  const base = {
    caseId: evalCase.id,
    difficulty: evalCase.difficulty,
    categories: evalCase.categories,
    provider: adapter.provider,
    model: adapter.model,
    promptVersion: PROMPT_VERSION,
    params: adapter.params,
    humanReviewNotes: evalCase.expect.humanReviewNotes,
  };
  const explained = explainAgentRequest(evalCase.request);
  if (!explained.ok || explained.request.kind !== "reminders") {
    const expected = evalCase.expect.outcome === "input_rejected";
    const error = explained.ok ? "not_a_reminder_request" : explained.error;
    return {
      ...base,
      promptSha256: null,
      status: expected ? "input_rejected" : "unexpected_input_rejection",
      rawOutput: null,
      errorDetail: expected && evalCase.expect.expectedError && evalCase.expect.expectedError !== error ? `expected ${evalCase.expect.expectedError}, got ${error}` : error,
      rawChecks: [],
      finalChecks: [],
      finalSource: null,
      draftsFromModel: 0,
      draftsFromTemplate: 0,
      criticalFailuresRaw: [],
      criticalFailuresFinal: [],
      scores: { grounding: null, safety: null, writing: null, instruction: null, tone: null, cost: null, speed: null },
      weightedScore: null,
      weightAvailable: 0,
      usage: { inputTokens: null, outputTokens: null },
      latencyMs: null,
      costUsd: null,
      measured: false,
    };
  }
  const request = explained.request;
  const messages = messagesFor(request);
  const promptSha256 = sha256(JSON.stringify(messages));
  const templates = reminderTemplates(request);

  let status: RunStatus;
  let rawOutput: string | null = null;
  let errorDetail: string | null = null;
  let inputTokens: number | null = null;
  let outputTokens: number | null = null;
  let latencyMs: number | null = null;
  let finalDrafts: ReminderDraft[];
  let finalSource: string;

  if (!adapter.complete) {
    const local = localResult(request);
    finalDrafts = local.kind === "reminders" ? local.drafts : templates;
    finalSource = local.source;
    status = "fallback_template";
    errorDetail = adapter.provider === "template" ? null : String(adapter.params.disabledReason ?? "provider_unavailable");
  } else {
    try {
      const completion = await adapter.complete(messages, request, caseIndex);
      rawOutput = completion.text;
      inputTokens = completion.inputTokens;
      outputTokens = completion.outputTokens;
      latencyMs = completion.latencyMs;
      const modelSource = adapter.provider === "anthropic" ? "anthropic" : "openai";
      const result = resultFromModel(request, completion.text, modelSource);
      finalDrafts = result.kind === "reminders" ? result.drafts : templates;
      finalSource = adapter.provider.startsWith("mock") && result.source !== "template" ? `${result.source}(mock-run)` : result.source;
      const parsed = rawDrafts(completion.text);
      const complete =
        parsed.valid &&
        request.students.every((student) => {
          const draft = parsed.drafts.find((item) => item.studentId === student.id);
          return typeof draft?.studentMessage === "string" && draft.studentMessage.trim() && typeof draft.parentMessage === "string" && draft.parentMessage.trim();
        });
      const fromTemplate = finalDrafts.reduce((sum, draft, index) => sum + (draft.studentMessage === templates[index]?.studentMessage ? 1 : 0) + (draft.parentMessage === templates[index]?.parentMessage ? 1 : 0), 0);
      if (completion.stopReason === "max_tokens" || completion.stopReason === "length" || !complete) status = "incomplete";
      else if (fromTemplate > 0) status = "rejected_unsafe_output";
      else status = "success";
    } catch (error) {
      const err = error as Error;
      status = err.name === "TimeoutError" || err.name === "AbortError" ? "timeout" : "api_failure";
      errorDetail = err.message.slice(0, 200);
      const local = localResult(request);
      finalDrafts = local.kind === "reminders" ? local.drafts : templates;
      finalSource = local.source;
    }
  }

  const parsed = rawDrafts(rawOutput);
  const rawChecks = rawOutput === null ? [] : checkSet(request, evalCase, parsed.drafts);
  const finalChecks = checkSet(request, evalCase, finalDrafts);

  // Pipeline check: a final draft that is the local template must not be labeled as AI-generated.
  let fromModel = 0;
  let fromTemplate = 0;
  finalDrafts.forEach((draft, index) => {
    for (const audience of ["studentMessage", "parentMessage"] as const) {
      const isTemplate = draft[audience] === templates[index]?.[audience];
      if (isTemplate) fromTemplate += 1;
      else fromModel += 1;
      if (isTemplate && finalSource !== "template") {
        const check = finalChecks.find((item) => item.studentId === draft.studentId && item.audience === (audience === "studentMessage" ? "student" : "parent"));
        if (check && !check.critical.includes("template_misrepresented_as_ai")) check.critical.push("template_misrepresented_as_ai");
      }
    }
  });
  if (!approvalNeverSends(request, evalCase, finalDrafts)) {
    finalChecks.forEach((check) => check.critical.push("unauthorized_sending"));
  }

  const modelCalled = rawOutput !== null;
  const scores = modelCalled
    ? scoreDrafts(rawChecks, { validJson: parsed.valid, expectedDrafts: request.students.length * 2, returnedDrafts: rawChecks.length })
    : status === "timeout" || status === "api_failure"
      ? { grounding: 0, safety: 0, writing: 0, instruction: 0, tone: 0, cost: null, speed: null }
      : { grounding: null, safety: null, writing: null, instruction: null, tone: null, cost: null, speed: null };
  const { score, available } = weighted(scores);
  const measured = adapter.live && inputTokens !== null && outputTokens !== null;
  return {
    ...base,
    promptSha256,
    status,
    rawOutput,
    errorDetail,
    rawChecks,
    finalChecks,
    finalSource,
    draftsFromModel: fromModel,
    draftsFromTemplate: fromTemplate,
    criticalFailuresRaw: unique(rawChecks.flatMap((check) => check.critical)),
    criticalFailuresFinal: unique(finalChecks.flatMap((check) => check.critical)),
    scores,
    weightedScore: score,
    weightAvailable: available,
    usage: { inputTokens: measured ? inputTokens : null, outputTokens: measured ? outputTokens : null },
    latencyMs: adapter.live ? latencyMs : null,
    costUsd: measured ? costUsd(adapter.model, inputTokens ?? 0, outputTokens ?? 0) : null,
    measured,
  };
}

/** Conservative pre-run ceiling: every case uses the full output cap, and input is estimated at 1 token per 2 characters. */
export function worstCaseUsd(cases: EvalCase[], model: string, maxOutputTokens: number, repeats: number): number | null {
  let total = 0;
  for (const evalCase of cases) {
    const explained = explainAgentRequest(evalCase.request);
    if (!explained.ok) continue;
    const chars = JSON.stringify(messagesFor(explained.request)).length;
    const cost = costUsd(model, Math.ceil(chars / 2), maxOutputTokens);
    if (cost === null) return null;
    total += cost;
  }
  return total * repeats;
}

export async function runAll(adapter: Adapter, cases: EvalCase[], options: { repeats: number; maxUsd?: number }): Promise<CaseResult[]> {
  const results: CaseResult[] = [];
  let spent = 0;
  for (let repeat = 0; repeat < options.repeats; repeat += 1) {
    for (const [index, evalCase] of cases.entries()) {
      if (options.maxUsd !== undefined && spent >= options.maxUsd) throw new Error(`budget_cap_reached after $${spent.toFixed(4)}`);
      const result = await runCase(adapter, evalCase, index);
      spent += result.costUsd ?? 0;
      results.push(result);
    }
  }
  return results;
}
