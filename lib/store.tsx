"use client";

import { useSyncExternalStore } from "react";
import { translate, type MessageKey } from "@/lib/i18n";
import { createSeed } from "@/lib/seed";
import { todayIso } from "@/lib/dates";
import { zoneOf } from "@/lib/dates";
import type {
  ActivityKind,
  Assignment,
  Audience,
  Channel,
  DemoData,
  Locale,
  SchoolClass,
  Student,
  SubmissionStatus,
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
  localStorage.setItem(STORAGE_KEY, raw);
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

export function useEduFlow() {
  const data = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const locale = useSyncExternalStore(subscribe, getLocaleSnapshot, getLocaleServer);
  const t = (key: MessageKey) => translate(locale, key);
  return { data, locale, t };
}

export function setLocale(locale: Locale) {
  localStorage.setItem(LOCALE_KEY, locale);
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
  source?: "openai" | "template" | "local";
  textAr: string;
  textEn: string;
}) {
  update((data) => {
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
      text: input.text,
      subject: input.subject,
      source: input.source,
      approvedAt: new Date().toISOString(),
    });
    data.approvals = data.approvals.slice(0, 80);
    remember(data, "approved", input.textAr, input.textEn);
  });
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
    const row = data.submissions.find((item) => item.assignmentId === assignmentId && item.studentId === studentId);
    if (!row) return;
    if (patch.note !== undefined) row.note = patch.note.slice(0, 280);
    if (!patch.status) return;
    row.status = patch.status;
    if (patch.status === "not_submitted") row.submittedOn = "";
    if ((patch.status === "submitted" || patch.status === "late") && !row.submittedOn) {
      const assignment = data.assignments.find((item) => item.id === assignmentId);
      row.submittedOn = todayIso(zoneOf(data.classes, assignment?.classId ?? ""));
    }
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
