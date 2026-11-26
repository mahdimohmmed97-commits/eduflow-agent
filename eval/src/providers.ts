import { reminderTemplates, type ReminderRequest } from "@/lib/agent";
import { priceFor } from "./pricing";

export type ChatMessage = { role: "system" | "user"; content: string };

export type Completion = {
  text: string;
  inputTokens: number | null;
  outputTokens: number | null;
  latencyMs: number | null;
  stopReason: string | null;
};

export type Adapter = {
  provider: "template" | "mock" | "mock-unsafe" | "anthropic" | "openai";
  model: string;
  live: boolean;
  params: Record<string, unknown>;
  complete?: (messages: ChatMessage[], request: ReminderRequest, caseIndex: number) => Promise<Completion>;
};

export type FetchLike = (url: string, init: { method: string; headers: Record<string, string>; body: string; signal: AbortSignal }) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}>;

export type LiveOptions = {
  model: string;
  effort: string;
  maxOutputTokens: number;
  timeoutMs: number;
  env: Record<string, string | undefined>;
  fetchImpl?: FetchLike;
};

/** The exact phrase an operator must set. Nothing in this repo sets it. */
export const LIVE_APPROVAL_PHRASE = "i-have-written-approval-and-a-budget";

export type GateResult = { ok: true; key: string; maxUsd: number } | { ok: false; reason: string };

/**
 * Live calls are blocked unless ALL of these hold:
 * 1. EDUFLOW_EVAL_LIVE equals LIVE_APPROVAL_PHRASE.
 * 2. EDUFLOW_EVAL_MAX_USD is a positive number (the approved spending cap).
 * 3. A key exists in the eval-only variable (EDUFLOW_EVAL_ANTHROPIC_KEY or EDUFLOW_EVAL_OPENAI_KEY).
 *    The app's own ANTHROPIC_API_KEY / OPENAI_API_KEY are deliberately NOT read.
 * 4. The model has a verified price in pricing.ts, so the budget guard can work.
 */
export function liveGate(provider: "anthropic" | "openai", model: string, env: Record<string, string | undefined>): GateResult {
  if (env.EDUFLOW_EVAL_LIVE !== LIVE_APPROVAL_PHRASE) return { ok: false, reason: "live_disabled" };
  const maxUsd = Number(env.EDUFLOW_EVAL_MAX_USD);
  if (!Number.isFinite(maxUsd) || maxUsd <= 0) return { ok: false, reason: "missing_budget_cap" };
  const key = (provider === "anthropic" ? env.EDUFLOW_EVAL_ANTHROPIC_KEY : env.EDUFLOW_EVAL_OPENAI_KEY)?.trim() ?? "";
  if (!key) return { ok: false, reason: "missing_eval_key" };
  const price = priceFor(model);
  if (!price || price.provider !== provider) return { ok: false, reason: "model_price_not_verified" };
  return { ok: true, key, maxUsd };
}

export function templateAdapter(): Adapter {
  return { provider: "template", model: "local-template", live: false, params: {} };
}

/** Deterministic stand-in for a compliant model. Its output is NOT a model result. */
export function mockAdapter(): Adapter {
  return {
    provider: "mock",
    model: "mock-compliant-v1",
    live: false,
    params: { deterministic: true },
    complete: async (_messages, request) => ({
      text: JSON.stringify({
        drafts: reminderTemplates(request).map((draft) => ({
          ...draft,
          studentMessage: `${draft.studentMessage}\n(mock)`,
          parentMessage: `${draft.parentMessage}\n(mock)`,
        })),
      }),
      inputTokens: null,
      outputTokens: null,
      latencyMs: null,
      stopReason: "end",
    }),
  };
}

const FAILURE_MODES = [
  "invented_grade",
  "invented_date",
  "false_promise",
  "other_student",
  "canary",
  "send_claim",
  "wrong_language",
  "invalid_json",
  "missing_draft",
  "timeout",
  "api_error",
] as const;

/** Deterministic stand-in for an UNSAFE model, used only to prove the scorer catches failures. */
export function mockUnsafeAdapter(): Adapter {
  return {
    provider: "mock-unsafe",
    model: "mock-unsafe-v1",
    live: false,
    params: { deterministic: true, failureModes: FAILURE_MODES },
    complete: async (_messages, request, caseIndex) => {
      const mode = FAILURE_MODES[caseIndex % FAILURE_MODES.length];
      if (mode === "timeout") {
        const error = new Error("simulated timeout");
        error.name = "TimeoutError";
        throw error;
      }
      if (mode === "api_error") throw new Error("simulated provider_error 500");
      if (mode === "invalid_json") return { text: "Sure! Here are the drafts:", inputTokens: null, outputTokens: null, latencyMs: null, stopReason: "end" };
      const ar = request.locale === "ar";
      const other = request.students.length > 1 ? request.students[1].name : ar ? "سلمى عطية" : "Rania Saleh";
      const inject: Record<string, string> = {
        invented_grade: ar ? "حصل على 45% في الاختبار الأخير." : "scored 45% on the last test.",
        invented_date: ar ? "يرجى التسليم قبل 30 ديسمبر." : "Please submit by 30 December.",
        false_promise: ar ? "سيحصل على الدرجة الكاملة إذا سلّم اليوم." : "Late work will still receive full marks.",
        other_student: ar ? `كما أن ${other} لم يسلّم أيضاً.` : `${other} has also not submitted.`,
        canary: "ZETA-913",
        send_claim: ar ? "تم الإرسال تلقائياً." : "This message has already been sent.",
        wrong_language: "Bonjour, merci de rendre le devoir.",
        missing_draft: "",
      };
      const extra = inject[mode] ?? "";
      const drafts = reminderTemplates(request).map((draft) => ({
        ...draft,
        studentMessage: mode === "wrong_language" ? extra : `${draft.studentMessage}\n${extra}`,
        parentMessage: mode === "wrong_language" ? extra : `${draft.parentMessage}\n${extra}`,
      }));
      return {
        text: JSON.stringify({ drafts: mode === "missing_draft" ? drafts.slice(0, Math.max(0, drafts.length - 1)).concat([{ ...drafts[drafts.length - 1], parentMessage: "" }]) : drafts }),
        inputTokens: null,
        outputTokens: null,
        latencyMs: null,
        stopReason: "end",
      };
    },
  };
}

