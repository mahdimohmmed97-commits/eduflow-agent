import type { Locale } from "@/lib/types";

export const DUBAI_ZONE = "Asia/Dubai";
export const RIYADH_ZONE = "Asia/Riyadh";

export type GulfZone = typeof DUBAI_ZONE | typeof RIYADH_ZONE;

export function zoneOf(classes: Array<{ id: string; timeZone?: string }>, classId: string): GulfZone {
  return classes.find((item) => item.id === classId)?.timeZone === RIYADH_ZONE ? RIYADH_ZONE : DUBAI_ZONE;
}

export function toIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayIso(timeZone: string = DUBAI_ZONE, now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

export function addDays(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, (month || 1) - 1, day || 1);
  date.setDate(date.getDate() + days);
  return toIso(date);
}

export function daysFromToday(iso: string, timeZone: string = DUBAI_ZONE, now?: Date): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return 0;
  const today = todayIso(timeZone, now);
  const [ty, tm, td] = today.split("-").map(Number);
  const [year, month, day] = iso.split("-").map(Number);
  return Math.round((Date.UTC(year, month - 1, day) - Date.UTC(ty, tm - 1, td)) / 86_400_000);
}

export function isPastDue(iso: string, timeZone: string = DUBAI_ZONE, now?: Date): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) && iso < todayIso(timeZone, now);
}

export function formatDate(iso: string, locale: Locale, timeZone: string = DUBAI_ZONE): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "—";
  const [year, month, day] = iso.split("-").map(Number);
  const noon = new Date(Date.UTC(year, month - 1, day, 12));
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-AE-u-nu-latn" : "en-GB", {
    timeZone,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(noon);
}

export function formatStamp(iso: string, locale: Locale): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-AE-u-nu-latn" : "en-GB", {
    timeZone: DUBAI_ZONE,
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function duePhrase(iso: string, locale: Locale, timeZone: string = DUBAI_ZONE): string {
  const days = daysFromToday(iso, timeZone);
  if (locale === "en") {
    if (days === 0) return "Due today";
    if (days === 1) return "Due tomorrow";
    if (days > 1) return `Due in ${days} days`;
    if (days === -1) return "Due yesterday";
    return `${Math.abs(days)} days overdue`;
  }
  if (days === 0) return "مستحق اليوم";
  if (days === 1) return "مستحق غداً";
  if (days === 2) return "مستحق بعد يومين";
  if (days > 2 && days <= 10) return `مستحق بعد ${days} أيام`;
  if (days > 10) return `مستحق بعد ${days} يوماً`;
  if (days === -1) return "انتهى أمس";
  if (days === -2) return "انتهى قبل يومين";
  if (days < -2 && days >= -10) return `انتهى قبل ${Math.abs(days)} أيام`;
  return `انتهى قبل ${Math.abs(days)} يوماً`;
}
