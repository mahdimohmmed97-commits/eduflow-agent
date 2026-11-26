/**
 * Optional model providers. The demo default is AI_PROVIDER=none: no network call, local templates only.
 * A provider is used ONLY when AI_PROVIDER names it explicitly AND its key is set on the server.
 *
 * Checked against official docs on 2026-11-26 (see docs/PHASE9_SAFETY_HARDENING.md):
 * - No temperature/top_p/top_k is sent. Claude 5.5 models reject non-default sampling values with HTTP 400, and
 *   OpenAI says to remove temperature when reasoning effort is not "none".
 * - Thinking/reasoning tokens are billed as output and count against the output budget (Anthropic max_tokens,
 *   OpenAI max_completion_tokens), so the budget is large enough to cover thinking plus the JSON answer. Only tokens
 *   actually generated are billed; the cap is a ceiling. OpenAI's reasoning guide suggests reserving a large budget
 *   while experimenting; defaults are 16000 (OpenAI) and 8000 (Anthropic), adjustable by env.
 * - Structured outputs: Anthropic output_config.format json_schema; OpenAI response_format json_schema strict.
 * - A truncated, refused, empty, failed or timed-out answer throws ProviderError and the route shows the checked
 *   local template labeled "fallback after API failure".
 */
export type ModelChoice =
  | { provider: "none" }
  | { provider: "openai"; key: string; model: string; maxOutputTokens: number; effort?: string; timeoutMs: number }
  | { provider: "anthropic"; key: string; model: string; maxOutputTokens: number; effort?: string; timeoutMs: number };

type Env = Record<string, string | undefined>;

export const DEFAULT_OPENAI_MODEL = "gpt-6-luna";
export const DEFAULT_ANTHROPIC_MODEL = "claude-haiku-5-5";
export const ANTHROPIC_VERSION = "2026-10-21";

const MODEL_NAME = /^[a-zA-Z0-9._:-]{1,64}$/;
const ANTHROPIC_EFFORTS = new Set(["low", "medium", "high", "max"]);
const OPENAI_EFFORTS = new Set(["none", "low", "medium", "high", "max"]);

function named(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim() || fallback;
  return MODEL_NAME.test(trimmed) ? trimmed : fallback;
}

