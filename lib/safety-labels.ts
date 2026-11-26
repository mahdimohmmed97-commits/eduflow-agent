import type { DraftOrigin } from "@/lib/agent";
import type { DraftRejection } from "@/lib/draft-validator";
import type { MessageKey } from "@/lib/i18n";
import type { RecordIssue } from "@/lib/record-guard";
import type { DraftSource, Locale } from "@/lib/types";

/** Badge text for one message. A local template is never labeled as a model. */
export function originKey(origin: DraftOrigin | DraftSource | "mixed"): MessageKey {
  switch (origin) {
    case "anthropic":
      return "sourceBadgeClaude";
    case "openai":
      return "sourceBadgeGpt";
    case "rejected_ai_output":
      return "sourceBadgeRejected";
    case "api_failure_fallback":
    case "local":
      return "sourceBadgeApiFailure";
    case "mixed":
      return "sourceBadgeMixed";
    case "blocked":
      return "sourceBadgeBlocked";
    default:
      return "sourceBadgeTemplate";
  }
}

export function originClass(origin: DraftOrigin | DraftSource | "mixed"): string {
  if (origin === "anthropic" || origin === "openai") return "bg-navy text-white";
  if (origin === "rejected_ai_output" || origin === "blocked") return "bg-rose-100 text-rose-900";
  if (origin === "api_failure_fallback" || origin === "local") return "bg-white text-ink ring-1 ring-line";
  if (origin === "mixed") return "bg-amber-100 text-amber-950";
  return "bg-teal/10 text-teal";
}

const REASONS: Record<string, [string, string]> = {
  empty: ["النص فارغ", "the text is empty"],
  too_long: ["النص طويل جدًا", "the text is too long"],
  missing_student: ["لا يذكر اسم الطالب", "it does not name the student"],
  missing_assignment: ["لا يذكر عنوان الواجب", "it does not name the assignment"],
  status_contradiction: ["يناقض حالة التسليم في السجل", "it contradicts the submission status in the record"],
  other_student: ["يذكر اسم شخص آخر", "it names another person"],
  missing_parent: ["اسم ولي الأمر غير مسجل في السجل", "the parent name is not recorded"],
  wrong_language: ["لغته لا تطابق لغة المسودة", "its language does not match the draft language"],
  invalid_structure: ["بنيته غير صالحة", "its structure is invalid"],
  unknown_number: ["فيه رقم غير موجود في السجل", "it has a number that is not in the record"],
  number_word: ["فيه عدد مكتوب بالحروف غير موجود في السجل", "it has a number word that is not in the record"],
  date_or_deadline: ["فيه تاريخ أو موعد غير موجود في السجل", "it has a date or deadline that is not in the record"],
  grade_or_score: ["فيه درجة أو نتيجة", "it mentions a grade or score"],
  school_policy: ["فيه سياسة أو قاعدة مدرسية", "it states a school policy or rule"],
  promise: ["فيه وعد أو ضمان", "it makes a promise or guarantee"],
  send_claim: ["يدّعي أن الرسالة أُرسلت", "it claims a message was sent"],
  link_or_contact: ["فيه رابط أو وسيلة اتصال", "it has a link or contact detail"],
  instruction_text: ["فيه تعليمات موجهة للنظام", "it contains instructions aimed at the system"],
  attendance_or_behaviour: ["فيه ادعاء عن الحضور أو السلوك", "it makes an attendance or behaviour claim"],
  invalid_characters: ["فيه رموز غير مسموحة", "it has characters that are not allowed"],
  placeholder_value: ["قيمته غير مسجلة فعليًا", "it is a placeholder, not a real value"],
  name_mismatch: ["الاسم الأول لا يطابق الاسم الكامل", "the given name does not match the full name"],
  invalid_due_date: ["تاريخ التسليم ليس بصيغة تاريخ صالحة", "the due date is not a valid date"],
};

const FIELDS: Record<string, [string, string]> = {
  teacherName: ["اسم المعلم", "teacher name"],
  schoolLine: ["المدرسة", "school"],
  className: ["الصف", "class"],
  subject: ["المادة", "subject"],
  assignmentTitle: ["عنوان الواجب", "assignment title"],
  dueDateLabel: ["تاريخ التسليم", "due date"],
  name: ["اسم الطالب", "student name"],
  givenName: ["الاسم الأول", "given name"],
  parentName: ["اسم ولي الأمر", "parent name"],
};

export function reasonText(reason: DraftRejection | RecordIssue["reason"] | string, locale: Locale): string {
  const pair = REASONS[reason];
  return pair ? pair[locale === "ar" ? 0 : 1] : reason;
}

export function issueText(issue: RecordIssue, locale: Locale): string {
  const field = FIELDS[issue.field]?.[locale === "ar" ? 0 : 1] ?? issue.field;
  return `${field}${issue.studentId ? ` (${issue.studentId})` : ""}: ${reasonText(issue.reason, locale)}`;
}
