"use client";

import { useSyncExternalStore } from "react";
import { approveDraft, createPendingDraft } from "@/lib/approval";
import { reviewTeacherEdit, type EditBlockReason } from "@/lib/claims";
import { translate, type MessageKey } from "@/lib/i18n";
import { patchSubmission } from "@/lib/records";
import { createSeed } from "@/lib/seed";
import type {
  ActivityKind,
  Assignment,
  Audience,
  Channel,
  DemoData,
  DraftFallback,
  DraftSource,
  Locale,
  SchoolClass,
  Student,
  SubmissionStatus,
  TeacherDraft,
  Tone,
} from "@/lib/types";

const STORAGE_KEY = "eduflow-agent-v2";
const STORAGE_VERSION = 2;
const LOCALE_KEY = "eduflow-locale";

type Listener = () => void;

const listeners = new Set<Listener>();
let dataCache: { key: string; data: DemoData } | null = null;
let seedMemo: DemoData | null = null;

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function seed(): DemoData {
  if (!seedMemo) seedMemo = createSeed();
  return seedMemo;
}

function isDemoData(value: unknown): value is DemoData {
  if (!value || typeof value !== "object") return false;
  const data = value as DemoData;
  return (
    Array.isArray(data.classes) &&
    Array.isArray(data.students) &&
    Array.isArray(data.assignments) &&
    Array.isArray(data.submissions) &&
    Array.isArray(data.activity) &&
    Array.isArray(data.approvals) &&
    Array.isArray(data.trend) &&
    (data.tone === "formal" || data.tone === "friendly") &&
    (data.channel === "whatsapp" || data.channel === "email" || data.channel === "sms")
  );
}

function getSnapshot(): DemoData | null {
  if (typeof window === "undefined") return null;
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    raw = null;
  }
  const key = raw ?? "";
  if (dataCache && dataCache.key === key) return dataCache.data;

  let data = seed();
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { version?: number; data?: unknown };
      if (parsed.version === STORAGE_VERSION && isDemoData(parsed.data)) data = parsed.data;
    } catch {
      data = seed();
    }
  }
  data = normalizePhase2(data);
  dataCache = { key, data };
  return data;
}

function getServerSnapshot(): DemoData | null {
  return null;
}

function getLocaleSnapshot(): Locale {
  if (typeof window === "undefined") return "ar";
  try {
    return localStorage.getItem(LOCALE_KEY) === "en" ? "en" : "ar";
  } catch {
    return "ar";
  }
}

function getLocaleServer(): Locale {
  return "ar";
}

function write(data: DemoData) {
  const raw = JSON.stringify({ version: STORAGE_VERSION, data });
  try {
    localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    // Storage can be blocked. Keep the new story in memory for this page view.
  }
  dataCache = { key: raw, data };
  emit();
}

function update(mutator: (draft: DemoData) => void) {
  const current = getSnapshot();
  if (!current) return;
  const next = structuredClone(current);
  mutator(next);
  write(next);
}

function uid(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function normalizePhase2(data: DemoData): DemoData {
  const drafts = Array.isArray(data.drafts) ? data.drafts : [];
  const measuredPrepareMs =
    typeof data.measuredPrepareMs === "number" && Number.isFinite(data.measuredPrepareMs) && data.measuredPrepareMs >= 0
      ? Math.round(data.measuredPrepareMs)
      : 0;
  if (data.drafts === drafts && data.measuredPrepareMs === measuredPrepareMs) return data;
  return { ...data, drafts, measuredPrepareMs };
}

function draftList(data: DemoData): TeacherDraft[] {
  if (!data.drafts) data.drafts = [];
  if (typeof data.measuredPrepareMs !== "number" || !Number.isFinite(data.measuredPrepareMs) || data.measuredPrepareMs < 0) {
    data.measuredPrepareMs = 0;
  }
  return data.drafts;
}

export type ApprovalBlock = EditBlockReason | "teacher_approval_required" | "not_pending";

export function useEduFlow() {
  const data = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const locale = useSyncExternalStore(subscribe, getLocaleSnapshot, getLocaleServer);
  const t = (key: MessageKey) => translate(locale, key);
  return { data, locale, t };
}

export function setLocale(locale: Locale) {
  try {
    localStorage.setItem(LOCALE_KEY, locale);
  } catch {
    // The toggle still notifies listeners. A blocked store keeps the previous language on the next load.
  }
  emit();
}

export function resetDemo() {
  seedMemo = null;
  write(createSeed());
}

export function ensureStored() {
  if (typeof window === "undefined") return;
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return;
  }
  if (!raw) {
    write(seed());
    return;
  }
  try {
    const parsed = JSON.parse(raw) as { version?: number; data?: unknown };
    if (parsed.version !== STORAGE_VERSION || !isDemoData(parsed.data)) write(seed());
  } catch {
    write(seed());
  }
}

function remember(
  data: DemoData,
  kind: ActivityKind,
  textAr: string,
  textEn: string,
) {
  data.activity.unshift({
    id: uid("act"),
    at: new Date().toISOString(),
    kind,
    textAr,
    textEn,
  });
  data.activity = data.activity.slice(0, 40);
}

