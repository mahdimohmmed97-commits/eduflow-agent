import { reviewTeacherEdit, type EditBlockReason } from "@/lib/claims";
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

export type ApprovalContext = {
  allowedParts: string[];
  otherNames: string[];
};

export type ApprovalError = "teacher_approval_required" | "empty_draft" | Exclude<EditBlockReason, "empty">;

export type ApprovalDecision =
  | { ok: true; draft: ApprovedDraft; sent: false }
  | { ok: false; error: ApprovalError; sent: false };

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

export function approveDraft(draft: PendingDraft, actor: ApprovalActor, context: ApprovalContext): ApprovalDecision {
  if (actor !== "teacher") return { ok: false, error: "teacher_approval_required", sent: false };
  const review = reviewTeacherEdit(draft.text, context.allowedParts, context.otherNames);
  if (!review.ok) return { ok: false, error: review.reason === "empty" ? "empty_draft" : review.reason, sent: false };
  return {
    ok: true,
    sent: false,
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
