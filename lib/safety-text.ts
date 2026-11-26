/**
 * Shared text normalization and risk patterns for EduFlow's layered validation.
 *
 * These patterns are ONE layer among several (record guard, strict JSON schema, fact masking,
 * identity/assignment/status checks, teacher review). Pattern lists can always be bypassed by new wording,
 * so passing them is never proof that a text is safe. Human approval stays mandatory.
 */

const INVISIBLE = /[\u00AD\u034F\u061C\u115F\u1160\u17B4\u17B5\u180B-\u180F\u200B-\u200F\u202A-\u202E\u2060-\u206F\u3164\uFE00-\uFE0F\uFEFF\uFFA0]/g;
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const TASHKEEL = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g;

/** Removes invisible, bidi-override and control characters. Keeps visible text unchanged otherwise. */
export function stripInvisible(text: string): string {
  return text.normalize("NFKC").replace(INVISIBLE, "").replace(CONTROL, " ");
}

/** Converts Arabic-Indic and Extended Arabic-Indic digits to ASCII digits. */
export function asciiDigits(text: string): string {
  return text.replace(/[\u0660-\u0669]/g, (char) => String(char.charCodeAt(0) - 0x0660)).replace(/[\u06F0-\u06F9]/g, (char) => String(char.charCodeAt(0) - 0x06f0));
}

/**
 * Canonical form used ONLY for comparison: NFKC, no invisible characters, no Arabic diacritics or tatweel,
 * ASCII digits, folded Arabic letter variants (أ إ آ → ا, ى → ي, ة → ه), lower case, single spaces,
 * and unified quotes/dashes.
 */
export function fold(text: string): string {
  return asciiDigits(stripInvisible(text))
    .replace(TASHKEEL, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[\u2018\u2019\u201B\u2032]/g, "'")
    .replace(/[\u201C\u201D\u201E\u00AB\u00BB]/g, '"')
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/[\u066B]/g, ".")
    .replace(/[\u066A]/g, "%")
    .replace(/\u060C/g, ",")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Folds only Arabic letter variants in a regex source; leaves escapes such as \\S and \\p{L} untouched. */
export function foldPattern(source: string): string {
  return source.replace(TASHKEEL, "").replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/ً/g, "");
}

function re(source: string): RegExp {
  return new RegExp(foldPattern(source), "iu");
}

/** Letters before/after a match must not be other letters (Arabic clitic prefixes و ب ل ف ك and ال are allowed before). */
const B = String.raw`(?<![\p{L}\p{N}])`;
const AR_PREFIX = String.raw`(?<![\p{L}\p{N}])(?:[وبلفك]?(?:ال)?)`;
const E = String.raw`(?![\p{L}\p{N}])`;

const MONTHS = [
  "january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december",
  "يناير", "فبراير", "مارس", "أبريل", "ابريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
  "كانون", "شباط", "آذار", "نيسان", "أيار", "حزيران", "تموز", "آب", "أيلول", "تشرين",
  "محرم", "صفر", "ربيع", "جمادى", "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة",
];
const WEEKDAYS = [
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
  "الأحد", "الاثنين", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت",
];

export type RiskKind =
  | "unknown_number"
  | "number_word"
  | "date_or_deadline"
  | "grade_or_score"
  | "school_policy"
  | "promise"
  | "send_claim"
  | "link_or_contact"
  | "instruction_text"
  | "attendance_or_behaviour";

const NUMBER_WORDS = [
  "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
  "sixteen", "seventeen", "eighteen", "nineteen", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety",
  "hundred", "thousand", "twice", "thrice", "dozen", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth",
];
const AR_NUMBER_WORDS = [
  "اثنان", "اثنين", "اثنتين", "ثلاث", "ثلاثة", "أربع", "أربعة", "خمس", "خمسة", "ستة", "سبع", "سبعة", "ثمان", "ثماني", "ثمانية",
  "تسع", "تسعة", "عشر", "عشرة", "عشرون", "عشرين", "ثلاثون", "ثلاثين", "أربعون", "أربعين", "خمسون", "خمسين", "ستون", "ستين",
  "سبعون", "سبعين", "ثمانون", "ثمانين", "تسعون", "تسعين", "مئة", "مائة", "مئات", "ألف", "مرتين", "ضعف",
];

