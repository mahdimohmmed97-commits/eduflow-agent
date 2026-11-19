import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { POST } from "@/app/api/agent/route";
import { explainAgentRequest, localResult, reminderTemplates, resultFromModel, type ReminderRequest, type SummaryRequest } from "@/lib/agent";
import { approveDraft, createPendingDraft, deliverApprovedDraft } from "@/lib/approval";
import { hasUnsafeClaim } from "@/lib/claims";
import { presentDraft } from "@/lib/channels";
import { runAgent } from "@/lib/client-agent";
import type { Audience, Channel, Locale, Tone } from "@/lib/types";

const student = {
  id: "stu-01",
  name: "Layla Al Mansoori",
  givenName: "Layla",
  gender: "female" as const,
  parentName: "Fatima Al Mansoori",
  status: "not_submitted" as const,
};

function reminder(overrides: Partial<ReminderRequest> = {}): ReminderRequest {
  return {
    kind: "reminders",
    locale: "en",
    teacherName: "Ms. Sara Al Nuaimi",
    schoolLine: "Al Noor International School — Dubai",
    className: "Grade 8 — A",
    subject: "Mathematics",
    assignmentTitle: "Fractions",
    dueDateLabel: "12 November 2026",
    tone: "formal",
    students: [student],
    ...overrides,
  };
}

function summary(flags = [{ studentId: "stu-01", studentName: "Layla Al Mansoori", reason: "Not submitted: Fractions" }]): SummaryRequest {
  return {
    kind: "summary",
    locale: "en",
    teacherName: "Ms. Sara Al Nuaimi",
    classes: [
      {
        id: "cls-1",
        name: "Grade 8 — A",
        subject: "Mathematics",
        schoolLine: "Al Noor International School — Dubai",
        studentCount: 8,
        onTimeRate: 57,
        assignments: [{ title: "Fractions", dueDateLabel: "12 November 2026", pastDue: true, submitted: 4, late: 2, notSubmitted: 2 }],
        flags,
      },
    ],
  };
}

test("templates and channel text do not promise marks or school policy", () => {
  const locales: Locale[] = ["ar", "en"];
  const tones: Tone[] = ["formal", "friendly"];
  const channels: Channel[] = ["whatsapp", "email", "sms"];
  const audiences: Audience[] = ["student", "parent"];
  for (const locale of locales) {
    for (const tone of tones) {
      for (const status of ["late", "not_submitted"] as const) {
        const request = reminder({
          locale,
          tone,
          students: [{ ...student, status, name: locale === "ar" ? "ليلى المنصوري" : student.name, givenName: locale === "ar" ? "ليلى" : "Layla", parentName: locale === "ar" ? "فاطمة المنصوري" : student.parentName }],
        });
        const [draft] = reminderTemplates(request);
        for (const text of [draft.studentMessage, draft.parentMessage]) {
          assert.equal(hasUnsafeClaim(text), false, `${locale} ${tone} ${status}`);
          assert.equal(text.includes(request.assignmentTitle), true);
          assert.equal(text.includes(request.students[0].name), true);
        }
        for (const channel of channels) {
          for (const audience of audiences) {
            const presented = presentDraft({
              channel,
              tone,
              locale,
              audience,
              fullText: audience === "parent" ? draft.parentMessage : draft.studentMessage,
              assignmentTitle: request.assignmentTitle,
              studentName: request.students[0].name,
              givenName: request.students[0].givenName,
              parentName: request.students[0].parentName,
              gender: "female",
              status,
              dueLabel: request.dueDateLabel,
              teacherName: request.teacherName,
            });
            assert.equal(hasUnsafeClaim(presented.text), false, `${channel} ${audience}`);
          }
        }
      }
    }
  }
});

