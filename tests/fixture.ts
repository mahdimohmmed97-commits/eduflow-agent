import type { Assignment, DemoData, SchoolClass, Student, Submission, SubmissionStatus } from "@/lib/types";

export function schoolClass(id = "cls-1"): SchoolClass {
  return {
    id,
    nameAr: "الصف الثامن — أ",
    nameEn: "Grade 8 — A",
    subjectAr: "الرياضيات",
    subjectEn: "Mathematics",
    gradeAr: "الصف الثامن",
    gradeEn: "Grade 8",
    schoolAr: "مدرسة النور الدولية",
    schoolEn: "Al Noor International School",
    cityAr: "دبي",
    cityEn: "Dubai",
    timeZone: "Asia/Dubai",
  };
}

export function student(id: string, classId = "cls-1"): Student {
  return {
    id,
    classId,
    nameAr: `الطالبة ${id}`,
    nameEn: `Student ${id}`,
    gender: "female",
    parentNameAr: `ولية ${id}`,
    parentNameEn: `Parent ${id}`,
    parentPhone: "+971500000000",
  };
}

export function assignment(id: string, dueDate: string, classId = "cls-1"): Assignment {
  return {
    id,
    classId,
    titleAr: `واجب ${id}`,
    titleEn: `Homework ${id}`,
    descriptionAr: "تمرين خيالي",
    descriptionEn: "A fictional exercise",
    dueDate,
  };
}

export function submission(
  assignmentId: string,
  studentId: string,
  status: SubmissionStatus,
): Submission {
  return { assignmentId, studentId, status, submittedOn: status === "not_submitted" ? "" : "2020-01-02", note: "" };
}

export function demo(input: Pick<DemoData, "classes" | "students" | "assignments" | "submissions">): DemoData {
  return {
    ...input,
    tone: "formal",
    channel: "whatsapp",
    approvals: [],
    trend: [],
    activity: [],
  };
}
