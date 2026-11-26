"use client";

import Link from "next/link";
import { ContentSkeleton } from "@/components/skeletons";
import { ValuePanel } from "@/components/value-panel";
import { buttonClass } from "@/components/ui";
import { useEduFlow } from "@/lib/store";

export function Landing() {
  const { data, t } = useEduFlow();

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
            {t("navDashboard")}
          </Link>
        </div>
      </section>

      {!data ? <div className="mt-8"><ContentSkeleton /></div> : <div className="mt-6"><ValuePanel /></div>}

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
