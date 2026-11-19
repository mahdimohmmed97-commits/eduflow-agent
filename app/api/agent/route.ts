import { explainAgentRequest, localResult, messagesFor, resultFromModel } from "@/lib/agent";

const MAX_BODY = 64_000;

function modelName(): string {
  const fallback = "gpt-4o-mini";
  const value = process.env.OPENAI_MODEL?.trim() || fallback;
  return /^[a-zA-Z0-9._:-]{1,64}$/.test(value) ? value : fallback;
}

export async function POST(request: Request) {
  const length = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(length) && length > MAX_BODY) {
    return Response.json({ error: "payload_too_large" }, { status: 413 });
  }

  let raw = "";
  try {
    raw = await request.text();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  if (raw.length > MAX_BODY) {
    return Response.json({ error: "payload_too_large" }, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const explained = explainAgentRequest(body);
  if (!explained.ok) return Response.json({ error: explained.error }, { status: 400 });
  const parsed = explained.request;

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return Response.json(localResult(parsed));

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(20_000),
      body: JSON.stringify({
        model: modelName(),
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: messagesFor(parsed),
      }),
    });
    if (!response.ok) return Response.json(localResult(parsed));
    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content ?? "";
    return Response.json(resultFromModel(parsed, content));
  } catch {
    return Response.json(localResult(parsed));
  }
}
