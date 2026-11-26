import { explainAgentRequest, localResult, messagesFor, outputSchemaFor, resultFromModel } from "@/lib/agent";
import { completeWithProvider, selectedProvider } from "@/lib/model-provider";

const MAX_BODY = 64_000;

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
  if (!explained.ok) {
    // An untrusted record stops here: no template and no model sees it. The teacher gets the field and the reason.
    if (explained.error === "untrusted_record") return Response.json({ error: explained.error, issues: explained.issues }, { status: 422 });
    return Response.json({ error: explained.error }, { status: 400 });
  }
  const parsed = explained.request;
  const choice = selectedProvider();
  if (choice.provider === "none") return Response.json(localResult(parsed));

  try {
    const content = await completeWithProvider(choice, messagesFor(parsed), outputSchemaFor(parsed));
    return Response.json(resultFromModel(parsed, content, choice.provider));
  } catch {
    // Error, timeout, truncated, refused or empty answer: the checked local template, labeled honestly.
    return Response.json(localResult(parsed, "api_failure_fallback"));
  }
}
