export type ModelChoice =
  | { provider: "none" }
  | { provider: "openai"; key: string; model: string }
  | { provider: "anthropic"; key: string; model: string };

type Env = Record<string, string | undefined>;

const MODEL_NAME = /^[a-zA-Z0-9._:-]{1,64}$/;

function named(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim() || fallback;
  return MODEL_NAME.test(trimmed) ? trimmed : fallback;
}

export function selectedProvider(env: Env = process.env): ModelChoice {
  const requested = (env.AI_PROVIDER ?? "").trim().toLowerCase();
  const openaiKey = env.OPENAI_API_KEY?.trim() ?? "";
  const anthropicKey = env.ANTHROPIC_API_KEY?.trim() ?? "";

  if (requested === "none" || requested === "off") return { provider: "none" };
  if (requested === "openai") {
    return openaiKey ? { provider: "openai", key: openaiKey, model: named(env.OPENAI_MODEL, "gpt-4o-mini") } : { provider: "none" };
  }
  if (requested === "anthropic") {
    return anthropicKey
      ? { provider: "anthropic", key: anthropicKey, model: named(env.ANTHROPIC_MODEL, "claude-sonnet-4-5") }
      : { provider: "none" };
  }
  if (requested === "" && openaiKey) {
    return { provider: "openai", key: openaiKey, model: named(env.OPENAI_MODEL, "gpt-4o-mini") };
  }
  return { provider: "none" };
}

type ChatMessage = { role: "system" | "user"; content: string };

export async function completeWithProvider(choice: Exclude<ModelChoice, { provider: "none" }>, messages: ChatMessage[]): Promise<string> {
  if (choice.provider === "openai") {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${choice.key}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(20_000),
      body: JSON.stringify({
        model: choice.model,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages,
      }),
    });
    if (!response.ok) throw new Error("provider_error");
    const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return payload.choices?.[0]?.message?.content ?? "";
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": choice.key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    signal: AbortSignal.timeout(20_000),
    body: JSON.stringify({
      model: choice.model,
      max_tokens: 1200,
      temperature: 0.4,
      system: messages.filter((item) => item.role === "system").map((item) => item.content).join("\n"),
      messages: [{ role: "user", content: messages.filter((item) => item.role === "user").map((item) => item.content).join("\n") }],
    }),
  });
  if (!response.ok) throw new Error("provider_error");
  const payload = (await response.json()) as { content?: Array<{ type?: string; text?: string }> };
  return (payload.content ?? []).filter((block) => block.type === "text").map((block) => block.text ?? "").join("");
}
