import type { Audience } from "@/lib/types";

export type ApprovalActor = "teacher" | "agent" | "system";

export type PendingDraft = {
  studentId: string;
  assignmentId: string;
  audience: Audience;
  text: string;
  status: "pending_teacher_approval";
  sent: false;
};

export type ApprovedDraft = {
  studentId: string;
  assignmentId: string;
  audience: Audience;
  text: string;
  status: "approved";
  approvedBy: "teacher";
  sent: false;
};

export type ApprovalDecision =
  | { ok: true; draft: ApprovedDraft }
  | { ok: false; error: "teacher_approval_required" | "empty_draft"; sent: false };

export function createPendingDraft(input: {
  studentId: string;
  assignmentId: string;
  audience: Audience;
  text: string;
}): PendingDraft {
  return {
    studentId: input.studentId,
    assignmentId: input.assignmentId,
    audience: input.audience,
    text: input.text,
    status: "pending_teacher_approval",
    sent: false,
  };
}

export function approveDraft(draft: PendingDraft, actor: ApprovalActor): ApprovalDecision {
  if (actor !== "teacher") return { ok: false, error: "teacher_approval_required", sent: false };
  if (!draft.text.trim()) return { ok: false, error: "empty_draft", sent: false };
  return {
    ok: true,
    draft: {
      studentId: draft.studentId,
      assignmentId: draft.assignmentId,
      audience: draft.audience,
      text: draft.text,
      status: "approved",
      approvedBy: "teacher",
      sent: false,
    },
  };
}

export function deliverApprovedDraft(draft: ApprovedDraft): { ok: false; sent: false; error: "sending_disabled" } {
  if (draft.status !== "approved" || draft.approvedBy !== "teacher" || draft.sent !== false) {
    return { ok: false, sent: false, error: "sending_disabled" };
  }
  return { ok: false, sent: false, error: "sending_disabled" };
}
