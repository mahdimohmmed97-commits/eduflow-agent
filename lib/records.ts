import { todayIso, zoneOf } from "@/lib/dates";
import type { DemoData, SubmissionStatus } from "@/lib/types";

export type SubmissionPatch = {
  status?: SubmissionStatus;
  note?: string;
};

const STATUSES = new Set<SubmissionStatus>(["submitted", "late", "not_submitted"]);

export function patchSubmission(
  data: DemoData,
  assignmentId: string,
  studentId: string,
  patch: SubmissionPatch,
  now: Date = new Date(),
): { updated: boolean; statusChanged: boolean } {
  if (patch.status !== undefined && !STATUSES.has(patch.status)) return { updated: false, statusChanged: false };
  const assignment = data.assignments.find((item) => item.id === assignmentId);
  const student = data.students.find((item) => item.id === studentId);
  let row = data.submissions.find((item) => item.assignmentId === assignmentId && item.studentId === studentId);
  if (!row) {
    if (!assignment || !student || student.classId !== assignment.classId) return { updated: false, statusChanged: false };
    row = { assignmentId, studentId, status: "not_submitted", submittedOn: "", note: "" };
    data.submissions.push(row);
  }
  if (patch.note !== undefined) row.note = patch.note.slice(0, 280);
  if (!patch.status) return { updated: true, statusChanged: false };
  row.status = patch.status;
  if (patch.status === "not_submitted") row.submittedOn = "";
  if ((patch.status === "submitted" || patch.status === "late") && !row.submittedOn) {
    row.submittedOn = todayIso(zoneOf(data.classes, assignment?.classId ?? student?.classId ?? ""), now);
  }
  return { updated: true, statusChanged: true };
}
