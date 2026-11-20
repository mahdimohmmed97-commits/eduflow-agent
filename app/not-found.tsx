"use client";

import Link from "next/link";
import { buttonClass } from "@/components/ui";
import { useEduFlow } from "@/lib/store";

export default function NotFound() {
  const { t } = useEduFlow();
  return (
    <div className="mx-auto max-w-lg rounded-3xl border border-line bg-paper px-6 py-12 text-center shadow-sm">
      <h1 className="text-2xl font-semibold">{t("notFoundTitle")}</h1>
      <p className="mt-2 text-sm leading-6 text-muted">{t("notFoundBody")}</p>
      <Link href="/" className={`${buttonClass.primary} mt-6`}>
        {t("goHome")}
      </Link>
    </div>
  );
}