test("model text that adds grades, people, or unknown numbers falls back to the supplied record", () => {
  const request = reminder();
  const fallback = reminderTemplates(request)[0];
  const broken = resultFromModel(request, "this is not json");
  assert.equal(broken.source, "template");
  assert.equal(broken.kind === "reminders" && broken.drafts[0]?.studentMessage, fallback.studentMessage);

  const promised = resultFromModel(
    request,
    JSON.stringify({
      drafts: [
        {
          studentId: "stu-01",
          studentMessage: "Hello Layla Al Mansoori, submitting on time keeps the full mark.",
          parentMessage: "Hello Fatima Al Mansoori, school policy gives Layla Al Mansoori a guaranteed grade.",
        },
        { studentId: "ghost", studentMessage: "Invented student scored 100%.", parentMessage: "Invented parent" },
      ],
    }),
  );
  assert.equal(promised.kind, "reminders");
  if (promised.kind !== "reminders") return;
  assert.deepEqual(promised.drafts.map((item) => item.studentId), ["stu-01"]);
  assert.equal(promised.drafts[0]?.studentMessage, fallback.studentMessage);
  assert.equal(promised.drafts[0]?.parentMessage, fallback.parentMessage);
  assert.equal(JSON.stringify(promised).includes("ghost"), false);

  const swapped = resultFromModel(
    request,
    JSON.stringify({
      drafts: [{ studentId: "stu-01", studentMessage: "Hello Omar Al Harbi, Fractions is missing.", parentMessage: fallback.parentMessage }],
    }),
  );
  assert.equal(swapped.kind === "reminders" && swapped.drafts[0]?.studentMessage, fallback.studentMessage);

  const safeText = "Hello Layla Al Mansoori, I still do not have Fractions. Kind regards, Ms. Sara Al Nuaimi";
  const safe = resultFromModel(
    request,
    JSON.stringify({ drafts: [{ studentId: "stu-01", studentMessage: safeText, parentMessage: fallback.parentMessage }] }),
  );
  assert.equal(safe.source, "openai");
  assert.equal(safe.kind === "reminders" && safe.drafts[0]?.studentMessage, safeText);

  const weekly = summary();
  const invented = resultFromModel(weekly, JSON.stringify({ summary: "Layla Al Mansoori scored 100% under the school policy." }));
  assert.equal(invented.kind === "summary" && invented.summary.includes("100%"), false);
  assert.equal(invented.source, "template");

  const grounded = "Ms. Sara Al Nuaimi, Layla Al Mansoori has not submitted Fractions. Contact that student first. The on-time rate in the record is 57%.";
  const kept = resultFromModel(weekly, JSON.stringify({ summary: grounded }));
  assert.equal(kept.kind === "summary" && kept.summary.includes("Layla Al Mansoori"), true);
  assert.equal(kept.source, "openai");
});

test("duplicate student ids and incomplete requests are rejected", () => {
  const valid = reminder();
  assert.equal(explainAgentRequest(valid).ok, true);
  assert.equal(explainAgentRequest({ ...valid, sendNow: true }).ok, true);
  const parsed = explainAgentRequest({ ...valid, sendNow: true });
  assert.equal(parsed.ok && "sendNow" in parsed.request, false);

  const duplicate = reminder({
    students: [student, { ...student, name: "Someone Else", givenName: "Someone", parentName: "Another Parent" }],
  });
  const duplicateResult = explainAgentRequest(duplicate);
  assert.deepEqual(duplicateResult, { ok: false, error: "duplicate_student_id" });
  const spaced = explainAgentRequest(reminder({ students: [student, { ...student, id: " stu-01 " }] }));
  assert.equal(spaced.ok, false);
  if (!spaced.ok) assert.equal(spaced.error, "duplicate_student_id");

  const repeated = summary([
    { studentId: "stu-01", studentName: "Layla Al Mansoori", reason: "Not submitted: Fractions" },
    { studentId: "stu-01", studentName: "Layla Al Mansoori", reason: "Late: Linear Equations" },
  ]);
  assert.equal(explainAgentRequest(repeated).ok, true);
  const sameFlag = summary([
    { studentId: "stu-01", studentName: "Layla Al Mansoori", reason: "Not submitted: Fractions" },
    { studentId: "stu-01", studentName: "Layla Al Mansoori", reason: "Not submitted: Fractions" },
  ]);
  assert.deepEqual(explainAgentRequest(sameFlag), { ok: false, error: "duplicate_student_id" });

  const incomplete = [
    null,
    [],
    {},
    { kind: "send", students: [student] },
    { ...valid, teacherName: " " },
    { ...valid, students: [] },
    { ...valid, students: [{ ...student, status: "submitted" }] },
    { ...valid, students: [{ ...student, id: "" }] },
    { ...valid, locale: "fr" },
    { ...valid, tone: "angry" },
    { ...summary(), classes: [{ ...summary().classes[0], onTimeRate: 150 }] },
    { ...summary(), classes: [{ ...summary().classes[0], id: "cls-1" }, { ...summary().classes[0], id: "cls-1" }] },
    { ...summary(), classes: [{ ...summary().classes[0], assignments: [{ ...summary().classes[0].assignments[0], pastDue: "yes" }] }] },
  ];
  for (const body of incomplete) {
    const result = explainAgentRequest(body);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error, "invalid_request");
  }
});

