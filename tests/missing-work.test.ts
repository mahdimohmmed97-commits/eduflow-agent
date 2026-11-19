import assert from "node:assert/strict";
import { test } from "node:test";
import { patchSubmission } from "@/lib/records";
import { createSeed } from "@/lib/seed";
import { listFollowUps, resolvedStatus, studentsWhoHaveNotSubmitted, tally } from "@/lib/stats";
import { assignment, demo, schoolClass, student, submission } from "./fixture";

test("seeded linear homework lists only students who have not submitted", () => {
  const data = createSeed("2026-11-16");
  const missing = studentsWhoHaveNotSubmitted(data, "asg-linear").map((item) => item.id).sort();
  assert.deepEqual(missing, ["stu-05", "stu-06"]);
  for (const id of ["stu-01", "stu-02", "stu-03", "stu-04", "stu-07", "stu-08"]) {
    assert.equal(missing.includes(id), false, id);
  }
  assert.deepEqual(tally(data, "asg-linear"), { submitted: 4, late: 2, notSubmitted: 2, total: 8 });
});

test("a missing submission row counts as not submitted, and a conflicting submitted row does not", () => {
  const data = demo({
    classes: [schoolClass(), schoolClass("cls-2")],
    students: [student("s-submitted"), student("s-late"), student("s-missing"), student("s-other", "cls-2")],
    assignments: [assignment("past", "2020-01-01"), assignment("future", "2099-01-01")],
    submissions: [
      submission("past", "s-submitted", "submitted"),
      submission("past", "s-submitted", "not_submitted"),
      submission("past", "s-late", "late"),
      submission("past", "s-other", "not_submitted"),
      submission("future", "s-late", "not_submitted"),
    ],
  });

  assert.equal(resolvedStatus(data, "past", "s-submitted"), "submitted");
  assert.equal(resolvedStatus(data, "past", "s-missing"), "not_submitted");
  assert.deepEqual(
    studentsWhoHaveNotSubmitted(data, "past").map((item) => item.id),
    ["s-missing"],
  );
  assert.deepEqual(tally(data, "past"), { submitted: 1, late: 1, notSubmitted: 1, total: 3 });

  const pastFollowUps = listFollowUps(data).filter((item) => item.assignment.id === "past");
  assert.deepEqual(
    pastFollowUps.map((item) => [item.student.id, item.status]).sort(),
    [
      ["s-late", "late"],
      ["s-missing", "not_submitted"],
    ],
  );
  assert.equal(
    listFollowUps(data).some((item) => item.assignment.id === "future"),
    false,
  );
});

test("an unexpected status is ignored and a roster gap can be filled without inventing another class", () => {
  const data = demo({
    classes: [schoolClass()],
    students: [student("s-1"), student("s-2", "cls-2")],
    assignments: [assignment("past", "2020-01-01")],
    submissions: [],
  });
  const rejected = patchSubmission(data, "past", "s-1", { status: "graded" as "submitted" });
  assert.deepEqual(rejected, { updated: false, statusChanged: false });
  assert.equal(data.submissions.length, 0);

  const created = patchSubmission(data, "past", "s-1", { status: "not_submitted", note: "x".repeat(300) }, new Date("2026-11-16T10:00:00Z"));
  assert.deepEqual(created, { updated: true, statusChanged: true });
  assert.equal(data.submissions[0]?.status, "not_submitted");
  assert.equal(data.submissions[0]?.note.length, 280);
  assert.equal(data.submissions[0]?.submittedOn, "");

  const outsider = patchSubmission(data, "past", "s-2", { status: "not_submitted" });
  assert.deepEqual(outsider, { updated: false, statusChanged: false });
  assert.equal(data.submissions.length, 1);

  const submitted = patchSubmission(data, "past", "s-1", { status: "submitted" }, new Date("2026-11-16T10:00:00Z"));
  assert.equal(submitted.statusChanged, true);
  assert.equal(data.submissions[0]?.submittedOn, "2026-11-16");
  assert.equal(studentsWhoHaveNotSubmitted(data, "past").length, 0);
});
