import assert from "node:assert/strict";
import { test } from "node:test";
import { connectionFallback, runAgent } from "@/lib/client-agent";
import { approveFlowDraft, createFlowDraft, editFlowDraft, formatMeasuredDuration, rejectFlowDraft, totalMeasuredPrepareMs } from "@/lib/draft-flow";
import { dictionary, pageDirection, type MessageKey } from "@/lib/i18n";
import { studentsNotSubmittedCount } from "@/lib/stats";
import { assignment, demo, schoolClass, student, submission } from "./fixture";

const phase2Keys = [
  "stepsTitle",
  "stepPrepare",
  "stepEdit",
  "stepDecide",
  "statusPending",
  "statusApproved",
  "statusRejected",
  "sourceBadgeAi",
  "sourceBadgeTemplate",
  "sourceBadgeLocal",
  "timeoutNotice",
  "offlineNotice",
  "serverNotice",
  "claimBlocked",
  "unknownFactBlocked",
  "otherStudentBlocked",
  "emptyBlocked",
  "roleNotIdentity",
  "regenerateDraft",
  "measuredPanelTitle",
  "measuredMissing",
  "measuredPrepared",
  "measuredApproved",
  "measuredTime",
  "measuredHint",
  "measuredZero",
] as const satisfies readonly MessageKey[];

function draft(text = "Please send the fractions homework.") {
  return createFlowDraft({
    id: "draft-1",
    studentId: "stu-01",
    assignmentId: "asg-1",
    audience: "parent",
    text,
    source: "template",
    fallback: null,
    prepareMs: 1820.4,
    allowedParts: ["Layla Al Mansoori", "Layla", "Fractions", "+971500000001"],
    otherNames: ["Omar Al Hashimi", "Parent Omar"],
  });
}

test("creating, editing, rejecting, and approving a draft never marks it sent", () => {
  const created = draft();
  assert.equal(created.status, "pending_review");
  assert.equal(created.sent, false);
  assert.equal(created.prepareMs, 1820);

  const edited = editFlowDraft(created, "Please send the fractions homework, Layla.");
  assert.equal(edited.status, "pending_review");
  assert.equal(edited.text.includes("Layla"), true);
  assert.equal(editFlowDraft({ ...edited, status: "approved" }, "changed").text, edited.text);

  const rejected = rejectFlowDraft(edited);
  assert.equal(rejected.status, "rejected");
  assert.equal(rejected.sent, false);
  assert.equal(rejectFlowDraft(rejected).status, "rejected");

  const again = createFlowDraft({ ...created, id: "draft-2", text: edited.text, prepareMs: 40 });
  assert.equal(again.status, "pending_review");
  const approved = approveFlowDraft(again, "teacher");
  assert.equal(approved.ok, true);
  assert.equal(approved.sent, false);
  if (approved.ok) {
    assert.equal(approved.draft.status, "approved");
    assert.equal(approved.draft.sent, false);
  }
  assert.equal(approveFlowDraft(again, "agent").ok, false);
  assert.equal(approveFlowDraft(again, "agent").sent, false);
  assert.equal(approveFlowDraft(rejected, "teacher").ok, false);
});

test("approval is blocked when edited text adds an unsupported claim, and nothing is sent", () => {
  const cases = [
    ["Layla will get full marks.", "unsupported_claim"],
    ["الدرجة كاملة مضمونة", "unsupported_claim"],
    ["Call +971501112233 about Fractions.", "unknown_fact"],
    ["Omar Al Hashimi also missed Fractions.", "other_student"],
    ["   ", "empty"],
  ] as const;
  for (const [text, reason] of cases) {
    const pending = draft(text);
    const decision = approveFlowDraft(pending, "teacher");
    assert.equal(decision.ok, false);
    assert.equal(decision.sent, false);
    if (!decision.ok) assert.equal(decision.reason, reason);
    assert.equal(decision.draft.status, "pending_review");
    assert.equal(decision.draft.sent, false);
  }
});

