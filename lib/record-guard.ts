import { asciiDigits, fieldRiskKinds, fold, nameTokens, stripInvisible, type RiskKind } from "@/lib/safety-text";

/**
 * Record fields (names, titles, labels) are untrusted data. Before any template or model sees them, each field is
 * cleaned of invisible/bidi characters and checked. A field that looks like an instruction, a link, a grade, a promise,
 * a policy, a delivery claim, or a placeholder is NOT used: the request stops and the teacher sees why.
 */
export type RecordIssueReason =
  | "invalid_characters"
  | "placeholder_value"
  | "name_mismatch"
  | "invalid_due_date"
  | "too_long"
  | RiskKind;

export type RecordIssue = { field: string; studentId?: string; reason: RecordIssueReason };

const PLACEHOLDER = new RegExp(
  `^(?:${["not recorded", "not applicable", "n/a", "na", "unknown", "none", "null", "undefined", "tbd", "-", "—", "غير مسجل", "غير مسجلة", "غير محدد", "غير محددة", "لا يوجد", "غير متوفر", "غير معروف"].map((item) => fold(item).replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")).join("|")})(?:\\s*\\(.*\\))?$`,
  "iu",
);

const NAME_SHAPE = /^[\p{L}\p{M}][\p{L}\p{M} .'’-]*$/u;
const LABEL_SHAPE = /^[\p{L}\p{M}\p{N} .,'’()\-—–:&/]+$/u;
const TITLE_SHAPE = /^[\p{L}\p{M}\p{N} .,'’()\-—–:&/«»“”"!?؟،]+$/u;

const EN_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const AR_MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const DUE_DATE = new RegExp(`^\\d{1,2} (?:${[...EN_MONTHS, ...AR_MONTHS].join("|")}) \\d{4}$`, "u");

export function cleanField(value: string): string {
  return stripInvisible(value).replace(/\s+/g, " ").trim();
}

function shapeIssue(value: string, shape: RegExp, max: number): RecordIssueReason | null {
  if (value.length > max) return "too_long";
  if (!shape.test(value)) return "invalid_characters";
  return null;
}

function riskIssue(value: string): RecordIssueReason | null {
  const kinds = fieldRiskKinds(fold(value));
  return kinds[0] ?? null;
}

/** True when a name field holds a placeholder such as "Not recorded" / "غير مسجل" instead of a real name. */
export function isPlaceholder(value: string): boolean {
  return PLACEHOLDER.test(fold(cleanField(value)));
}

export function checkNameField(value: string): RecordIssueReason | null {
  const folded = fold(value);
  if (PLACEHOLDER.test(folded)) return "placeholder_value";
  return shapeIssue(value, NAME_SHAPE, 60) ?? riskIssue(value);
}

export function checkLabelField(value: string, kind: "label" | "title"): RecordIssueReason | null {
  const folded = fold(value);
  if (PLACEHOLDER.test(folded)) return "placeholder_value";
  return shapeIssue(value, kind === "title" ? TITLE_SHAPE : LABEL_SHAPE, kind === "title" ? 120 : 140) ?? riskIssue(value);
}

export function checkDueDate(value: string): RecordIssueReason | null {
  return DUE_DATE.test(asciiDigits(value)) ? null : "invalid_due_date";
}

export function givenNameMatches(name: string, givenName: string): boolean {
  const given = nameTokens(givenName);
  const full = new Set(nameTokens(name));
  return given.length > 0 ? given.every((token) => full.has(token)) : fold(name).includes(fold(givenName));
}
