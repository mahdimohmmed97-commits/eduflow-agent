import type { Gender, Locale } from "@/lib/types";

export type ReminderStudent = {
  id: string;
  name: string;
  givenName: string;
  gender: Gender;
  parentName: string;
  status: "late" | "not_submitted";
};

export type ReminderRequest = {
  kind: "reminders";
  locale: Locale;
  teacherName: string;
  schoolLine: string;
  className: string;
  subject: string;
  assignmentTitle: string;
  dueDateLabel: string;
  students: ReminderStudent[];
};

export type SummaryClass = {
  id: string;
  name: string;
  subject: string;
  schoolLine: string;
  studentCount: number;
  onTimeRate: number | null;
  assignments: Array<{
    title: string;
    dueDateLabel: string;
    pastDue: boolean;
    submitted: number;
    late: number;
    notSubmitted: number;
  }>;
  flags: Array<{
    studentId: string;
    studentName: string;
    reason: string;
  }>;
};

export type SummaryRequest = {
  kind: "summary";
  locale: Locale;
  teacherName: string;
  classes: SummaryClass[];
};

export type AgentRequest = ReminderRequest | SummaryRequest;

export type ReminderDraft = {
  studentId: string;
  studentMessage: string;
  parentMessage: string;
};

export type AgentResult =
  | { source: "openai" | "template"; kind: "reminders"; drafts: ReminderDraft[] }
  | { source: "openai" | "template"; kind: "summary"; summary: string };

type ChatMessage = { role: "system" | "user"; content: string };

export function reminderTemplates(request: ReminderRequest): ReminderDraft[] {
  return request.students.map((student) => ({
    studentId: student.id,
    studentMessage:
      request.locale === "ar" ? arabicStudent(request, student) : englishStudent(request, student),
    parentMessage:
      request.locale === "ar" ? arabicParent(request, student) : englishParent(request, student),
  }));
}

export function summaryTemplate(request: SummaryRequest): string {
  return request.locale === "ar" ? arabicSummary(request) : englishSummary(request);
}

export function localResult(request: AgentRequest): AgentResult {
  if (request.kind === "reminders") {
    return { source: "template", kind: "reminders", drafts: reminderTemplates(request) };
  }
  return { source: "template", kind: "summary", summary: summaryTemplate(request) };
}

export function messagesFor(request: AgentRequest): ChatMessage[] {
  const language = request.locale === "ar" ? "Modern Standard Arabic" : "English";
  const system = [
    "You are EduFlow, an assistant for teachers in private schools and training centers in the UAE and Saudi Arabia.",
    `Write in ${language} only.`,
    "Be warm, professional, and concise. The teacher will review the text and copy it manually.",
    "Do not invent grades, attendance, behavior, phone calls, or any fact that is not in the data.",
    "Do not say a message has already been sent.",
    "In Arabic, use the correct gender for the student.",
    "Return JSON only.",
  ].join(" ");

  if (request.kind === "reminders") {
    return [
      { role: "system", content: system },
      {
        role: "user",
        content: [
          "Write one student message and one parent message for each student.",
          `Teacher: ${request.teacherName}`,
          `School or center: ${request.schoolLine}`,
          `Class: ${request.className}`,
          `Subject: ${request.subject}`,
          `Assignment: ${request.assignmentTitle}`,
          `Due date: ${request.dueDateLabel}`,
          `Students: ${JSON.stringify(request.students)}`,
          'Return JSON: {"drafts":[{"studentId":"","studentMessage":"","parentMessage":""}]}',
        ].join("\n"),
      },
    ];
  }

  return [
    { role: "system", content: system },
    {
      role: "user",
      content: [
        "Write a weekly class performance summary for the teacher.",
        "Use only the counts provided. Mention every flagged student by the exact name given, with the reason.",
        "Close with a short recommendation to contact missing students first, then late submissions.",
        "Plain text with line breaks. No Markdown tables.",
        `Teacher: ${request.teacherName}`,
        `Classes: ${JSON.stringify(request.classes)}`,
        'Return JSON: {"summary":""}',
      ].join("\n"),
    },
  ];
}

