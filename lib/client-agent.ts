import { explainAgentRequest, groundAgentResult, localResult, type AgentRequest, type AgentRequestError, type AgentResult } from "@/lib/agent";
import type { RecordIssue } from "@/lib/record-guard";

/** "mixed" means messages in this result have different origins; each message carries its own origin label. */
export type ShownSource = "openai" | "anthropic" | "template" | "local" | "mixed";

export type ConnectionFallback = "timeout" | "offline" | "server";

export type AgentRun =
  | { ok: true; source: ShownSource; fallback: ConnectionFallback | null; result: AgentResult }
  | { ok: false; error: AgentRequestError; issues?: RecordIssue[] };

function localRun(request: AgentRequest, fallback: ConnectionFallback): AgentRun {
  return { ok: true, source: "local", fallback, result: localResult(request, "api_failure_fallback") };
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
      // Longer than the server's provider timeout (30 s default), so a slow model answer is not cut off here.
      signal: AbortSignal.timeout(35_000),
    });
    if (response.status === 422) {
      try {
        const body = (await response.json()) as { issues?: unknown };
        return { ok: false, error: "untrusted_record", issues: Array.isArray(body.issues) ? (body.issues as RecordIssue[]) : [] };
      } catch {
        return { ok: false, error: "untrusted_record", issues: [] };
      }
    }
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
    const source: ShownSource = grounded.source === "openai" || grounded.source === "anthropic" || grounded.source === "mixed" ? grounded.source : "template";
    return { ok: true, source, fallback: null, result: grounded };
  } catch (error) {
    return localRun(explained.request, connectionFallback(error));
  }
}
