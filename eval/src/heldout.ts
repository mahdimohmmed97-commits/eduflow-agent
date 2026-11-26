import { readFileSync } from "node:fs";
import { explainAgentRequest, localResult, type ReminderRequest, type ReminderStudent } from "@/lib/agent";
import { reminderTextIsGrounded as legacyGrounded } from "./legacy-claims";

/**
 * Held-out safety set (eval/heldout/heldout.json). Measures:
 *  - drafts: dangerous caught / dangerous missed / benign wrongly rejected, for a given validator;
 *  - records: whether the local-template pipeline leaks attacker content from untrusted record fields.
 * MEASURED RESULT about validators and templates only. No model is involved.
 */
export type HeldoutDraft = { id: string; context: "en" | "ar"; studentId: string; audience: "student" | "parent"; label: "dangerous" | "benign"; risk: string; text: string };
export type HeldoutRecord = { id: string; label: "adversarial" | "benign"; risk: string; request: Record<string, unknown>; attackMarkers: string[] };
export type Heldout = { heldoutVersion: string; writtenBefore: string; contexts: Record<"en" | "ar", ReminderRequest>; drafts: HeldoutDraft[]; records: HeldoutRecord[] };

export type DraftValidator = (text: string, request: ReminderRequest, student: ReminderStudent, audience: "student" | "parent") => boolean;

export function loadHeldout(path = "eval/heldout/heldout.json"): Heldout {
  return JSON.parse(readFileSync(path, "utf8")) as Heldout;
}

/** The production check before Phase 9 (frozen copy). Returns true when the draft is ACCEPTED. */
export const legacyValidator: DraftValidator = (text, request, student) => {
  const parts = [request.teacherName, request.schoolLine, request.className, request.subject, request.assignmentTitle, request.dueDateLabel, student.id, student.name, student.givenName, student.parentName];
  const others = request.students.filter((item) => item.id !== student.id).flatMap((item) => [item.name, item.givenName, item.parentName]);
  return legacyGrounded(text, parts, others, [student.name, student.givenName]);
};

export function scoreDrafts(heldout: Heldout, accept: DraftValidator) {
  const rows = heldout.drafts.map((draft) => {
    const request = heldout.contexts[draft.context];
    const student = request.students.find((item) => item.id === draft.studentId) as ReminderStudent;
    const accepted = accept(draft.text, request, student, draft.audience);
    return { id: draft.id, label: draft.label, risk: draft.risk, accepted };
  });
  const dangerous = rows.filter((row) => row.label === "dangerous");
  const benign = rows.filter((row) => row.label === "benign");
  return {
    dangerousTotal: dangerous.length,
    dangerousCaught: dangerous.filter((row) => !row.accepted).length,
    dangerousMissed: dangerous.filter((row) => row.accepted).map((row) => `${row.id} (${row.risk})`),
    benignTotal: benign.length,
    benignWronglyRejected: benign.filter((row) => !row.accepted).map((row) => `${row.id} (${row.risk})`),
  };
}

export type RecordOutcome = { id: string; label: string; outcome: "drafts" | "rejected"; reason: string | null; leakedMarkers: string[] };

/** Default pipeline: the production local template. Phase 9 code may pass a different pipeline. */
export function templatePipeline(request: Record<string, unknown>): { drafts: string[] } | { rejected: string } {
  const explained = explainAgentRequest(request);
  if (!explained.ok) return { rejected: explained.error };
  const result = localResult(explained.request);
  if (result.kind !== "reminders") return { rejected: "not_reminders" };
  return { drafts: result.drafts.flatMap((draft) => [draft.studentMessage, draft.parentMessage]) };
}

export function scoreRecords(heldout: Heldout, pipeline: (request: Record<string, unknown>) => { drafts: string[] } | { rejected: string } = templatePipeline) {
  const rows: RecordOutcome[] = heldout.records.map((record) => {
    const out = pipeline(record.request);
    if ("rejected" in out) return { id: record.id, label: record.label, outcome: "rejected", reason: out.rejected, leakedMarkers: [] };
    const text = out.drafts.join("\n");
    return { id: record.id, label: record.label, outcome: "drafts", reason: null, leakedMarkers: record.attackMarkers.filter((marker) => text.includes(marker)) };
  });
  const adversarial = rows.filter((row) => row.label === "adversarial");
  const benign = rows.filter((row) => row.label === "benign");
  return {
    adversarialTotal: adversarial.length,
    adversarialLeaked: adversarial.filter((row) => row.leakedMarkers.length > 0).map((row) => `${row.id}: ${row.leakedMarkers.join(" | ")}`),
    adversarialSafe: adversarial.filter((row) => row.leakedMarkers.length === 0).length,
    benignTotal: benign.length,
    benignWronglyRejected: benign.filter((row) => row.outcome === "rejected").map((row) => `${row.id}: ${row.reason}`),
    rows,
  };
}

if (process.argv[1]?.endsWith("heldout.ts")) {
  const heldout = loadHeldout();
  console.log(JSON.stringify({ heldoutVersion: heldout.heldoutVersion, legacyValidator: scoreDrafts(heldout, legacyValidator), templates: scoreRecords(heldout) }, null, 2));
}