test("a timeout and an offline failure both fall back without a send flag", async () => {
  assert.equal(connectionFallback(new DOMException("timed out", "TimeoutError")), "timeout");
  assert.equal(connectionFallback(new TypeError("Failed to fetch")), "offline");

  const original = globalThis.fetch;
  const request = {
    kind: "reminders" as const,
    locale: "en" as const,
    tone: "formal" as const,
    teacherName: "Ms. Sara Al Nuaimi",
    schoolLine: "Al Noor International School — Dubai",
    className: "Grade 8 — A",
    subject: "Mathematics",
    assignmentTitle: "Fractions",
    dueDateLabel: "12 November 2026",
    students: [
      {
        id: "stu-01",
        name: "Layla Al Mansoori",
        givenName: "Layla",
        gender: "female" as const,
        parentName: "Fatima Al Mansoori",
        status: "not_submitted" as const,
      },
    ],
  };
  try {
    globalThis.fetch = async () => {
      throw new DOMException("timed out", "TimeoutError");
    };
    const timedOut = await runAgent(request);
    assert.equal(timedOut.ok, true);
    if (timedOut.ok) {
      assert.equal(timedOut.source, "local");
      assert.equal(timedOut.fallback, "timeout");
      assert.equal("sent" in timedOut.result, false);
    }

    globalThis.fetch = async () => {
      throw new TypeError("Failed to fetch");
    };
    const offline = await runAgent(request);
    assert.equal(offline.ok, true);
    if (offline.ok) {
      assert.equal(offline.fallback, "offline");
      assert.equal(offline.source, "local");
    }

    globalThis.fetch = async () => new Response("no", { status: 500 });
    const server = await runAgent(request);
    assert.equal(server.ok, true);
    if (server.ok) assert.equal(server.fallback, "server");
  } finally {
    globalThis.fetch = original;
  }
});

test("measured preparation time is a sum of real durations, not an estimate of time saved", () => {
  assert.equal(totalMeasuredPrepareMs([{ prepareMs: 1200 }, { prepareMs: 800 }]), 2000);
  assert.equal(totalMeasuredPrepareMs([], 0), 0);
  assert.equal(totalMeasuredPrepareMs([{ prepareMs: 5 }], Number.NaN), 0);
  for (const locale of ["ar", "en"] as const) {
    const label = formatMeasuredDuration(1820, locale);
    assert.equal(label.toLowerCase().includes("saved"), false);
    assert.equal(label.includes("موفّر"), false);
    assert.equal(label.includes("تقدير"), false);
  }
  assert.equal(formatMeasuredDuration(1820, "en"), "1.8 s");
  assert.equal(formatMeasuredDuration(0, "ar"), "0 مللي ثانية");
});

test("the missing-submission count uses students who have no submission on past-due work", () => {
  const data = demo({
    classes: [schoolClass()],
    students: [student("stu-01"), student("stu-02"), student("stu-03")],
    assignments: [assignment("asg-old", "2020-01-01"), assignment("asg-new", "2999-01-01")],
    submissions: [
      submission("asg-old", "stu-01", "not_submitted"),
      submission("asg-old", "stu-02", "late"),
      submission("asg-old", "stu-03", "submitted"),
      submission("asg-new", "stu-02", "not_submitted"),
    ],
  });
  assert.equal(studentsNotSubmittedCount(data), 1);
});

test("Arabic and English interface strings stay paired and in the right direction", () => {
  const arabic = Object.keys(dictionary.ar).sort();
  const english = Object.keys(dictionary.en).sort();
  assert.deepEqual(arabic, english);
  assert.equal(pageDirection("ar"), "rtl");
  assert.equal(pageDirection("en"), "ltr");
  for (const key of phase2Keys) {
    assert.match(dictionary.ar[key], /[\u0600-\u06FF]/);
    assert.match(dictionary.en[key], /[A-Za-z]/);
    assert.equal(/[\u0600-\u06FF]/.test(dictionary.en[key]), false);
  }
  assert.equal(dictionary.ar.roleNotIdentity.includes("تسجيل دخول"), true);
  assert.equal(dictionary.en.roleNotIdentity.toLowerCase().includes("not a login"), true);
  assert.equal(dictionary.ar.stepDecide.includes("لا يرسل"), true);
  assert.equal(dictionary.en.stepDecide.toLowerCase().includes("does not send"), true);
});