test("a draft stays unsent until a teacher approves it, and approval still does not send it", () => {
  const pending = createPendingDraft({
    studentId: "stu-01",
    assignmentId: "asg-1",
    audience: "parent",
    text: "A draft for the teacher to review.",
  });
  assert.equal(pending.status, "pending_teacher_approval");
  assert.equal(pending.sent, false);

  for (const actor of ["agent", "system"] as const) {
    const refused = approveDraft(pending, actor);
    assert.equal(refused.ok, false);
    if (!refused.ok) {
      assert.equal(refused.error, "teacher_approval_required");
      assert.equal(refused.sent, false);
    }
  }
  assert.equal(approveDraft({ ...pending, text: "  " }, "teacher").ok, false);

  const approved = approveDraft(pending, "teacher");
  assert.equal(approved.ok, true);
  if (!approved.ok) return;
  assert.equal(approved.draft.status, "approved");
  assert.equal(approved.draft.approvedBy, "teacher");
  assert.equal(approved.draft.sent, false);
  assert.deepEqual(deliverApprovedDraft(approved.draft), { ok: false, sent: false, error: "sending_disabled" });

  const drafted = localResult(reminder());
  assert.equal("sent" in drafted, false);
  assert.equal(drafted.kind, "reminders");
});

test("the only API drafts from the supplied record and never delivers a message", async () => {
  const originalKey = process.env.OPENAI_API_KEY;
  const originalFetch = globalThis.fetch;
  const calls: string[] = [];
  delete process.env.OPENAI_API_KEY;
  globalThis.fetch = async (input) => {
    calls.push(String(input));
    return new Response("should not be called", { status: 500 });
  };
  try {
    const valid = reminder();
    const ok = await POST(new Request("http://localhost/api/agent", { method: "POST", body: JSON.stringify({ ...valid, sendNow: true }) }));
    assert.equal(ok.status, 200);
    const body = (await ok.json()) as { kind?: string; sent?: boolean; drafts?: Array<{ studentId: string }> };
    assert.equal(body.kind, "reminders");
    assert.equal(body.sent, undefined);
    assert.deepEqual(body.drafts?.map((item) => item.studentId), ["stu-01"]);
    assert.equal(calls.length, 0);

    const duplicate = await POST(
      new Request("http://localhost/api/agent", {
        method: "POST",
        body: JSON.stringify(reminder({ students: [student, { ...student, name: "Other Person", givenName: "Other", parentName: "Other Parent" }] })),
      }),
    );
    assert.equal(duplicate.status, 400);
    assert.deepEqual(await duplicate.json(), { error: "duplicate_student_id" });

    const invalid = await POST(new Request("http://localhost/api/agent", { method: "POST", body: "{" }));
    assert.equal(invalid.status, 400);
    assert.deepEqual(await invalid.json(), { error: "invalid_json" });

    const missing = await POST(new Request("http://localhost/api/agent", { method: "POST", body: JSON.stringify({ kind: "reminders" }) }));
    assert.equal(missing.status, 400);
    assert.deepEqual(await missing.json(), { error: "invalid_request" });

    const sendKind = await POST(new Request("http://localhost/api/agent", { method: "POST", body: JSON.stringify({ kind: "send", to: "+971500000000" }) }));
    assert.equal(sendKind.status, 400);
    assert.deepEqual(await sendKind.json(), { error: "invalid_request" });

    const oversized = await POST(new Request("http://localhost/api/agent", { method: "POST", body: `{"pad":"${"x".repeat(64_000)}"}` }));
    assert.equal(oversized.status, 413);

    process.env.OPENAI_API_KEY = "test-key";
    globalThis.fetch = async (input) => {
      calls.push(String(input));
      return Response.json({
        sent: true,
        choices: [
          {
            message: {
              content: JSON.stringify({
                drafts: [{ studentId: "stu-01", studentMessage: "Layla Al Mansoori will get full marks.", parentMessage: "Call +971 50 000 0000 now." }],
              }),
            },
          },
        ],
      });
    };
    const guarded = await POST(new Request("http://localhost/api/agent", { method: "POST", body: JSON.stringify(valid) }));
    const guardedBody = (await guarded.json()) as { sent?: boolean; source?: string; drafts?: Array<{ studentMessage: string; parentMessage: string }> };
    assert.deepEqual(calls, ["https://api.openai.com/v1/chat/completions"]);
    assert.equal(guardedBody.sent, undefined);
    assert.equal(guardedBody.source, "template");
    assert.equal(guardedBody.drafts?.[0]?.studentMessage.includes("full marks"), false);
    assert.equal(guardedBody.drafts?.[0]?.parentMessage.includes("+971"), false);

    globalThis.fetch = async () => new Response(JSON.stringify({ error: "duplicate_student_id" }), { status: 400 });
    const clientDuplicate = await runAgent(reminder({ students: [student, student] }));
    assert.deepEqual(clientDuplicate, { ok: false, error: "duplicate_student_id" });

    globalThis.fetch = async () => {
      throw new Error("offline");
    };
    const offline = await runAgent(valid);
    assert.equal(offline.ok, true);
    if (offline.ok) {
      assert.equal(offline.source, "local");
      assert.equal("sent" in offline.result, false);
    }
  } finally {
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
    globalThis.fetch = originalFetch;
  }
});

