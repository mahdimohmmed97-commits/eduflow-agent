import type { Locale } from "@/lib/types";

export function tx(locale: Locale, arabic: string, english: string): string {
  const primary = locale === "ar" ? arabic : english;
  const fallback = locale === "ar" ? english : arabic;
  return primary.trim() || fallback.trim();
}

export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ""));
}

export function givenName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || fullName;
}

export function pair(arabic: string, english: string): [string, string] {
  const ar = arabic.trim();
  const en = english.trim();
  return [ar || en, en || ar];
}

export function countLabel(count: number, locale: Locale, noun: "student" | "assignment"): string {
  if (locale === "en") {
    const word = noun === "student" ? "student" : "assignment";
    return `${count} ${word}${count === 1 ? "" : "s"}`;
  }
  if (noun === "student") {
    if (count === 0) return "لا طلاب";
    if (count === 1) return "طالب واحد";
    if (count === 2) return "طالبان";
    if (count <= 10) return `${count} طلاب`;
    return `${count} طالباً`;
  }
  if (count === 0) return "لا واجبات";
  if (count === 1) return "واجب واحد";
  if (count === 2) return "واجبان";
  if (count <= 10) return `${count} واجبات`;
  return `${count} واجباً`;
}

export function followUpSentence(count: number, locale: Locale): string {
  if (locale === "en") {
    if (count === 0) return "Overdue work is clear. No student needs follow-up this week.";
    if (count === 1) return "1 student needs follow-up this week.";
    return `${count} students need follow-up this week.`;
  }
  if (count === 0) return "لا توجد متابعات عاجلة على الواجبات التي انتهى موعدها.";
  if (count === 1) return "طالب واحد يحتاج متابعة هذا الأسبوع.";
  if (count === 2) return "طالبان يحتاجان متابعة هذا الأسبوع.";
  if (count <= 10) return `${count} طلاب يحتاجون متابعة هذا الأسبوع.`;
  return `${count} طالباً يحتاجون متابعة هذا الأسبوع.`;
}

export function greeting(locale: Locale): string {
  const hour = new Date().getHours();
  if (locale === "en") {
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }
  if (hour < 12) return "صباح الخير";
  return "مساء الخير";
}
