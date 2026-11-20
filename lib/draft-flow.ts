import { approveDraft, createPendingDraft, deliverApprovedDraft, type ApprovalActor } from "@/lib/approval";
import { reviewTeacherEdit, type EditBlockReason } from "@/lib/claims";
import type { Audience, DraftFallback, DraftSource, TeacherDraftStatus } from "@/lib/types";

export type FlowDraft = {
  id: string;
  studentId: string;
  assignmentId: string;
  audience: Audience;
  text: string;
  status: TeacherDraftStatus;
  sent: false;
  source: DraftSource;
  fallback: DraftFallback;
  prepareMs: number;
  allowedParts: string[];
  otherNames: string[];
};

export type FlowBlockReason = EditBlockReason | "teacher_approval_required" | "not_pending";

export function measuredMilliseconds(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.round(value);
}

export function createFlowDraft(input: {
  id: string;
  studentId: string;
  assignmentId: string;
  audience: Audience;
  text: string;
  source: DraftSource;
  fallback: DraftFallback;
  prepareMs: number;
  allowedParts: string[];
  otherNames: string[];
}): FlowDraft {
  return {
    id: input.id,
    studentId: input.studentId,
    assignmentId: input.assignmentId,
    audience: input.audience,
    text: input.text,
    status: "pending_review",
    sent: false,
    source: input.source,
    fallback: input.fallback,
    prepareMs: measuredMilliseconds(input.prepareMs),
    allowedParts: input.allowedParts,
    otherNames: input.otherNames,
  };
}

export function editFlowDraft(draft: FlowDraft, text: string): FlowDraft {
  if (draft.status !== "pending_review") return draft;
  return { ...draft, text, sent: false };
}

export function rejectFlowDraft(draft: FlowDraft): FlowDraft {
  if (draft.status !== "pending_review") return draft;
  return { ...draft, status: "rejected", sent: false };
}

export function approveFlowDraft(
  draft: FlowDraft,
  actor: ApprovalActor,
): { ok: true; draft: FlowDraft; sent: false } | { ok: false; reason: FlowBlockReason; sent: false; draft: FlowDraft } {
  if (draft.status !== "pending_review") return { ok: false, reason: "not_pending", sent: false, draft };
  const review = reviewTeacherEdit(draft.text, draft.allowedParts, draft.otherNames);
  if (!review.ok) return { ok: false, reason: review.reason, sent: false, draft };
  const decision = approveDraft(
    createPendingDraft({
      studentId: draft.studentId,
      assignmentId: draft.assignmentId,
      audience: draft.audience,
      text: draft.text,
    }),
    actor,
    { allowedParts: draft.allowedParts, otherNames: draft.otherNames },
  );
  if (!decision.ok) return { ok: false, reason: decision.error === "empty_draft" ? "empty" : decision.error, sent: false, draft };
  const delivery = deliverApprovedDraft(decision.draft);
  if (delivery.sent !== false || decision.draft.sent !== false) {
    return { ok: false, reason: "not_pending", sent: false, draft };
  }
  return {
    ok: true,
    sent: false,
    draft: { ...draft, text: decision.draft.text, status: "approved", sent: false },
  };
}

export function totalMeasuredPrepareMs(drafts: Array<{ prepareMs: number }>, recordedTotal?: number): number {
  if (typeof recordedTotal === "number") return measuredMilliseconds(recordedTotal);
  return drafts.reduce((sum, draft) => sum + measuredMilliseconds(draft.prepareMs), 0);
}

export function formatMeasuredDuration(ms: number, locale: "ar" | "en"): string {
  const rounded = measuredMilliseconds(ms);
  if (rounded < 1000) return locale === "ar" ? `${rounded} مللي ثانية` : `${rounded} ms`;
  const seconds = (rounded / 1000).toFixed(rounded % 1000 === 0 ? 0 : 1);
  return locale === "ar" ? `${seconds} ث` : `${seconds} s`;
}