const PATTERNS: Array<{ kind: RiskKind; regex: RegExp }> = [
  { kind: "number_word", regex: re(`${B}(?:${NUMBER_WORDS.join("|")})${E}`) },
  { kind: "number_word", regex: re(`${AR_PREFIX}(?:${AR_NUMBER_WORDS.join("|")})${E}`) },
  { kind: "date_or_deadline", regex: re(`${B}(?:${MONTHS.filter((m) => /[a-z]/.test(m)).join("|")})${E}`) },
  { kind: "date_or_deadline", regex: re(`${AR_PREFIX}(?:${MONTHS.filter((m) => !/[a-z]/.test(m)).join("|")})${E}`) },
  { kind: "date_or_deadline", regex: re(`${B}(?:${WEEKDAYS.filter((d) => /[a-z]/.test(d)).join("|")})${E}`) },
  { kind: "date_or_deadline", regex: re(`${AR_PREFIX}(?:${WEEKDAYS.filter((d) => !/[a-z]/.test(d)).map((d) => d.replace(/^ال/, "")).join("|")})${E}`) },
  {
    kind: "date_or_deadline",
    regex: re(
      `${B}(?:tomorrow|tonight|yesterday|next (?:week|month|term|semester|lesson day)|end of (?:the )?(?:day|week|month|term)|within (?:a|an|the next) (?:day|week|hour)s?|extended|extension|postponed)${E}`,
    ),
  },
  { kind: "date_or_deadline", regex: re(`${AR_PREFIX}(?:غدا|غدًا|بعد غد|أمس|الأسبوع القادم|الأسبوع المقبل|الشهر القادم|الشهر المقبل|نهاية الأسبوع|نهاية الشهر|تمديد|مددنا|تأجيل|أجلنا)${E}`) },
  { kind: "date_or_deadline", regex: re(`(?:يوم|موعد)\\s+(?:\\S+\\s+)?(?:القادم|المقبل)`) },
  {
    kind: "grade_or_score",
    regex: re(
      `%|${B}(?:percent|percentage|per cent|average|averages|gpa|scored|scores?|scoring|graded|marks|failing|failed|fails|passing|points|credit|zero|letter grade|report card)${E}|${B}(?:his|her|their|your|the|a|full|final|total|current)\\s+(?:mark|grade|score|result)s?${E}|${B}(?:received|got|earned|achieved|gets)\\s+(?:an?\\s+)?[a-f][+-]?(?![\\p{L}\\p{N}])|${B}out of${E}`,
    ),
  },
  { kind: "grade_or_score", regex: re(`${AR_PREFIX}(?:بالمئة|في المئة|بالمائة|في المائة|نسبة|معدل|متوسط|درجة|درجات|درجتها|درجته|علامة|علامات|علامتها|علامته|راسب|راسبة|رسوب|ناجح|ناجحة|كشف الدرجات)${E}|تقدير\\s+(?:ممتاز|جيد|مقبول|ضعيف|راسب)|على تقدير`) },
  {
    kind: "school_policy",
    regex: re(
      `${B}(?:policy|policies|rules?|regulations?|penalt(?:y|ies)|penali[sz]ed?|deduct(?:ed|ion|ions)?|lose[sd]?|losing|fees?|fine[sd]?|detention|suspen(?:d|ded|sion)|expel(?:led)?|disciplinary)${E}`,
    ),
  },
  { kind: "school_policy", regex: re(`${AR_PREFIX}(?:سياسة|لائحة|اللوائح|خصم|يخصم|تخصم|سيخصم|غرامة|رسوم|عقوبة|عقوبات|حرمان|فصل الطالب|إنذار)${E}|نظام (?:المدرسة|المركز)|حسب (?:النظام|اللائحة|التعليمات)`) },
  {
    kind: "promise",
    regex: re(
      `${B}(?:guarantee[sd]?|guaranteeing|promise[sd]?|rest assured|assure[sd]?|we assure|no penalty|won't be affected|will not be affected|not be affected|won't lose|will not lose|keeps? (?:all|full|the full)|full (?:marks?|credit|grade|score|points))${E}`,
    ),
  },
  { kind: "promise", regex: re(`${AR_PREFIX}(?:نضمن|تضمن|يضمن|مضمون|مضمونة|نتعهد|نعدكم|أعدكم)${E}|لن (?:تتأثر|يتأثر|تخسر|يخسر|يؤثر|تؤثر)|لا (?:يؤثر|تؤثر)|الدرجة الكاملة|العلامة الكاملة|كامل الدرجة|كامل العلامة|الدرجة كاملة|العلامة كاملة`) },
  {
    kind: "send_claim",
    regex: re(
      `${B}(?:automatic(?:ally)?|auto-?sent)${E}|${B}(?:has|have|had|was|were|been|already|is being)\\s+(?:been\\s+)?(?:already\\s+)?(?:sent|delivered|forwarded|messaged|texted|emailed|notified|contacted)${E}|${B}(?:i|we)\\s+(?:have\\s+|had\\s+)?(?:already\\s+)?(?:sent|messaged|texted|emailed|called|contacted|notified|informed)${E}`,
    ),
  },
  { kind: "send_claim", regex: re(`تم (?:ال)?إرسال|تم إرسال|أُرسلت|أرسلت (?:إليكم|لكم|تلقائي)|تلقائي|تلقائيا|تلقائيًا|تم (?:إبلاغ|التواصل|تبليغ)|راسلت|راسلنا|أبلغنا|أبلغت|تواصلنا مع|اتصلنا`) },
  {
    kind: "link_or_contact",
    regex: re(`https?:|www\\.|@|${B}[\\p{L}\\p{N}-]+(?:\\.[\\p{L}\\p{N}-]+)*\\.(?:com|net|org|io|ly|me|ae|sa|edu|gov|info|biz|co|app|link|xyz|site|online|example|invalid|test)(?![\\p{L}\\p{N}])(?:/\\S*)?|${B}(?:bit\\.ly|wa\\.me|t\\.me)`),
  },
  {
    kind: "instruction_text",
    regex: re(
      `${B}(?:ignore|disregard)\\s+(?:all\\s+|any\\s+|the\\s+|your\\s+|previous\\s+|prior\\s+)*(?:instructions?|rules?)|${B}(?:system|assistant|developer)\\s*:|${B}note to (?:the )?(?:ai|assistant|model)|${B}as an ai${E}|${B}language model${E}|${B}(?:prompt|jailbreak)${E}|${B}tell (?:the )?(?:parents?|students?)${E}|${B}(?:say|write|state|mention) that${E}|${B}reply in${E}|${B}respond in${E}|${B}append${E}`,
    ),
  },
  { kind: "instruction_text", regex: re(`تجاهل (?:التعليمات|القواعد|ما سبق|كل ما|الأوامر)|${B}[وف]?(?:لل|[بلك]?ال|[بلك])?(?:نموذج|تعليمات|أوامر)${E}|اكتب أن|اكتب ان|قل إن|قل ان|قولي|اذكر أن|اذكر ان|أخبر (?:ولي|الأهل|الطالب)|الذكاء الاصطناعي`) },
  {
    kind: "attendance_or_behaviour",
    regex: re(`${B}(?:absent|absence|absences|attendance|truant|truancy|behaviou?r|disruptive|misbehav(?:ed|ing|iour|ior)|rude|lazy|careless|suspended)${E}`),
  },
  { kind: "attendance_or_behaviour", regex: re(`${AR_PREFIX}(?:تغيب|تغيبت|تغيّب|غياب|غاب|غابت|الحضور|سلوك|سلوكه|سلوكها|مشاغب|مشاغبة|كسول|كسولة|مهمل|مهملة|إهمال)${E}`) },
];

