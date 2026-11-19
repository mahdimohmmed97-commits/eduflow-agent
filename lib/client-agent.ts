import { explainAgentRequest, groundAgentResult, localResult, type AgentRequest, type AgentRequestError, type AgentResult } from "@/lib/agent";

export type ShownSource = "openai" | "template" | "local";

export type AgentRun =
  | { ok: true; source: ShownSource; result: AgentResult }
  | { ok: false; error: AgentRequestError };

export async function runAgent(payload: AgentRequest): Promise<AgentRun> {
  const explained = explainAgentRequest(payload);
  if (!explained.ok) return explained;
  try {
    const response = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(explained.request),
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
    if (!response.ok) return { ok: true, source: "local", result: localResult(explained.request) };
    const grounded = groundAgentResult(explained.request, await response.json());
    return { ok: true, source: grounded.source === "openai" ? "openai" : "template", result: grounded };
  } catch {
    return { ok: true, source: "local", result: localResult(explained.request) };
  }
}
