"use client";

import Link from "next/link";
import { ContentSkeleton } from "@/components/skeletons";
import { buttonClass } from "@/components/ui";
import { useEduFlow } from "@/lib/store";
import { MINUTES_PER_DRAFT, trendSeries } from "@/lib/stats";
import { fill } from "@/lib/text";
import { dailyActions } from "@/lib/risk";

export function Landing() {
  const { data, t } = useEduFlow();
  const minutes = data ? dailyActions(data).length * MINUTES_PER_DRAFT : 48;
  const series = data ? trendSeries(data) : [];
  const from = series[0]?.onTimeRate ?? 38;
  const to = series[series.length - 1]?.onTimeRate ?? 57;
  const minuteLabel = data ? fill(t("timeSavedValue"), { minutes }) : t("statMinutes");
  const trendLabel = data ? fill(t("pointsUp"), { from, to }) : t("statTrend");

  return (
    <div className="mx-auto max-w-6xl px-5 pb-16 pt-4 sm:px-8">
      <section className="hero-panel overflow-hidden rounded-[32px] px-6 py-10 text-white sm:px-10 sm:py-14">
        <p className="text-sm font-semibold text-[#f6e4bc]">{t("landingKicker")}</p>
        <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">{t("landingTitle")}</h1>
        <p className="mt-5 max-w-2xl text-base leading-8 text-white/85 sm:text-lg">{t("landingLead")}</p>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#f6e4bc]">{t("simBanner")}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/agent" className="inline-flex min-h-11 items-center rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-navy">
            {t("startTask")}
          </Link>
          <Link href="/dashboard" className="inline-flex min-h-11 items-center rounded-xl bg-white/10 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/30">
            {t("seeImpact")}
          </Link>
        </div>
      </section>

      {!data ? <div className="mt-8"><ContentSkeleton /></div> : null}

      <section className="mt-6 grid gap-4 md:grid-cols-3" aria-label={t("impactTitle")}>
        <article className="rounded-3xl border border-line bg-paper p-5">
          <p className="text-3xl font-semibold tabular-nums text-teal">{minuteLabel}</p>
          <p className="mt-2 text-sm leading-6 text-muted">{t("statMinutesHint")}</p>
        </article>
        <article className="rounded-3xl border border-line bg-paper p-5">
          <p className="text-3xl font-semibold tabular-nums text-ink">{trendLabel}</p>
          <p className="mt-2 text-sm leading-6 text-muted">{t("statTrendHint")}</p>
        </article>
        <article className="rounded-3xl border border-line bg-paper p-5">
          <p className="text-3xl font-semibold tabular-nums text-ink">{t("statSent")}</p>
          <p className="mt-2 text-sm leading-6 text-muted">{t("statSentHint")}</p>
        </article>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          [t("problemTitle"), t("problemBody")],
          [t("agentCardTitle"), t("agentCardBody")],
          [t("valueTitle"), t("valueBody")],
        ].map(([title, body]) => (
          <article key={title} className="rounded-3xl border border-line bg-paper p-5">
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-7 text-muted">{body}</p>
          </article>
        ))}
      </section>

      <p className="mt-8 text-center text-sm text-muted">
        <Link href="/agent" className={buttonClass.primary}>
          {t("startTask")}
        </Link>
      </p>
    </div>
  );
}