export function setTone(tone: Tone) {
  update((data) => {
    data.tone = tone;
  });
}

export function setChannel(channel: Channel) {
  update((data) => {
    data.channel = channel;
  });
}

export function logActivity(kind: ActivityKind, textAr: string, textEn: string) {
  update((data) => remember(data, kind, textAr, textEn));
}

export function recordApproval(input: {
  studentId: string;
  assignmentId: string;
  tone: Tone;
  channel: Channel;
  audience: Audience;
  text: string;
  subject: string;
  locale?: Locale;
  source?: "openai" | "template" | "local";
  actor: "teacher";
  textAr: string;
  textEn: string;
  allowedParts: string[];
  otherNames: string[];
}) {
  update((data) => {
    const decision = approveDraft(
      createPendingDraft({
        studentId: input.studentId,
        assignmentId: input.assignmentId,
        audience: input.audience,
        text: input.text,
      }),
      input.actor,
      { allowedParts: input.allowedParts, otherNames: input.otherNames },
    );
    if (!decision.ok || decision.draft.sent !== false) return;
    data.approvals = data.approvals.filter(
      (item) =>
        !(
          item.studentId === input.studentId &&
          item.assignmentId === input.assignmentId &&
          item.audience === input.audience &&
          item.channel === input.channel &&
          item.tone === input.tone
        ),
    );
    data.approvals.unshift({
      id: uid("appr"),
      studentId: input.studentId,
      assignmentId: input.assignmentId,
      tone: input.tone,
      channel: input.channel,
      audience: input.audience,
      text: decision.draft.text,
      subject: input.subject,
      locale: input.locale,
      source: input.source,
      approvedAt: new Date().toISOString(),
    });
    data.approvals = data.approvals.slice(0, 80);
    remember(data, "approved", input.textAr, input.textEn);
  });
}

export function savePreparedDraft(input: {
  studentId: string;
  assignmentId: string;
  audience: Audience;
  tone: Tone;
  channel: Channel;
  text: string;
  subject: string;
  locale: Locale;
  source: DraftSource;
  fallback: DraftFallback;
  prepareMs: number;
  allowedParts: string[];
  otherNames: string[];
}): string {
  const createdId = uid("draft");
  const prepareMs = Number.isFinite(input.prepareMs) && input.prepareMs > 0 ? Math.round(input.prepareMs) : 0;
  let savedId = createdId;
  update((data) => {
    const drafts = draftList(data);
    const existing = drafts.find(
      (item) =>
        item.studentId === input.studentId &&
        item.assignmentId === input.assignmentId &&
        item.audience === input.audience &&
        item.tone === input.tone &&
        item.channel === input.channel &&
        item.status === "pending_review",
    );
    if (existing) {
      savedId = existing.id;
      existing.text = input.text;
      existing.subject = input.subject;
      existing.locale = input.locale;
      existing.source = input.source;
      existing.fallback = input.fallback;
      existing.prepareMs += prepareMs;
      existing.allowedParts = input.allowedParts;
      existing.otherNames = input.otherNames;
      existing.blockReason = null;
    } else {
      drafts.unshift({
        id: createdId,
        studentId: input.studentId,
        assignmentId: input.assignmentId,
        audience: input.audience,
        tone: input.tone,
        channel: input.channel,
        text: input.text,
        subject: input.subject,
        locale: input.locale,
        source: input.source,
        fallback: input.fallback,
        status: "pending_review",
        prepareMs,
        allowedParts: input.allowedParts,
        otherNames: input.otherNames,
        blockReason: null,
      });
    }
    data.measuredPrepareMs = (data.measuredPrepareMs ?? 0) + prepareMs;
    data.drafts = drafts.slice(0, 80);
  });
  return savedId;
}

export function editPreparedDraft(id: string, text: string) {
  update((data) => {
    const draft = draftList(data).find((item) => item.id === id && item.status === "pending_review");
    if (!draft) return;
    draft.text = text;
    draft.blockReason = null;
  });
}

export function rejectPreparedDraft(id: string, textAr: string, textEn: string) {
  update((data) => {
    const draft = draftList(data).find((item) => item.id === id && item.status === "pending_review");
    if (!draft) return;
    draft.status = "rejected";
    draft.blockReason = null;
    remember(data, "refused", textAr, textEn);
  });
}

