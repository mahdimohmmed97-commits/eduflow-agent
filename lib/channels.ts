import type { Audience, Channel, Gender, Locale, Tone } from "@/lib/types";

export type ChannelDraft = {
  subject: string;
  text: string;
};

type ChannelInput = {
  channel: Channel;
  tone: Tone;
  locale: Locale;
  audience: Audience;
  fullText: string;
  assignmentTitle: string;
  studentName: string;
  givenName: string;
  parentName: string;
  gender: Gender;
  status: "late" | "not_submitted";
  dueLabel: string;
  teacherName: string;
};

export function presentDraft(input: ChannelInput): ChannelDraft {
  const subject =
    input.locale === "ar"
      ? input.tone === "friendly"
        ? `تذكير لطيف: واجب «${input.assignmentTitle}»`
        : `متابعة واجب «${input.assignmentTitle}» — ${input.studentName}`
      : input.tone === "friendly"
        ? `A quick note about “${input.assignmentTitle}”`
        : `Homework follow-up: ${input.assignmentTitle} — ${input.studentName}`;

  if (input.channel === "sms") return { subject, text: smsText(input) };
  if (input.channel === "email") {
    const header = input.locale === "ar" ? `الموضوع: ${subject}` : `Subject: ${subject}`;
    return { subject, text: `${header}\n\n${input.fullText}` };
  }
  return { subject, text: input.fullText };
}

function smsText(input: ChannelInput): string {
  const child = input.gender === "female" ? (input.locale === "ar" ? "ابنتكم" : "daughter") : input.locale === "ar" ? "ابنكم" : "son";
  const verb = input.gender === "female" ? "تُسلّم" : "يُسلّم";
  const delivered = input.gender === "female" ? "سلّمت" : "سلّم";
  const object = input.gender === "female" ? "تشجيعها" : "تشجيعه";
  if (input.locale === "ar") {
    if (input.audience === "student") {
      return input.status === "late"
        ? `${input.givenName}: وصل «${input.assignmentTitle}» بعد الموعد (${input.dueLabel}). شكراً لإرساله، والموعد القادم في الوقت أفضل. ${input.teacherName}`
        : `${input.givenName}: واجب «${input.assignmentTitle}» كان موعده ${input.dueLabel} ولم يصل. أرسله اليوم لو تقدر. ${input.teacherName}`;
    }
    return input.status === "late"
      ? `${input.parentName}: ${child} ${input.studentName} ${delivered} «${input.assignmentTitle}» بعد الموعد (${input.dueLabel}). نأمل ${object} على الالتزام بالموعد. ${input.teacherName}`
      : `${input.parentName}: لم ${verb} ${input.studentName} واجب «${input.assignmentTitle}» (الموعد ${input.dueLabel}). نأمل ${object} على إرساله اليوم. ${input.teacherName}`;
  }
  if (input.audience === "student") {
    return input.status === "late"
      ? `${input.givenName}: “${input.assignmentTitle}” arrived after ${input.dueLabel}. Thank you for sending it. The next one is easier to follow if it arrives on time. ${input.teacherName}`
      : `${input.givenName}: “${input.assignmentTitle}” was due ${input.dueLabel} and has not arrived. Please send it today. ${input.teacherName}`;
  }
  return input.status === "late"
    ? `${input.parentName}: your ${child} ${input.studentName} submitted “${input.assignmentTitle}” after ${input.dueLabel}. A nudge toward the next deadline would help. ${input.teacherName}`
    : `${input.parentName}: ${input.studentName} has not submitted “${input.assignmentTitle}” (due ${input.dueLabel}). A reminder at home today would help. ${input.teacherName}`;
}