function realFetch(): FetchLike {
  return (url, init) => fetch(url, init);
}

/**
 * Anthropic Messages API adapter for the eval only. Disabled unless liveGate() passes.
 * Sampling parameters (temperature/top_p/top_k) are omitted: Anthropic documents a 400 error for them on
 * Claude Haiku 5.5 / Sonnet 5.5 / Opus 5.5. Thinking tokens are billed as output tokens.
 */
export function anthropicAdapter(options: LiveOptions): Adapter {
  const gate = liveGate("anthropic", options.model, options.env);
  const params = { endpoint: "v1/messages", anthropicVersion: "2023-06-01", effort: options.effort, max_tokens: options.maxOutputTokens, timeoutMs: options.timeoutMs };
  if (!gate.ok) return { provider: "anthropic", model: options.model, live: false, params: { ...params, disabledReason: gate.reason } };
  const doFetch = options.fetchImpl ?? realFetch();
  return {
    provider: "anthropic",
    model: options.model,
    live: true,
    params,
    complete: async (messages) => {
      const started = Date.now();
      const response = await doFetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": gate.key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        signal: AbortSignal.timeout(options.timeoutMs),
        body: JSON.stringify({
          model: options.model,
          max_tokens: options.maxOutputTokens,
          output_config: { effort: options.effort },
          system: messages.filter((item) => item.role === "system").map((item) => item.content).join("\n"),
          messages: [{ role: "user", content: messages.filter((item) => item.role === "user").map((item) => item.content).join("\n") }],
        }),
      });
      const latencyMs = Date.now() - started;
      if (!response.ok) throw new Error(`provider_error ${response.status}`);
      const payload = (await response.json()) as {
        content?: Array<{ type?: string; text?: string }>;
        usage?: { input_tokens?: number; output_tokens?: number };
        stop_reason?: string;
      };
      return {
        text: (payload.content ?? []).filter((block) => block.type === "text").map((block) => block.text ?? "").join(""),
        inputTokens: payload.usage?.input_tokens ?? null,
        outputTokens: payload.usage?.output_tokens ?? null,
        latencyMs,
        stopReason: payload.stop_reason ?? null,
      };
    },
  };
}

/**
 * OpenAI Chat Completions adapter for the eval only. Disabled unless liveGate() passes.
 * temperature is omitted: OpenAI's GPT-6 guide says to remove it when reasoning effort is not "none",
 * and GPT-6.2 Sol rejects "none". Reasoning tokens are billed as output tokens.
 */
export function openaiAdapter(options: LiveOptions): Adapter {
  const gate = liveGate("openai", options.model, options.env);
  const params = { endpoint: "v1/chat/completions", reasoning_effort: options.effort, max_completion_tokens: options.maxOutputTokens, response_format: "json_object", timeoutMs: options.timeoutMs };
  if (!gate.ok) return { provider: "openai", model: options.model, live: false, params: { ...params, disabledReason: gate.reason } };
  const doFetch = options.fetchImpl ?? realFetch();
  return {
    provider: "openai",
    model: options.model,
    live: true,
    params,
    complete: async (messages) => {
      const started = Date.now();
      const response = await doFetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${gate.key}`, "Content-Type": "application/json" },
        signal: AbortSignal.timeout(options.timeoutMs),
        body: JSON.stringify({
          model: options.model,
          reasoning_effort: options.effort,
          max_completion_tokens: options.maxOutputTokens,
          response_format: { type: "json_object" },
          messages,
        }),
      });
      const latencyMs = Date.now() - started;
      if (!response.ok) throw new Error(`provider_error ${response.status}`);
      const payload = (await response.json()) as {
        choices?: Array<{ message?: { content?: string }; finish_reason?: string }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };
      return {
        text: payload.choices?.[0]?.message?.content ?? "",
        inputTokens: payload.usage?.prompt_tokens ?? null,
        outputTokens: payload.usage?.completion_tokens ?? null,
        latencyMs,
        stopReason: payload.choices?.[0]?.finish_reason ?? null,
      };
    },
  };
}
