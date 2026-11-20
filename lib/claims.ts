const UNSAFE_CLAIM =
  /full\s+marks?|guaranteed\s+grades?|guarantee[sd]?\s+(?:a\s+|the\s+|your\s+)?grades?|keeps?\s+the\s+(?:full\s+)?marks?|protect(?:s|ed)?\s+the\s+marks?|\byour\s+marks?\b|\bthe\s+marks?\b|marks?\s+will|grades?\s+will|school\s+policy|according\s+to\s+(?:the\s+|our\s+)?(?:school\s+)?policy|automatic\s+zero|zero\s+for|الدرجة\s+كاملة|درجة\s+كاملة|يحفظ\s+لك\s+الدرجة|تحفظ\s+الدرجة|تقييمه|تقييمها|تقييمك|تقييمكم|سياسة\s+(?:المدرسة|المركز)|حسب\s+اللائحة|اللائحة\s+المدرسية|خصم\s+الدرجات|صفر\s+في\s+الواجب|درجة\s+مضمونة|نضمن/iu;

const PHONE_SOURCE = String.raw`(?:\+\d[\d\s()-]{6,}\d|\b\d{8,}\b)`;
const PERCENT_SOURCE = String.raw`(\d+(?:\.\d+)?)(?=\s*%)`;
const FRACTION_SOURCE = String.raw`\b(\d{1,3})\s*\/\s*(\d{1,3})\b`;
const LETTER_GRADE_SOURCE = String.raw`\b[A-F][+-]\b`;

export function hasUnsafeClaim(text: string): boolean {
  return new RegExp(UNSAFE_CLAIM.source, "iu").test(text);
}

export function reminderTextIsGrounded(text: string, allowedParts: string[], otherNames: string[], requiredNames: string[]): boolean {
  if (!text.trim()) return false;
  if (!includesRequiredName(text, requiredNames)) return false;
  if (mentionsAny(text, otherNames)) return false;
  return sharedFactsAreGrounded(text, allowedParts);
}

export function summaryTextIsGrounded(text: string, allowedParts: string[]): boolean {
  if (!text.trim()) return false;
  return sharedFactsAreGrounded(text, allowedParts);
}

export type EditBlockReason = "empty" | "unsupported_claim" | "unknown_fact" | "other_student";

export function reviewTeacherEdit(
  text: string,
  allowedParts: string[],
  otherNames: string[],
): { ok: true } | { ok: false; reason: EditBlockReason } {
  if (!text.trim()) return { ok: false, reason: "empty" };
  if (hasUnsafeClaim(text)) return { ok: false, reason: "unsupported_claim" };
  if (mentionsAny(text, otherNames)) return { ok: false, reason: "other_student" };
  if (!sharedFactsAreGrounded(text, allowedParts)) return { ok: false, reason: "unknown_fact" };
  return { ok: true };
}

function sharedFactsAreGrounded(text: string, allowedParts: string[]): boolean {
  if (hasUnsafeClaim(text)) return false;
  const allowed = allowedParts.join("\n");
  if (hasUnknownPhone(text, allowed)) return false;
  if (hasUnknownToken(text, PERCENT_SOURCE, allowedParts, (match) => String(Number(match[1])))) return false;
  if (hasUnknownToken(text, FRACTION_SOURCE, allowedParts, (match) => `${match[1]}/${match[2]}`)) return false;
  if (hasUnknownToken(text, LETTER_GRADE_SOURCE, allowedParts, (match) => match[0].toUpperCase())) return false;
  return true;
}

function includesRequiredName(text: string, requiredNames: string[]): boolean {
  const lowered = text.toLowerCase();
  return requiredNames.some((name) => {
    const clean = name.trim();
    return clean.length >= 2 && lowered.includes(clean.toLowerCase());
  });
}

function mentionsAny(text: string, names: string[]): boolean {
  const lowered = text.toLowerCase();
  return names.some((name) => {
    const clean = name.trim();
    return clean.length >= 3 && lowered.includes(clean.toLowerCase());
  });
}

function hasUnknownPhone(text: string, allowed: string): boolean {
  for (const match of text.matchAll(new RegExp(PHONE_SOURCE, "g"))) {
    if (!allowed.includes(match[0])) return true;
  }
  return false;
}

function hasUnknownToken(
  text: string,
  source: string,
  allowedParts: string[],
  tokenOf: (match: RegExpMatchArray) => string,
): boolean {
  const allowed = new Set<string>();
  for (const part of allowedParts) {
    for (const match of part.matchAll(new RegExp(source, "g"))) allowed.add(tokenOf(match));
  }
  for (const match of text.matchAll(new RegExp(source, "g"))) {
    if (!allowed.has(tokenOf(match))) return true;
  }
  return false;
}
