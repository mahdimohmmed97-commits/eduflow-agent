import { readFileSync } from "node:fs";
import { draftFacts, type ReminderRequest } from "@/lib/agent";
import { validateReminderText } from "@/lib/draft-validator";

/**
 * Post-fix generalization probes (eval/heldout/postfix-probes.json), written AFTER Phase 9 and never used for tuning.
 * MEASURED RESULT about the deterministic validator only. No model is involved.
 */
const request: ReminderRequest = {
  kind: "reminders",
  locale: "en",
  tone: "formal",
  teacherName: "Ms. Sara Al Nuaimi",
  schoolLine: "Al Noor International School — Dubai",
  className: "Grade 8 — A",
  subject: "Mathematics",
  assignmentTitle: "Fractions",
  dueDateLabel: "12 November 2026",
  students: [
    { id: "s1", name: "Layla Al Mansoori", givenName: "Layla", gender: "female", parentName: "Fatima Al Mansoori", status: "not_submitted" },
    { id: "s2", name: "Omar Haddad", givenName: "Omar", gender: "male", parentName: "Khalid Haddad", status: "late" },
  ],
};

export function runPostfix(path = "eval/heldout/postfix-probes.json") {
  const set = JSON.parse(readFileSync(path, "utf8")) as { base: string; dangerous: string[]; benign: string[] };
  const facts = draftFacts(request, request.students[0]);
  const accepted = (extra: string) => validateReminderText(`${set.base} ${extra}`, facts).ok;
  return {
    dangerousTotal: set.dangerous.length,
    dangerousCaught: set.dangerous.filter((text) => !accepted(text)).length,
    dangerousMissed: set.dangerous.filter(accepted),
    benignTotal: set.benign.length,
    benignWronglyRejected: set.benign.filter((text) => !accepted(text)),
  };
}

if (process.argv[1]?.endsWith("postfix.ts")) console.log(JSON.stringify(runPostfix(), null, 2));