const CONDITIONAL = new RegExp(foldPattern(`(?:${B}if${E}|${B}in case${E}|${AR_PREFIX}(?:إذا|اذا|لو|إن كان|ان كان|في حال))`), "iu");

/** Returns the risk kinds found in `folded` (already passed through fold()). */
export function riskKinds(folded: string): RiskKind[] {
  const found = new Set<RiskKind>();
  if (/\d/.test(folded)) found.add("unknown_number");
  for (const { kind, regex } of PATTERNS) {
    if (kind === "send_claim") {
      // "If he has already sent it" is not a delivery claim. Check each sentence on its own.
      for (const sentence of folded.split(/[.!?؟\n]+/)) {
        if (regex.test(sentence) && !(CONDITIONAL.test(sentence) && !/تلقائي|automatic/.test(sentence))) found.add(kind);
      }
      continue;
    }
    if (regex.test(folded)) found.add(kind);
  }
  return [...found];
}

/** Risk kinds checked inside RECORD fields (names, titles, labels). Digits and dates are allowed there. */
export function fieldRiskKinds(folded: string): RiskKind[] {
  return riskKinds(folded).filter((kind) => kind !== "unknown_number" && kind !== "number_word" && kind !== "date_or_deadline");
}

function escape(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Replaces every occurrence of an allowed record fact with a neutral marker, so the remaining text is only the
 * writer's own words. Longest facts first. Matches must not be inside a longer word.
 */
export function maskFacts(folded: string, facts: string[]): string {
  const parts = [...new Set(facts.map(fold).filter((part) => part.length >= 2))].sort((a, b) => b.length - a.length);
  let out = folded;
  for (const part of parts) {
    out = out.replace(new RegExp(`(?<![\\p{L}\\p{N}])${escape(part)}(?![\\p{L}\\p{N}])`, "gu"), " \u2063 ");
  }
  return out.replace(/\s+/g, " ").trim();
}

export function containsFact(folded: string, fact: string): boolean {
  const part = fold(fact);
  if (part.length < 2) return false;
  return new RegExp(`(?<![\\p{L}\\p{N}])${escape(part)}(?![\\p{L}\\p{N}])`, "u").test(folded);
}

const HONORIFICS = new Set(
  [
    "mr", "mrs", "ms", "miss", "dr", "prof", "teacher", "student", "parent", "al", "el", "bin", "bint", "ibn", "abu", "umm",
    "ا", "أ", "السيد", "السيدة", "الأستاذ", "الأستاذة", "أستاذ", "أستاذة", "ولي", "ولية", "الطالب", "الطالبة", "بن", "بنت", "أبو", "أم", "ال",
  ].map(fold),
);

export function nameTokens(name: string): string[] {
  return fold(name)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => token.length >= 3 && !HONORIFICS.has(token));
}

/** Tokens of other people's names that do not also belong to this record's facts. */
export function foreignNameTokens(otherNames: string[], facts: string[]): Set<string> {
  const own = new Set(facts.flatMap(nameTokens));
  return new Set(otherNames.flatMap(nameTokens).filter((token) => !own.has(token)));
}

export function mentionsForeignName(folded: string, foreign: Set<string>): boolean {
  if (foreign.size === 0) return false;
  for (const raw of folded.split(/[^\p{L}\p{N}]+/u)) {
    if (!raw) continue;
    const candidates = [raw, raw.replace(/^[وبلفك]/, ""), raw.replace(/^[وبلفك]?ال/, ""), raw.replace(/^ال/, "")];
    if (candidates.some((token) => foreign.has(token))) return true;
  }
  return false;
}
