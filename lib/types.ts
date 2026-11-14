export type Locale = "ar" | "en";

export type Gender = "female" | "male";

export type SubmissionStatus = "submitted" | "late" | "not_submitted";

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

export type DemoData = {
  classes: SchoolClass[];
  students: Student[];
  assignments: Assignment[];
  submissions: Submission[];
};

export const TEACHER = {
  nameAr: "أ. سارة النعيمي",
  nameEn: "Ms. Sara Al Nuaimi",
  roleAr: "منسقة متابعة الواجبات",
  roleEn: "Assignment follow-up coordinator",
} as const;