export function approvePreparedDraft(
  id: string,
  textAr: string,
  textEn: string,
  latestText?: string,
): { ok: true; sent: false } | { ok: false; reason: ApprovalBlock; sent: false } {
  if (typeof latestText === "string") editPreparedDraft(id, latestText);
  const current = getSnapshot();
  const draft = current?.drafts?.find((item) => item.id === id);
  if (!draft || draft.status !== "pending_review") return { ok: false, reason: "not_pending", sent: false };
  const review = reviewTeacherEdit(draft.text, draft.allowedParts, draft.otherNames);
  if (!review.ok) {
    update((data) => {
      const item = draftList(data).find((entry) => entry.id === id);
      if (item && item.status === "pending_review") item.blockReason = review.reason;
    });
    return { ok: false, reason: review.reason, sent: false };
  }
  let blocked: ApprovalBlock | null = null;
  update((data) => {
    const item = draftList(data).find((entry) => entry.id === id && entry.status === "pending_review");
    if (!item) {
      blocked = "not_pending";
      return;
    }
    const again = reviewTeacherEdit(item.text, item.allowedParts, item.otherNames);
    if (!again.ok) {
      item.blockReason = again.reason;
      blocked = again.reason;
      return;
    }
    const decision = approveDraft(
      createPendingDraft({
        studentId: item.studentId,
        assignmentId: item.assignmentId,
        audience: item.audience,
        text: item.text,
      }),
      "teacher",
      { allowedParts: item.allowedParts, otherNames: item.otherNames },
    );
    if (!decision.ok || decision.draft.sent !== false) {
      blocked = decision.ok ? "not_pending" : decision.error === "empty_draft" ? "empty" : decision.error;
      if (!decision.ok) item.blockReason = blocked === "teacher_approval_required" || blocked === "not_pending" ? null : blocked;
      return;
    }
    item.status = "approved";
    item.text = decision.draft.text;
    item.blockReason = null;
    data.approvals = data.approvals.filter(
      (entry) =>
        !(
          entry.studentId === item.studentId &&
          entry.assignmentId === item.assignmentId &&
          entry.audience === item.audience &&
          entry.channel === item.channel &&
          entry.tone === item.tone
        ),
    );
    data.approvals.unshift({
      id: uid("appr"),
      studentId: item.studentId,
      assignmentId: item.assignmentId,
      tone: item.tone,
      channel: item.channel,
      audience: item.audience,
      text: decision.draft.text,
      subject: item.subject,
      locale: item.locale,
      source: item.source,
      approvedAt: new Date().toISOString(),
    });
    data.approvals = data.approvals.slice(0, 80);
    remember(data, "approved", textAr, textEn);
  });
  if (blocked) return { ok: false, reason: blocked, sent: false };
  return { ok: true, sent: false };
}

export function addClass(input: Omit<SchoolClass, "id">) {
  update((data) => {
    data.classes.push({ ...input, id: uid("cls") });
  });
}

export function addStudent(input: Omit<Student, "id">) {
  update((data) => {
    const id = uid("stu");
    data.students.push({ ...input, id });
    for (const assignment of data.assignments.filter((item) => item.classId === input.classId)) {
      data.submissions.push({
        assignmentId: assignment.id,
        studentId: id,
        status: "not_submitted",
        submittedOn: "",
        note: "",
      });
    }
  });
}

export function addAssignment(input: Omit<Assignment, "id">) {
  update((data) => {
    const id = uid("asg");
    data.assignments.push({ ...input, id });
    for (const student of data.students.filter((item) => item.classId === input.classId)) {
      data.submissions.push({
        assignmentId: id,
        studentId: student.id,
        status: "not_submitted",
        submittedOn: "",
        note: "",
      });
    }
  });
}

export function deleteClass(id: string) {
  update((data) => {
    const studentIds = new Set(data.students.filter((item) => item.classId === id).map((item) => item.id));
    const assignmentIds = new Set(data.assignments.filter((item) => item.classId === id).map((item) => item.id));
    data.classes = data.classes.filter((item) => item.id !== id);
    data.students = data.students.filter((item) => item.classId !== id);
    data.assignments = data.assignments.filter((item) => item.classId !== id);
    data.submissions = data.submissions.filter(
      (item) => !assignmentIds.has(item.assignmentId) && !studentIds.has(item.studentId),
    );
    data.approvals = data.approvals.filter((item) => !studentIds.has(item.studentId) && !assignmentIds.has(item.assignmentId));
  });
}

export function deleteStudent(id: string) {
  update((data) => {
    data.students = data.students.filter((item) => item.id !== id);
    data.submissions = data.submissions.filter((item) => item.studentId !== id);
    data.approvals = data.approvals.filter((item) => item.studentId !== id);
  });
}

export function deleteAssignment(id: string) {
  update((data) => {
    data.assignments = data.assignments.filter((item) => item.id !== id);
    data.submissions = data.submissions.filter((item) => item.assignmentId !== id);
    data.approvals = data.approvals.filter((item) => item.assignmentId !== id);
  });
}

export function setSubmission(
  assignmentId: string,
  studentId: string,
  patch: Partial<Pick<{ status: SubmissionStatus; note: string }, "status" | "note">>,
) {
  update((data) => {
    const result = patchSubmission(data, assignmentId, studentId, patch);
    if (!result.statusChanged) return;
    const student = data.students.find((item) => item.id === studentId);
    const assignment = data.assignments.find((item) => item.id === assignmentId);
    if (student && assignment) {
      remember(
        data,
        "status",
        `تم تحديث حالة ${student.nameAr} في «${assignment.titleAr}».`,
        `Updated ${student.nameEn} on “${assignment.titleEn}”.`,
      );
    }
  });
}