export function resultFromModel(request: AgentRequest, content: string): AgentResult {
  const parsed = readJson(content);
  if (request.kind === "reminders") {
    const drafts = (Array.isArray(parsed?.drafts) ? parsed.drafts : []).map(asDraft);
    const fallback = reminderTemplates(request);
    const merged = request.students.map((student) => {
      const found = drafts.find((item) => item?.studentId === student.id);
      const backup = fallback.find((item) => item.studentId === student.id);
      const studentMessage = clip(found?.studentMessage);
      const parentMessage = clip(found?.parentMessage);
      return {
        studentId: student.id,
        studentMessage: studentMessage || backup?.studentMessage || "",
        parentMessage: parentMessage || backup?.parentMessage || "",
      };
    });
    const usedModel = merged.some((draft, index) => {
      const backup = fallback[index];
      return draft.studentMessage !== backup?.studentMessage || draft.parentMessage !== backup?.parentMessage;
    });
    return { source: usedModel ? "openai" : "template", kind: "reminders", drafts: merged };
  }

  const summary = finalizeSummary(request, clip(parsed?.summary, 6000));
  const usedModel = summary !== summaryTemplate(request);
  return { source: usedModel ? "openai" : "template", kind: "summary", summary };
}

export function parseAgentRequest(value: unknown): AgentRequest | null {
  if (!value || typeof value !== "object") return null;
  const body = value as Record<string, unknown>;
  if (body.kind === "reminders") return parseReminders(body);
  if (body.kind === "summary") return parseSummary(body);
  return null;
}

function parseReminders(body: Record<string, unknown>): ReminderRequest | null {
  const locale = asLocale(body.locale);
  const teacherName = clip(body.teacherName, 120);
  const schoolLine = clip(body.schoolLine, 180);
  const className = clip(body.className, 160);
  const subject = clip(body.subject, 120);
  const assignmentTitle = clip(body.assignmentTitle, 180);
  const dueDateLabel = clip(body.dueDateLabel, 80);
  if (!locale || !teacherName || !schoolLine || !className || !subject || !assignmentTitle || !dueDateLabel) {
    return null;
  }
  if (!Array.isArray(body.students) || body.students.length === 0 || body.students.length > 40) return null;
  const students: ReminderStudent[] = [];
  for (const item of body.students) {
    if (!item || typeof item !== "object") return null;
    const row = item as Record<string, unknown>;
    const id = clip(row.id, 80);
    const name = clip(row.name, 120);
    const given = clip(row.givenName, 80);
    const parentName = clip(row.parentName, 120);
    const gender = row.gender === "female" || row.gender === "male" ? row.gender : null;
    const status = row.status === "late" || row.status === "not_submitted" ? row.status : null;
    if (!id || !name || !given || !parentName || !gender || !status) return null;
    students.push({ id, name, givenName: given, gender, parentName, status });
  }
  return {
    kind: "reminders",
    locale,
    teacherName,
    schoolLine,
    className,
    subject,
    assignmentTitle,
    dueDateLabel,
    students,
  };
}