test("application code has no outbound delivery endpoint", () => {
  const root = process.cwd();
  const files = walk(path.join(root, "app")).concat(walk(path.join(root, "lib")), walk(path.join(root, "components")));
  const fetches: string[] = [];
  const routes = files.filter((file) => file.includes(`${path.sep}app${path.sep}api${path.sep}`) && file.endsWith(`${path.sep}route.ts`));
  assert.deepEqual(routes.map((file) => path.relative(root, file)), [path.join("app", "api", "agent", "route.ts")]);
  for (const file of files) {
    if (!/\.(ts|tsx)$/.test(file)) continue;
    const source = readFileSync(file, "utf8");
    assert.equal(source.includes("sent: true"), false, path.relative(root, file));
    for (const banned of ["wa.me", "twilio", "nodemailer", "api.resend.com", "smtp://", "graph.facebook.com"]) {
      assert.equal(source.includes(banned), false, `${path.relative(root, file)} ${banned}`);
    }
    for (const match of source.matchAll(/fetch\(\s*["'`]([^"'`]+)["'`]/g)) {
      fetches.push(`${path.relative(root, file)} ${match[1]}`);
    }
  }
  assert.deepEqual(fetches.sort(), [
    "app/api/agent/route.ts https://api.openai.com/v1/chat/completions",
    "lib/client-agent.ts /api/agent",
  ]);
});

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}
