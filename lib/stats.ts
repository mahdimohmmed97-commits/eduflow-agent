import { isPastDue, zoneOf } from "@/lib/dates";
import type { Assignment, DemoData, SchoolClass, Student, SubmissionStatus } from "@/lib/types";

export const MINUTES_PER_DRAFT = 6;

export type Tally = {
  submitted: number;
  late: number;
  notSubmitted: number;
  total: number;
};

export type FollowUp = {
  student: Student;
  assignment: Assignment;
  schoolClass: SchoolClass;
  status: Exclude<SubmissionStatus, "submitted">;
};

export function tally(data: DemoData, assignmentId: string): Tally {
  const rows = data.submissions.filter((item) => item.assignmentId === assignmentId);
  const submitted = rows.filter((item) => item.status === "submitted").length;
  const late = rows.filter((item) => item.status === "late").length;
  const notSubmitted = rows.filter((item) => item.status === "not_submitted").length;
  return { submitted, late, notSubmitted, total: rows.length };
}

export function pastDueTally(data: DemoData): Tally & { rate: number | null } {
  let submitted = 0;
  let late = 0;
  let notSubmitted = 0;
  for (const assignment of data.assignments) {
    if (!isPastDue(assignment.dueDate, zoneOf(data.classes, assignment.classId))) continue;
    const counts = tally(data, assignment.id);
    submitted += counts.submitted;
    late += counts.late;
    notSubmitted += counts.notSubmitted;
  }
  const total = submitted + late + notSubmitted;
  return {
    submitted,
    late,
    notSubmitted,
    total,
    rate: total === 0 ? null : Math.round((submitted / total) * 100),
  };
}

export function classOnTimeRate(data: DemoData, classId: string): number | null {
  const zone = zoneOf(data.classes, classId);
  const assignments = data.assignments.filter((item) => item.classId === classId && isPastDue(item.dueDate, zone));
  if (assignments.length === 0) return null;
  let onTime = 0;
  let total = 0;
  for (const assignment of assignments) {
    const counts = tally(data, assignment.id);
    onTime += counts.submitted;
    total += counts.total;
  }
  if (total === 0) return null;
  return Math.round((onTime / total) * 100);
}

export function focusAssignment(data: DemoData, classId: string): Assignment | null {
  const list = data.assignments.filter((item) => item.classId === classId);
  const zone = zoneOf(data.classes, classId);
  const past = list.filter((item) => isPastDue(item.dueDate, zone));
  const pool = past.length > 0 ? past : list;
  return [...pool].sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0] ?? null;
}

export function listFollowUps(data: DemoData): FollowUp[] {
  const items: FollowUp[] = [];
  for (const assignment of data.assignments) {
    if (!isPastDue(assignment.dueDate, zoneOf(data.classes, assignment.classId))) continue;
    const schoolClass = data.classes.find((item) => item.id === assignment.classId);
    if (!schoolClass) continue;
    const roster = data.students.filter((item) => item.classId === assignment.classId);
    for (const student of roster) {
      const submission = data.submissions.find(
        (item) => item.assignmentId === assignment.id && item.studentId === student.id,
      );
      if (!submission || submission.status === "submitted") continue;
      items.push({ student, assignment, schoolClass, status: submission.status });
    }
  }
  return items;
}

export type TrendPoint = { weeksAgo: number; onTimeRate: number; live: boolean };

export function trendSeries(data: DemoData): TrendPoint[] {
  const history = [...data.trend]
    .filter((item) => Number.isFinite(item.onTimeRate))
    .sort((a, b) => b.weeksAgo - a.weeksAgo)
    .map((item) => ({ weeksAgo: item.weeksAgo, onTimeRate: Math.max(0, Math.min(100, Math.round(item.onTimeRate))), live: false }));
  const live = pastDueTally(data).rate;
  if (live !== null) history.push({ weeksAgo: 0, onTimeRate: live, live: true });
  return history;
}

export function uniqueStudentCount(items: Array<{ student: { id: string } }>): number {
  return new Set(items.map((item) => item.student.id)).size;
}

export function assignmentFollowUps(data: DemoData, assignmentId: string): FollowUp[] {
  return listFollowUps(data).filter((item) => item.assignment.id === assignmentId);
}