function parseSummary(body: Record<string, unknown>): SummaryRequest | null {
  const locale = asLocale(body.locale);
  const teacherName = clip(body.teacherName, 120);
  if (!locale || !teacherName || !Array.isArray(body.classes) || body.classes.length === 0 || body.classes.length > 12) {
    return null;
  }
  const classes: SummaryClass[] = [];
  for (const item of body.classes) {
    if (!item || typeof item !== "object") return null;
    const row = item as Record<string, unknown>;
    const id = clip(row.id, 80);
    const name = clip(row.name, 160);
    const subject = clip(row.subject, 120);
    const schoolLine = clip(row.schoolLine, 180);
    const studentCount = asCount(row.studentCount);
    const onTimeRate = row.onTimeRate === null ? null : asCount(row.onTimeRate);
    const rateInvalid = row.onTimeRate !== null && onTimeRate === null;
    if (!id || !name || !subject || !schoolLine || studentCount === null || rateInvalid) {
      return null;
    }
    if (!Array.isArray(row.assignments) || row.assignments.length > 20) return null;
    if (!Array.isArray(row.flags) || row.flags.length > 80) return null;
    const assignments: SummaryClass["assignments"] = [];
    for (const assignment of row.assignments) {
      if (!assignment || typeof assignment !== "object") return null;
      const entry = assignment as Record<string, unknown>;
      const title = clip(entry.title, 180);
      const dueDateLabel = clip(entry.dueDateLabel, 80);
      const submitted = asCount(entry.submitted);
      const late = asCount(entry.late);
      const notSubmitted = asCount(entry.notSubmitted);
      if (!title || !dueDateLabel || submitted === null || late === null || notSubmitted === null) return null;
      if (typeof entry.pastDue !== "boolean") return null;
      assignments.push({ title, dueDateLabel, pastDue: entry.pastDue, submitted, late, notSubmitted });
    }
    const flags: SummaryClass["flags"] = [];
    for (const flag of row.flags) {
      if (!flag || typeof flag !== "object") return null;
      const entry = flag as Record<string, unknown>;
      const studentId = clip(entry.studentId, 80);
      const studentName = clip(entry.studentName, 120);
      const reason = clip(entry.reason, 240);
      if (!studentId || !studentName || !reason) return null;
      flags.push({ studentId, studentName, reason });
    }
    classes.push({
      id,
      name,
      subject,
      schoolLine,
      studentCount,
      onTimeRate: row.onTimeRate === null ? null : onTimeRate,
      assignments,
      flags,
    });
  }
  return { kind: "summary", locale, teacherName, classes };
}

function arabicStudent(request: ReminderRequest, student: ReminderStudent): string {
  const ask = student.gender === "female" ? "أخبريني" : "أخبرني";
  if (student.status === "late") {
    return [
      `مرحباً ${student.name}،`,
      "",
      `وصلني واجب «${request.assignmentTitle}» في مادة ${request.subject}، ولاحظت أنه سُلّم بعد الموعد (${request.dueDateLabel}). شكراً لك على إرساله.`,
      "",
      `التسليم في الوقت في المرات القادمة يحفظ لك الدرجة كاملة. إذا كان التأخير لظرف خاص، يسعدني أن أعرف.`,
      "",
      "مع التحية،",
      request.teacherName,
      request.schoolLine,
    ].join("\n");
  }
  return [
    `مرحباً ${student.name}،`,
    "",
    `تذكير ودي بخصوص واجب «${request.assignmentTitle}» في مادة ${request.subject} (${request.className}). كان آخر موعد للتسليم ${request.dueDateLabel}، ولم يصلنا تسليمك حتى الآن.`,
    "",
    `يسعدني استلامه اليوم. إذا واجهتك صعوبة، ${ask} لنرتب مساعدة مناسبة قبل أن يتأثر تقييمك.`,
    "",
    "مع التحية،",
    request.teacherName,
    request.schoolLine,
  ].join("\n");
}

function arabicParent(request: ReminderRequest, student: ReminderStudent): string {
  const child = student.gender === "female" ? "ابنتكم" : "ابنكم";
  const verb = student.gender === "female" ? "تُسلّم" : "يُسلّم";
  const delivered = student.gender === "female" ? "سلّمت" : "سلّم";
  const need = student.gender === "female" ? "احتاجت" : "احتاج";
  const mark = student.gender === "female" ? "تقييمها" : "تقييمه";
  if (student.status === "late") {
    return [
      `السلام عليكم ${student.parentName}،`,
      "",
      `نود إفادتكم بأن ${child} ${student.name} ${delivered} واجب «${request.assignmentTitle}» في مادة ${request.subject} بعد الموعد المحدد (${request.dueDateLabel}). تم استلام الواجب.`,
      "",
      `نأمل مساعدتكم في تشجيع ${student.givenName} على التسليم في الوقت مستقبلاً، حتى لا يتأثر ${mark}.`,
      "",
      "مع خالص التقدير،",
      request.teacherName,
      request.schoolLine,
    ].join("\n");
  }
  return [
    `السلام عليكم ${student.parentName}،`,
    "",
    `نود تنبيهكم بلطف إلى أن ${child} ${student.name} لم ${verb} واجب «${request.assignmentTitle}» في مادة ${request.subject} (${request.className})، وقد انتهى موعد التسليم في ${request.dueDateLabel}.`,
    "",
    `نقدّر متابعتكم في المنزل، ويسعدنا التواصل إذا ${need} ${student.givenName} إلى دعم إضافي.`,
    "",
    "مع خالص التقدير،",
    request.teacherName,
    request.schoolLine,
  ].join("\n");
}

