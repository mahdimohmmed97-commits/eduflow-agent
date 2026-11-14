import type { Locale } from "@/lib/types";

export function toIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayIso(): string {
  return toIso(new Date());
}

export function addDays(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, (month || 1) - 1, day || 1);
  date.setDate(date.getDate() + days);
  return toIso(date);
}

export function daysFromToday(iso: string): number {
  const [year, month, day] = iso.split("-").map(Number);
  const due = new Date(year, (month || 1) - 1, day || 1);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}

export function isPastDue(iso: string): boolean {
  return Boolean(iso) && iso < todayIso();
}

export function formatDate(iso: string, locale: Locale): string {
  if (!iso) return "—";
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, (month || 1) - 1, day || 1);
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-AE-u-nu-latn" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function duePhrase(iso: string, locale: Locale): string {
  const days = daysFromToday(iso);
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
