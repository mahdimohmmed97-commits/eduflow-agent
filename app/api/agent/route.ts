import { localResult, messagesFor, parseAgentRequest, resultFromModel } from "@/lib/agent";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = parseAgentRequest(body);
  if (!parsed) return Response.json({ error: "invalid_request" }, { status: 400 });

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return Response.json(localResult(parsed));

  try {
    const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(20_000),
      body: JSON.stringify({
        model,
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
