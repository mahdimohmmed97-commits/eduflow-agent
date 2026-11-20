import { approveDraft, createPendingDraft, deliverApprovedDraft, type ApprovalActor } from "@/lib/approval";
import type { Audience } from "@/lib/types";

const MAX_BODY = 64_000;

function strings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export async function POST(request: Request) {
  const length = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(length) && length > MAX_BODY) {
    return Response.json({ ok: false, sent: false, error: "payload_too_large" }, { status: 413 });
  }

  let raw = "";
  try {
    raw = await request.text();
  } catch {
    return Response.json({ ok: false, sent: false, error: "invalid_json" }, { status: 400 });
  }
  if (raw.length > MAX_BODY) {
    return Response.json({ ok: false, sent: false, error: "payload_too_large" }, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return Response.json({ ok: false, sent: false, error: "invalid_json" }, { status: 400 });
  }
  if (!body || typeof body !== "object") return Response.json({ ok: false, sent: false, error: "invalid_request" }, { status: 400 });
  const input = body as Record<string, unknown>;
  const audience: Audience | null = input.audience === "student" || input.audience === "parent" ? input.audience : null;
  const actor: ApprovalActor | null = input.actor === "teacher" || input.actor === "agent" || input.actor === "system" ? input.actor : null;
  if (!audience || !actor || typeof input.studentId !== "string" || typeof input.assignmentId !== "string" || typeof input.text !== "string") {
    return Response.json({ ok: false, sent: false, error: "invalid_request" }, { status: 400 });
  }

  const decision = approveDraft(
    createPendingDraft({
      studentId: input.studentId,
      assignmentId: input.assignmentId,
      audience,
      text: input.text,
    }),
    actor,
    { allowedParts: strings(input.allowedParts), otherNames: strings(input.otherNames) },
  );
  if (!decision.ok) return Response.json({ ok: false, sent: false, error: decision.error, status: "pending_teacher_approval" });
  const delivery = deliverApprovedDraft(decision.draft);
  return Response.json({
    ok: true,
    sent: delivery.sent,
    error: delivery.error,
    status: decision.draft.status,
    text: decision.draft.text,
  });
}
