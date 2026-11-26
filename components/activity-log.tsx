"use client";

import { LimitsPanel } from "@/components/limits-panel";
import { formatStamp } from "@/lib/dates";
import { useEduFlow } from "@/lib/store";
import { tx } from "@/lib/text";
import type { ActivityKind } from "@/lib/types";

const kindLabel: Record<ActivityKind, { ar: string; en: string }> = {
  plan: { ar: "قرار", en: "Decision" },
  approved: { ar: "اعتماد", en: "Approved" },
  copied: { ar: "نسخ", en: "Copied" },
  status: { ar: "سجل", en: "Record" },
  summary: { ar: "ملخص", en: "Summary" },
  test: { ar: "فحص", en: "Test" },
  refused: { ar: "توقّف", en: "Stopped" },
};

export function ActivityLog() {
  const { data, locale, t } = useEduFlow();
  if (!data) return null;
  const entries = [...data.activity].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <section className="rounded-3xl border border-line bg-paper p-5 shadow-sm" aria-label={t("activityTitle")}>
      <h2 className="text-lg font-semibold">{t("activityTitle")}</h2>
      <p className="mt-1 text-sm text-muted">{t("activityLead")}</p>
      {entries.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-sand px-3 py-3 text-sm text-muted">{t("activityEmpty")}</p>
      ) : (
        <ol className="mt-4 space-y-3">
          {entries.map((entry) => (
            <li key={entry.id} className="rounded-2xl border border-line bg-white px-4 py-3">
              <p className="text-xs font-semibold text-gold-2">
                {formatStamp(entry.at, locale)} · {tx(locale, kindLabel[entry.kind].ar, kindLabel[entry.kind].en)}
              </p>
              <p className="mt-1 text-sm leading-6">{tx(locale, entry.textAr, entry.textEn)}</p>
            </li>
          ))}
        </ol>
      )}
      <div className="mt-5">
        <LimitsPanel />
      </div>
    </section>
  );
}
