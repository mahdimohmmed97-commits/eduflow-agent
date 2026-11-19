"use client";

import { formatMeasuredDuration } from "@/lib/draft-flow";
import { useEduFlow } from "@/lib/store";
import { studentsNotSubmittedCount } from "@/lib/stats";

export function ValuePanel() {
  const { data, locale, t } = useEduFlow();
  if (!data) return null;
  const measured = data.measuredPrepareMs ?? 0;
  const figures = [
    [t("measuredMissing"), studentsNotSubmittedCount(data)],
    [t("measuredPrepared"), data.drafts?.length ?? 0],
    [t("measuredApproved"), data.approvals.length],
    [t("measuredTime"), formatMeasuredDuration(measured, locale)],
  ] as const;
  return (
    <section className="rounded-3xl border border-line bg-paper p-4 shadow-sm sm:p-5" aria-label={t("measuredPanelTitle")}>
      <h2 className="text-lg font-semibold">{t("measuredPanelTitle")}</h2>
      <p className="mt-1 max-w-3xl text-sm leading-6 text-muted">{t("measuredHint")}</p>
      <dl className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {figures.map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-sand px-3 py-3">
            <dt className="text-sm leading-5 text-muted">{label}</dt>
            <dd className="mt-1 text-2xl font-semibold tracking-tight">{value}</dd>
          </div>
        ))}
      </dl>
      {measured === 0 ? <p className="mt-3 text-sm text-muted">{t("measuredZero")}</p> : null}
    </section>
  );
}
