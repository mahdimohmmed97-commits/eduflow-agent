"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ClipboardIcon, HomeIcon, InfoIcon, SparkIcon, UsersIcon } from "@/components/icons";
import { Button, Modal, buttonClass } from "@/components/ui";
import { ensureStored, resetDemo, setLocale, useEduFlow } from "@/lib/store";
import { TEACHER } from "@/lib/types";
import { pageDirection } from "@/lib/i18n";
import { tx } from "@/lib/text";

const links = [
  { href: "/dashboard", key: "navDashboard" as const, icon: HomeIcon },
  { href: "/classes", key: "navClasses" as const, icon: UsersIcon },
  { href: "/assignments", key: "navAssignments" as const, icon: ClipboardIcon },
  { href: "/agent", key: "navAgent" as const, icon: SparkIcon },
  { href: "/about", key: "navAbout" as const, icon: InfoIcon },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { locale, t } = useEduFlow();
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    document.documentElement.lang = locale === "ar" ? "ar" : "en";
    document.documentElement.dir = pageDirection(locale);
    ensureStored();
  }, [locale]);

  const closeReset = () => setConfirmReset(false);

  const languageSwitch = (
    <div className="flex rounded-full bg-sand p-1 ring-1 ring-line" role="group" aria-label={t("langAria")}>
      <button
        type="button"
        aria-pressed={locale === "ar"}
        onClick={() => setLocale("ar")}
        className={`min-h-11 cursor-pointer rounded-full px-3 py-1.5 text-sm font-semibold ${locale === "ar" ? "bg-navy text-white" : "text-ink"}`}
      >
        العربية
      </button>
      <button
        type="button"
        aria-pressed={locale === "en"}
        onClick={() => setLocale("en")}
        className={`min-h-11 cursor-pointer rounded-full px-3 py-1.5 text-sm font-semibold ${locale === "en" ? "bg-navy text-white" : "text-ink"}`}
      >
        English
      </button>
    </div>
  );

  if (pathname === "/") {
    return (
      <div className="min-h-screen bg-sand">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-3 focus:rounded-xl focus:bg-white focus:px-3 focus:py-2">
          {t("skip")}
        </a>
        <header className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal text-white">
              <LogoMark />
            </div>
            <div>
              <p className="text-base font-semibold tracking-tight">EduFlow</p>
              <p className="text-xs text-muted">{t("tagline")}</p>
            </div>
          </div>
          {languageSwitch}
        </header>
        <main id="main">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-3 focus:rounded-xl focus:bg-white focus:px-3 focus:py-2">
        {t("skip")}
      </a>
      <aside className="bg-navy text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <div className="flex items-center gap-3 px-4 py-4 lg:px-5 lg:pt-6">
          <Link href="/" className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal text-white shadow-lg shadow-black/20" aria-label="EduFlow">
            <LogoMark />
          </Link>
          <div>
            <p className="text-base font-semibold tracking-tight">EduFlow</p>
            <p className="text-xs text-white/85">{t("tagline")}</p>
          </div>
        </div>
        <nav className="flex gap-2 overflow-x-auto px-4 pb-4 lg:mt-4 lg:flex-col lg:overflow-visible lg:px-3 lg:pb-0" aria-label={t("navAria")}>
          {links.map((item) => {
            const active = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 shrink-0 items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
                  active ? "bg-white text-navy" : "text-white/90 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5" />
                {t(item.key)}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto hidden border-t border-white/10 px-5 py-5 lg:block">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-semibold">
              {locale === "ar" ? "س" : "S"}
            </div>
            <div>
              <p className="text-sm font-semibold">{tx(locale, TEACHER.nameAr, TEACHER.nameEn)}</p>
              <p className="text-xs text-white/80">{t("teacherRole")}</p>
            </div>
          </div>
          <p className="mt-4 text-xs leading-5 text-white/80">{t("browserSave")}</p>
          <p className="mt-2 text-xs text-[#f6e4bc]">{t("uaeKsa")}</p>
        </div>
      </aside>
      <div className="min-w-0">
        <div className="brand-bar" />
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-paper/90 px-4 py-3 sm:px-6">
          <p className="rounded-full bg-teal/10 px-3 py-1 text-xs font-semibold text-teal">{t("draftBadge")}</p>
          <div className="flex flex-wrap items-center gap-2">
            {languageSwitch}
            <button type="button" className={buttonClass.secondary} onClick={() => setConfirmReset(true)}>
              {t("reset")}
            </button>
          </div>
        </header>
        <main id="main" className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8" aria-label={t("mainAria")}>
          <p className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">{t("simBanner")}</p>
          {children}
        </main>
      </div>
      <Modal open={confirmReset} title={t("resetTitle")} closeLabel={t("close")} onClose={closeReset}>
        <p className="text-sm leading-6 text-muted">{t("resetBody")}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button
            variant="danger"
            onClick={() => {
              resetDemo();
              closeReset();
            }}
          >
            {t("resetAction")}
          </Button>
          <Button variant="secondary" onClick={closeReset}>
            {t("cancel")}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function LogoMark() {
  return (
    <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden>
      <path d="M7 10h11.2a4.2 4.2 0 0 1 0 8.4H12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M12 18.4h8.2a3.6 3.6 0 0 1 0 7.2H8" fill="none" stroke="#F6E4BC" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
