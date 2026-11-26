import { explainAgentRequest, groundAgentResult, localResult, type AgentRequest, type AgentRequestError, type AgentResult } from "@/lib/agent";

export type ShownSource = "openai" | "anthropic" | "template" | "local";

export type ConnectionFallback = "timeout" | "offline" | "server";

export type AgentRun =
  | { ok: true; source: ShownSource; fallback: ConnectionFallback | null; result: AgentResult }
  | { ok: false; error: AgentRequestError };

function localRun(request: AgentRequest, fallback: ConnectionFallback): AgentRun {
  return { ok: true, source: "local", fallback, result: localResult(request) };
}

export function connectionFallback(error: unknown): ConnectionFallback {
  if (error instanceof DOMException && (error.name === "TimeoutError" || error.name === "AbortError")) return "timeout";
  if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) return "timeout";
  return "offline";
}

export async function runAgent(payload: AgentRequest): Promise<AgentRun> {
  const explained = explainAgentRequest(payload);
  if (!explained.ok) return explained;
  try {
    const response = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(explained.request),
      signal: AbortSignal.timeout(4_000),
    });
    if (response.status === 400) {
      let error: AgentRequestError = "invalid_request";
      try {
        const body = (await response.json()) as { error?: unknown };
        if (body.error === "duplicate_student_id") error = "duplicate_student_id";
      } catch {
        error = "invalid_request";
      }
      return { ok: false, error };
    }
    if (!response.ok) return localRun(explained.request, "server");
    const grounded = groundAgentResult(explained.request, await response.json());
    const source = grounded.source === "openai" || grounded.source === "anthropic" ? grounded.source : "template";
    return { ok: true, source, fallback: null, result: grounded };
  } catch (error) {
    return localRun(explained.request, connectionFallback(error));
  }
}
