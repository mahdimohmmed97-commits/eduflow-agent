"use client";

import { useState } from "react";
import { interpretAsk } from "@/lib/ask";
import { runReliabilityChecks, type CheckResult } from "@/lib/checks";
import { logActivity, useEduFlow } from "@/lib/store";
import { fill, tx } from "@/lib/text";
import { Button, inputClass } from "@/components/ui";

export function LimitsPanel() {
  const { locale, t } = useEduFlow();
  const [ask, setAsk] = useState("");
  const [reply, setReply] = useState("");
  const [checks, setChecks] = useState<CheckResult[] | null>(null);

  function submitAsk(event: React.FormEvent) {
    event.preventDefault();
    const kind = interpretAsk(ask);
    if (kind === "empty") {
      setReply(t("askEmpty"));
      logActivity("refused", "طلب فارغ. توقف الوكيل وطلب توضيحاً.", "Empty request. The agent stopped and asked for a clearer task.");
      return;
    }
    if (kind === "out_of_scope") {
      setReply(t("askScope"));
      logActivity("refused", `طلب خارج المهمة: «${ask.trim().slice(0, 80)}». لم تُكتب مسودة.`, `Out-of-scope request: “${ask.trim().slice(0, 80)}”. No draft was written.`);
      return;
    }
    setReply(t("askFollow"));
    logActivity("plan", "طلب متابعة داخل المهمة. أُعيد إلى خطة اليوم بانتظار الموافقة.", "In-scope follow-up. Sent back to today’s plan to wait for approval.");
  }

  function tryMissing() {
    setReply(t("missingParent"));
    logActivity("refused", "تجربة حد: طالب بلا اسم ولي أمر. توقف الوكيل ولم يكتب مسودة.", "Limit test: a student with no parent name. The agent stopped and wrote no draft.");
  }

  function runChecks() {
    const results = runReliabilityChecks();
    setChecks(results);
    const passed = results.filter((item) => item.pass).length;
    logActivity(
      "test",
      `فحص موثوقية: نجح ${passed} من ${results.length}.`,
      `Reliability check: ${passed} of ${results.length} passed.`,
    );
  }

  const passed = checks?.filter((item) => item.pass).length ?? 0;

  return (
    <section className="rounded-3xl border border-line bg-paper p-4 shadow-sm sm:p-5">
      <h2 className="text-lg font-semibold">{t("askLabel")}</h2>
      <form onSubmit={submitAsk} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="agent-ask">
          {t("askLabel")}
        </label>
        <input
          id="agent-ask"
          className={inputClass}
          value={ask}
          placeholder={t("askPlaceholder")}
          onChange={(event) => setAsk(event.target.value)}
        />
        <Button type="submit">{t("askButton")}</Button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={tryMissing}>
          {t("tryMissing")}
        </Button>
        <Button variant="secondary" onClick={runChecks}>
          {t("runChecks")}
        </Button>
      </div>
      {reply ? (
        <p className="mt-3 rounded-2xl bg-sand px-3 py-3 text-sm leading-6" role="status">
          {reply}
        </p>
      ) : null}
      {checks ? (
        <div className="mt-4">
          <p className="text-sm font-semibold">
            {t("checksTitle")}: {fill(t("checksPassed"), { pass: passed, total: checks.length })}
          </p>
          <ul className="mt-2 space-y-2">
            {checks.map((item) => (
              <li key={item.id} className="rounded-2xl border border-line px-3 py-2 text-sm leading-6">
                <span className={item.pass ? "font-semibold text-emerald-800" : "font-semibold text-rose-800"}>
                  {item.pass ? (locale === "ar" ? "نجح" : "Pass") : locale === "ar" ? "لم ينجح" : "Fail"}
                </span>
                {" · "}
                {tx(locale, item.textAr, item.textEn)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