function englishStudent(request: ReminderRequest, student: ReminderStudent): string {
  if (student.status === "late") {
    return [
      `Hello ${student.name},`,
      "",
      `I received “${request.assignmentTitle}” for ${request.subject}. It arrived after the due date (${request.dueDateLabel}). Thank you for sending it.`,
      "",
      "Submitting on time next time keeps the full mark. If there was a special reason for the delay, you can tell me.",
      "",
      "Kind regards,",
      request.teacherName,
      request.schoolLine,
    ].join("\n");
  }
  return [
    `Hello ${student.name},`,
    "",
    `A friendly reminder about “${request.assignmentTitle}” for ${request.subject} (${request.className}). It was due on ${request.dueDateLabel}, and I have not received your work yet.`,
    "",
    "Please send it today. If something is blocking you, tell me and we will find a way to help before it affects your mark.",
    "",
    "Kind regards,",
    request.teacherName,
    request.schoolLine,
  ].join("\n");
}

function englishParent(request: ReminderRequest, student: ReminderStudent): string {
  const child = student.gender === "female" ? "daughter" : "son";
  if (student.status === "late") {
    return [
      `Hello ${student.parentName},`,
      "",
      `I wanted to let you know that your ${child}, ${student.name}, submitted “${request.assignmentTitle}” for ${request.subject} after the due date (${request.dueDateLabel}). The work has been received.`,
      "",
      `It would help if ${student.givenName} can submit on time next time, so the mark is not affected.`,
      "",
      "Kind regards,",
      request.teacherName,
      request.schoolLine,
    ].join("\n");
  }
  return [
    `Hello ${student.parentName},`,
    "",
    `I am writing to let you know that your ${child}, ${student.name}, has not submitted “${request.assignmentTitle}” for ${request.subject} (${request.className}). The due date was ${request.dueDateLabel}.`,
    "",
    `Your follow-up at home makes a difference. I am happy to help if ${student.givenName} needs extra support.`,
    "",
    "Kind regards,",
    request.teacherName,
    request.schoolLine,
  ].join("\n");
}

function arabicSummary(request: SummaryRequest): string {
  const lines = [
    "ملخص الأداء الأسبوعي",
    "",
    `${request.teacherName}، هذا ملخص متابعة الواجبات حسب سجل التسليم الحالي. الأرقام من السجل نفسه، والمسودات تبقى للمراجعة ولا تُرسل تلقائياً.`,
  ];
  for (const schoolClass of request.classes) {
    lines.push("", `${schoolClass.name} — ${schoolClass.subject}`, schoolClass.schoolLine, `عدد الطلاب: ${schoolClass.studentCount}`);
    lines.push(
      schoolClass.onTimeRate === null
        ? "لا توجد واجبات انتهى موعدها بعد، لذلك لا تُحسب نسبة تسليم في الموعد."
        : `نسبة التسليم في الموعد للواجبات المستحقة: ${schoolClass.onTimeRate}%`,
    );
    if (schoolClass.assignments.length === 0) {
      lines.push("لا واجبات مسجّلة في هذا الصف.");
    } else {
      for (const assignment of schoolClass.assignments) {
        const timing = assignment.pastDue ? "انتهى الموعد" : "الموعد لم يحن";
        lines.push(
          `• ${assignment.title} (${timing}، ${assignment.dueDateLabel}): في الموعد ${assignment.submitted}، متأخر ${assignment.late}، لم يُسلّم ${assignment.notSubmitted}.`,
        );
      }
    }
    if (schoolClass.flags.length === 0) {
      lines.push("لا يوجد طلاب بحاجة إلى متابعة عاجلة.");
    } else {
      lines.push("بحاجة إلى متابعة:");
      for (const flag of schoolClass.flags) lines.push(`– ${flag.studentName}: ${flag.reason}`);
    }
  }
  lines.push(
    "",
    "توصية هذا الأسبوع: ابدأوا بمن لم يسلّم بعد انتهاء الموعد، ثم من سُجّل تسليمه متأخراً. يمكن نسخ رسالة الطالب ورسالة ولي الأمر من تبويب التذكيرات بعد مراجعتهما.",
  );
  return lines.join("\n");
}

