export type AskKind = "empty" | "followup" | "out_of_scope";

const FOLLOW_UP = /واجب|تسليم|تأخر|متأخ|ولي|طالب|صف|remind|homework|parent|student|assign|submit|late/i;

export function interpretAsk(text: string): AskKind {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length < 2) return "empty";
  if (FOLLOW_UP.test(clean)) return "followup";
  return "out_of_scope";
}

export function canDraftParent(name: string): boolean {
  return name.trim().length > 1;
}