function bounded(value: string | undefined, fallback: number, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function effort(value: string | undefined, allowed: Set<string>): string | undefined {
  const trimmed = value?.trim().toLowerCase();
  return trimmed && allowed.has(trimmed) ? trimmed : undefined;
}

export function selectedProvider(env: Env = process.env): ModelChoice {
  const requested = (env.AI_PROVIDER ?? "").trim().toLowerCase();
  const timeoutMs = bounded(env.AI_TIMEOUT_MS, 30_000, 5_000, 60_000);
  if (requested === "openai") {
    const key = env.OPENAI_API_KEY?.trim() ?? "";
    if (!key) return { provider: "none" };
    const chosenEffort = effort(env.OPENAI_REASONING_EFFORT, OPENAI_EFFORTS);
    return {
      provider: "openai",
      key,
      model: named(env.OPENAI_MODEL, DEFAULT_OPENAI_MODEL),
      maxOutputTokens: bounded(env.OPENAI_MAX_COMPLETION_TOKENS, 16_000, 1_000, 32_000),
      timeoutMs,
      ...(chosenEffort ? { effort: chosenEffort } : {}),
    };
  }
  if (requested === "anthropic") {
    const key = env.ANTHROPIC_API_KEY?.trim() ?? "";
    if (!key) return { provider: "none" };
    const chosenEffort = effort(env.ANTHROPIC_EFFORT, ANTHROPIC_EFFORTS);
    return {
      provider: "anthropic",
      key,
      model: named(env.ANTHROPIC_MODEL, DEFAULT_ANTHROPIC_MODEL),
      maxOutputTokens: bounded(env.ANTHROPIC_MAX_TOKENS, 8_000, 1_000, 32_000),
      timeoutMs,
      ...(chosenEffort ? { effort: chosenEffort } : {}),
    };
  }
  // "none", "off", empty, or anything unknown: no provider. A key alone never turns a provider on.
  return { provider: "none" };
}

export type ProviderErrorKind = "timeout" | "network" | "http" | "truncated" | "refusal" | "empty" | "bad_payload";

export class ProviderError extends Error {
  readonly kind: ProviderErrorKind;
  readonly status?: number;
  constructor(kind: ProviderErrorKind, status?: number) {
    super(`provider_error:${kind}${status ? `:${status}` : ""}`);
    this.name = "ProviderError";
    this.kind = kind;
    this.status = status;
  }
}

type ChatMessage = { role: "system" | "user"; content: string };
export type OutputSchema = { name: string; schema: Record<string, unknown> };

/** Runs one provider request (the fetch URL stays literal at the call site) and maps every failure to ProviderError. */
async function send(request: () => Promise<Response>): Promise<unknown> {
  let response: Response;
  try {
    response = await request();
  } catch (error) {
    const name = (error as { name?: string })?.name;
    throw new ProviderError(name === "TimeoutError" || name === "AbortError" ? "timeout" : "network");
  }
  if (!response.ok) throw new ProviderError("http", response.status);
  try {
    return await response.json();
  } catch {
    throw new ProviderError("bad_payload");
  }
}

export async function completeWithProvider(
  choice: Exclude<ModelChoice, { provider: "none" }>,
  messages: ChatMessage[],
  schema?: OutputSchema,
): Promise<string> {
  const system = messages.filter((item) => item.role === "system").map((item) => item.content).join("\n");
  const user = messages.filter((item) => item.role === "user").map((item) => item.content).join("\n");

  if (choice.provider === "openai") {
    const body = {
        model: choice.model,
        max_completion_tokens: choice.maxOutputTokens,
        ...(choice.effort ? { reasoning_effort: choice.effort } : {}),
        response_format: schema
          ? { type: "json_schema", json_schema: { name: schema.name, strict: true, schema: schema.schema } }
          : { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      };
    const payload = (await send(() =>
      fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${choice.key}`, "Content-Type": "application/json" },
        signal: AbortSignal.timeout(choice.timeoutMs),
        body: JSON.stringify(body),
      }),
    )) as { choices?: Array<{ finish_reason?: string; message?: { content?: string | null; refusal?: string | null } }> };
    const first = payload?.choices?.[0];
    if (!first) throw new ProviderError("bad_payload");
    if (first.message?.refusal) throw new ProviderError("refusal");
    if (first.finish_reason === "length" || first.finish_reason === "content_filter") throw new ProviderError(first.finish_reason === "length" ? "truncated" : "refusal");
    const text = first.message?.content ?? "";
    if (!text.trim()) throw new ProviderError("empty");
    return text;
  }

  const body = {
      model: choice.model,
      max_tokens: choice.maxOutputTokens,
      ...(choice.effort || schema
        ? {
            output_config: {
              ...(choice.effort ? { effort: choice.effort } : {}),
              ...(schema ? { format: { type: "json_schema", schema: schema.schema } } : {}),
            },
          }
        : {}),
      system,
      messages: [{ role: "user", content: user }],
    };
  const payload = (await send(() =>
    fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": choice.key, "anthropic-version": ANTHROPIC_VERSION, "content-type": "application/json" },
      signal: AbortSignal.timeout(choice.timeoutMs),
      body: JSON.stringify(body),
    }),
  )) as { stop_reason?: string; content?: Array<{ type?: string; text?: string }> };
  if (!payload || !Array.isArray(payload.content)) throw new ProviderError("bad_payload");
  if (payload.stop_reason === "max_tokens" || payload.stop_reason === "model_context_window_exceeded") throw new ProviderError("truncated");
  if (payload.stop_reason === "refusal") throw new ProviderError("refusal");
  const text = payload.content.filter((block) => block.type === "text").map((block) => block.text ?? "").join("");
  if (!text.trim()) throw new ProviderError("empty");
  return text;
}
