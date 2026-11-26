import { containsFact, fold, foldPattern, foreignNameTokens, maskFacts, mentionsForeignName, riskKinds, type RiskKind } from "@/lib/safety-text";

/**
 * Layered deterministic validation for any reminder text: model output, local template, or teacher edit.
 *
 * Layers:
 * 1. Normalization (Unicode NFKC, invisible/bidi characters, Arabic-Indic digits, Arabic letter variants).
 * 2. Fact masking: every record fact (names, title, subject, class, school, due date, teacher) is removed, so what
 *    remains is only the writer's own words.
 * 3. On those words: no digits at all, no number words, no dates or deadlines, no grades/scores, no school
 *    policy, no promises, no "already sent" claims, no links or contacts, no instruction text, no attendance or
 *    behaviour claims, no other person's name.
 * 4. On the full text: the right student is named, the assignment title is present, and the wording does not
 *    contradict the record status.
 *
 * Passing is not proof of safety. It means the text contains no fact that this check cannot trace to the record.
 */
export type DraftFacts = {
  studentName: string;
  givenName: string;
  parentName: string;
  teacherName: string;
  schoolLine: string;
  className: string;
  subject: string;
  assignmentTitle: string;
  dueDateLabel: string;
  status: "late" | "not_submitted";
  otherNames: string[];
};

export type DraftRejection =
  | "empty"
  | "too_long"
  | "missing_student"
  | "missing_assignment"
  | "status_contradiction"
  | "other_student"
  | "wrong_language"
  | "missing_parent"
  | RiskKind;

export type DraftCheck = { ok: true } | { ok: false; reasons: DraftRejection[] };

const MAX_LENGTH = 2500;

const SAYS_RECEIVED = new RegExp(
  foldPattern(String.raw`(?<![\p{L}])(?:i|we)\s+(?:have\s+)?received|thank(?:s| you) for (?:sending|submitting|handing)|(?:it|work)\s+(?:was|has been)\s+(?:received|submitted)|arrived|was on time|تم استلام|وصلني|وصلنا|استلمت|استلمنا|سلمت الواجب|سلم الواجب|شكرا لك على إرساله|شكرا على إرساله`),
  "iu",
);
const SAYS_MISSING = new RegExp(
  foldPattern(String.raw`has not (?:submitted|sent|handed)|have not (?:received|got)|not (?:yet )?(?:received|submitted)|still (?:missing|needs to submit|need to submit)|is missing|لم (?:ي|ت)?(?:سلم|يسلم|تسلم|يصل|تصل|يصلنا|يصلني)|لم يصلنا|لم يصلني|لم تسلم|لم يسلم`),
  "iu",
);

export function factsList(facts: DraftFacts): string[] {
  return [
    facts.studentName,
    facts.givenName,
    facts.parentName,
    facts.teacherName,
    facts.schoolLine,
    facts.className,
    facts.subject,
    facts.assignmentTitle,
    facts.dueDateLabel,
  ];
}

/** Generic layer used for teacher edits: masks the allowed facts and checks the remaining words. */
export function checkAgainstFacts(text: string, allowedParts: string[], otherNames: string[]): DraftRejection[] {
  const reasons = new Set<DraftRejection>();
  if (!text.trim()) return ["empty"];
  if (text.length > MAX_LENGTH) reasons.add("too_long");
  const folded = fold(text);
  const remainder = maskFacts(folded, allowedParts);
  for (const kind of riskKinds(remainder)) reasons.add(kind);
  if (mentionsForeignName(remainder, foreignNameTokens(otherNames, allowedParts))) reasons.add("other_student");
  return [...reasons];
}

function languageOk(text: string, locale: "ar" | "en"): boolean {
  const arabic = (text.match(/[\u0600-\u06FF]/g) ?? []).length;
  const latin = (text.match(/[A-Za-z]/g) ?? []).length;
  if (arabic + latin === 0) return false;
  return locale === "ar" ? arabic / (arabic + latin) >= 0.6 : latin / (arabic + latin) >= 0.85;
}

/** Full check for a reminder message about one student and one assignment. */
export function validateReminderText(text: string, facts: DraftFacts, options: { locale?: "ar" | "en" } = {}): DraftCheck {
  const reasons = new Set<DraftRejection>(checkAgainstFacts(text, factsList(facts), facts.otherNames));
  if (reasons.has("empty")) return { ok: false, reasons: ["empty"] };
  const folded = fold(text);
  if (!containsFact(folded, facts.studentName) && !containsFact(folded, facts.givenName)) reasons.add("missing_student");
  if (!containsFact(folded, facts.assignmentTitle)) reasons.add("missing_assignment");
  // Negated phrases ("ما وصلني", "لم يصلنا", "not received") are removed before looking for a "received" claim.
  const affirmative = folded.replace(/(?<![\p{L}])(?:[وف]?(?:ما|لم|لما|لن|لا|ليس)|not|never|yet to)\s+\S+/gu, " ").replace(/n't\s+\S+/gu, " ");
  if (facts.status === "not_submitted" && SAYS_RECEIVED.test(affirmative)) reasons.add("status_contradiction");
  if (facts.status === "late" && SAYS_MISSING.test(folded)) reasons.add("status_contradiction");
  if (options.locale && !languageOk(text, options.locale)) reasons.add("wrong_language");
  return reasons.size ? { ok: false, reasons: [...reasons] } : { ok: true };
}
