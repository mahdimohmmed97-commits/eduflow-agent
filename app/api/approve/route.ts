import { approveDraft, createPendingDraft, deliverApprovedDraft, type ApprovalActor } from "@/lib/approval";
import type { Audience } from "@/lib/types";

function strings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
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
