"use client";

import { followUpTrace } from "@/lib/decide";
import { useEduFlow } from "@/lib/store";
import { tx } from "@/lib/text";

export function Reasoning() {
  const { data, locale } = useEduFlow();
  if (!data) return null;
  const steps = followUpTrace(data);

  return (
    <section className="rounded-3xl border border-line bg-paper p-4 shadow-sm sm:p-5" aria-label={locale === "ar" ? "قرار الوكيل" : "Agent decision"}>
      <p className="text-sm font-semibold text-gold-2">{locale === "ar" ? "قرار الوكيل لهذه المهمة" : "The agent’s decision for this task"}</p>
      <ol className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.id} className="rounded-2xl bg-sand px-3 py-3">
            <p className="text-xs font-semibold text-teal">
              {index + 1}. {tx(locale, step.titleAr, step.titleEn)}
            </p>
            <p className="mt-1 text-sm leading-6">{tx(locale, step.bodyAr, step.bodyEn)}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
