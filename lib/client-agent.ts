import { localResult, type AgentRequest, type AgentResult } from "@/lib/agent";

export type ShownSource = "openai" | "template" | "local";

export async function runAgent(payload: AgentRequest): Promise<{ source: ShownSource; result: AgentResult }> {
  try {
    const response = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) return { source: "local", result: localResult(payload) };
    const result = (await response.json()) as AgentResult;
    if (!result || result.kind !== payload.kind) return { source: "local", result: localResult(payload) };
    return { source: result.source === "openai" ? "openai" : "template", result };
  } catch {
    return { source: "local", result: localResult(payload) };
  }
}