function englishSummary(request: SummaryRequest): string {
  const lines = [
    "Weekly performance summary",
    "",
    `${request.teacherName}, this follow-up summary uses the current submission record. The figures come from that record. Drafts stay with you and are never sent automatically.`,
  ];
  for (const schoolClass of request.classes) {
    lines.push("", `${schoolClass.name} — ${schoolClass.subject}`, schoolClass.schoolLine, `Students: ${schoolClass.studentCount}`);
    lines.push(
      schoolClass.onTimeRate === null
        ? "No assignment is past its due date yet, so there is no on-time rate."
        : `On-time rate for due assignments: ${schoolClass.onTimeRate}%`,
    );
    if (schoolClass.assignments.length === 0) {
      lines.push("No assignments are recorded for this class.");
    } else {
      for (const assignment of schoolClass.assignments) {
        const timing = assignment.pastDue ? "past due" : "not due yet";
        lines.push(
          `• ${assignment.title} (${timing}, ${assignment.dueDateLabel}): on time ${assignment.submitted}, late ${assignment.late}, not submitted ${assignment.notSubmitted}.`,
        );
      }
    }
    if (schoolClass.flags.length === 0) {
      lines.push("No students need urgent follow-up.");
    } else {
      lines.push("Needs follow-up:");
      for (const flag of schoolClass.flags) lines.push(`– ${flag.studentName}: ${flag.reason}`);
    }
  }
  lines.push(
    "",
    "This week, start with students who have not submitted after the due date, then those marked late. Copy the student and parent messages from the reminders tab after you review them.",
  );
  return lines.join("\n");
}

function finalizeSummary(request: SummaryRequest, modelText: string): string {
  const fallback = summaryTemplate(request);
  if (modelText.trim().length < 40) return fallback;
  const missing = request.classes
    .flatMap((schoolClass) => schoolClass.flags)
    .filter((flag) => !modelText.includes(flag.studentName));
  if (missing.length === 0) return modelText;
  const heading =
    request.locale === "ar"
      ? "أُضيفت هذه الأسماء من السجل لأنها لم تظهر في الصياغة:"
      : "These names were added from the record because the draft left them out:";
  const extra = missing.map((flag) => `– ${flag.studentName}: ${flag.reason}`).join("\n");
  return `${modelText.trim()}\n\n${heading}\n${extra}`;
}

function readJson(content: string): { drafts?: unknown[]; summary?: unknown } | null {
  const trimmed = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    return asObject(JSON.parse(trimmed));
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    try {
      return asObject(JSON.parse(trimmed.slice(start, end + 1)));
    } catch {
      return null;
    }
  }
}

function asObject(value: unknown): { drafts?: unknown[]; summary?: unknown } | null {
  if (!value || typeof value !== "object") return null;
  return value as { drafts?: unknown[]; summary?: unknown };
}

function asDraft(value: unknown): { studentId?: unknown; studentMessage?: unknown; parentMessage?: unknown } | null {
  if (!value || typeof value !== "object") return null;
  return value as { studentId?: unknown; studentMessage?: unknown; parentMessage?: unknown };
}

function asLocale(value: unknown): Locale | null {
  return value === "ar" || value === "en" ? value : null;
}

function asCount(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 500) return null;
  return Math.round(value);
}

function clip(value: unknown, max = 2500): string {
  if (typeof value !== "string") return "";
  const clean = value.replace(/\u0000/g, "").trim();
  if (!clean) return "";
  return clean.length > max ? `${clean.slice(0, max).trim()}…` : clean;
}
