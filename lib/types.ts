export type Locale = "ar" | "en";

export type Gender = "female" | "male";

export type SubmissionStatus = "submitted" | "late" | "not_submitted";

export type GulfTimeZone = "Asia/Dubai" | "Asia/Riyadh";

export type Tone = "formal" | "friendly";

export type Channel = "whatsapp" | "email" | "sms";

export type Audience = "student" | "parent";

export type SchoolClass = {
  id: string;
  nameAr: string;
  nameEn: string;
  subjectAr: string;
  subjectEn: string;
  gradeAr: string;
  gradeEn: string;
  schoolAr: string;
  schoolEn: string;
  cityAr: string;
  cityEn: string;
  timeZone: GulfTimeZone;
};

export type Student = {
  id: string;
  classId: string;
  nameAr: string;
  nameEn: string;
  gender: Gender;
  parentNameAr: string;
  parentNameEn: string;
  parentPhone: string;
};

export type Assignment = {
  id: string;
  classId: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  dueDate: string;
};

export type Submission = {
  assignmentId: string;
  studentId: string;
  status: SubmissionStatus;
  submittedOn: string;
  note: string;
};

export type DraftSource = "openai" | "template" | "local";

export type DraftFallback = "timeout" | "offline" | "server" | null;

export type TeacherDraftStatus = "pending_review" | "approved" | "rejected";

export type TeacherDraft = {
  id: string;
  studentId: string;
  assignmentId: string;
  audience: Audience;
  tone: Tone;
  channel: Channel;
  text: string;
  subject: string;
  source: DraftSource;
  fallback: DraftFallback;
  status: TeacherDraftStatus;
  prepareMs: number;
  allowedParts: string[];
  otherNames: string[];
  blockReason: "empty" | "unsupported_claim" | "unknown_fact" | "other_student" | null;
};

export type ActivityKind = "plan" | "approved" | "copied" | "status" | "summary" | "test" | "refused";

export type ActivityEntry = {
  id: string;
  at: string;
  kind: ActivityKind;
  textAr: string;
  textEn: string;
};

export type Approval = {
  id: string;
  studentId: string;
  assignmentId: string;
  tone: Tone;
  channel: Channel;
  audience: Audience;
  text: string;
  subject: string;
  source?: "openai" | "template" | "local";
  approvedAt: string;
};

/** Fictional weekly story points. Not a measured school outcome, and not rendered as a result. */
export type WeekPoint = {
  weeksAgo: number;
  onTimeRate: number;
};

export type DemoData = {
  classes: SchoolClass[];
  students: Student[];
  assignments: Assignment[];
  submissions: Submission[];
  activity: ActivityEntry[];
  approvals: Approval[];
  drafts?: TeacherDraft[];
  measuredPrepareMs?: number;
  tone: Tone;
  channel: Channel;
  trend: WeekPoint[];
};

export const TEACHER = {
  nameAr: "أ. سارة النعيمي",
  nameEn: "Ms. Sara Al Nuaimi",
  roleAr: "منسقة متابعة الواجبات",
  roleEn: "Assignment follow-up coordinator",
} as const;
