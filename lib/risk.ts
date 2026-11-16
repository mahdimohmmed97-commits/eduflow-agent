import { isPastDue, zoneOf } from "@/lib/dates";
import type { DemoData, Student } from "@/lib/types";

export type RiskLevel = "high" | "watch" | "steady";
export type RiskPattern = "repeated" | "worsening" | "improving" | "single" | "clear";

export type RiskIssue = {
  assignmentId: string;
  status: "late" | "not_submitted";
  dueDate: string;
};

export type StudentRisk = {
  student: Student;
  score: number;
  level: RiskLevel;
  pattern: RiskPattern;
  issues: RiskIssue[];
  latestIssue: RiskIssue | null;
};

export function assessStudent(data: DemoData, student: Student): StudentRisk {
  const zone = zoneOf(data.classes, student.classId);
  const past = data.assignments
    .filter((item) => item.classId === student.classId && isPastDue(item.dueDate, zone))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const rows = past.map((assignment) => {
    const submission = data.submissions.find(
      (item) => item.assignmentId === assignment.id && item.studentId === student.id,
    );
    const status = submission?.status ?? "not_submitted";
    return { assignment, status };
  });
  const issues: RiskIssue[] = [];
  for (const row of rows) {
    if (row.status === "submitted") continue;
    issues.push({
      assignmentId: row.assignment.id,
      status: row.status,
      dueDate: row.assignment.dueDate,
    });
  }

  let score = 0;
  for (const issue of issues) score += issue.status === "not_submitted" ? 34 : 18;
  let pattern: RiskPattern = issues.length === 0 ? "clear" : issues.length === 1 ? "single" : "repeated";
  if (issues.length >= 2) {
    score += 16;
    const last = issues[issues.length - 1];
    const previous = issues[issues.length - 2];
    if (last.status === "not_submitted" && previous.status !== "not_submitted") {
      pattern = "worsening";
      score += 8;
    }
  }

  const lastRow = rows[rows.length - 1];
  const earlierIssue = issues.some((issue) => issue.assignmentId !== lastRow?.assignment.id);
  if (lastRow?.status === "submitted" && earlierIssue) {
    pattern = "improving";
    score = Math.max(8, score - 22);
  }

  score = Math.max(0, Math.min(100, score));
  const level: RiskLevel = score >= 60 ? "high" : score >= 18 ? "watch" : "steady";
  return {
    student,
    score,
    level,
    pattern,
    issues,
    latestIssue: issues[issues.length - 1] ?? null,
  };
}

export function dailyActions(data: DemoData): StudentRisk[] {
  return data.students
    .map((student) => assessStudent(data, student))
    .filter((item) => item.level !== "steady" && item.pattern !== "improving" && item.latestIssue)
    .sort((a, b) => b.score - a.score || a.student.nameAr.localeCompare(b.student.nameAr, "ar"));
}

export function improvingStudents(data: DemoData): StudentRisk[] {
  return data.students
    .map((student) => assessStudent(data, student))
    .filter((item) => item.pattern === "improving");
}
