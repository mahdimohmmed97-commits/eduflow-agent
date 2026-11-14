"use client";

import Link from "next/link";
import { ContentSkeleton } from "@/components/skeletons";
import { SplitBar, StatusBadge, buttonClass } from "@/components/ui";
import type { MessageKey } from "@/lib/i18n";
import { duePhrase } from "@/lib/dates";
import { useEduFlow } from "@/lib/store";
import { classOnTimeRate, focusAssignment, listFollowUps, pastDueTally, tally, uniqueStudentCount } from "@/lib/stats";
import { countLabel, followUpSentence, greeting, tx } from "@/lib/text";
import { TEACHER, type SubmissionStatus } from "@/lib/types";

function statusText(status: SubmissionStatus, t: (key: MessageKey) => string) {
  if (status === "submitted") return t("statusSubmitted");
  if (status === "late") return t("statusLate");
  return t("statusMissing");
}

function Donut({ value, label }: { value: number; label: string }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <svg viewBox="0 0 100 100" className="h-24 w-24 shrink-0" role="img" aria-label={label}>
      <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="8" />
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke="#E7C98A"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 50 50)"
      />
      <text x="50" y="54" textAnchor="middle" fill="white" fontSize="16" fontWeight="700">
        {value}%
      </text>
    </svg>
  );
}

export function Dashboard() {
  const { data, locale, t } = useEduFlow();
  if (!data) return <ContentSkeleton />;

  const followUps = listFollowUps(data);
  const people = uniqueStudentCount(followUps);
  const overall = pastDueTally(data);
  const teacher = tx(locale, TEACHER.nameAr, TEACHER.nameEn);
  const comma = locale === "ar" ? "، " : ", ";

  const kpis = [
    { label: t("kpiClasses"), value: data.classes.length, hint: t("kpiClassesHint") },
    { label: t("kpiStudents"), value: data.students.length, hint: t("kpiStudentsHint") },
    { label: t("kpiAssignments"), value: data.assignments.length, hint: t("kpiAssignmentsHint") },
    { label: t("kpiFollow"), value: people, hint: t("kpiFollowHint") },
  ];

  return (
    <div className="space-y-6">
      <section className="hero-panel overflow-hidden rounded-[28px] px-6 py-7 text-white sm:px-8 sm:py-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-gold">EduFlow Agent</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              {greeting(locale)}
              {comma}
              {teacher}
            </h1>
            <p className="mt-3 max-w-xl text-base leading-7 text-white/80">{followUpSentence(people, locale)}</p>
            <p className="mt-1 text-sm text-white/60">{t("heroSupport")}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/agent" className="inline-flex items-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-navy">
                {t("heroReminders")}
              </Link>
              <Link
                href="/agent?tab=summary"
                className="inline-flex items-center rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/25"
              >
                {t("heroSummary")}
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-3xl bg-white/10 px-5 py-4 ring-1 ring-white/15">
            {overall.rate === null ? (
              <p className="px-4 text-3xl font-semibold">—</p>
            ) : (
              <Donut value={overall.rate} label={`${overall.rate}%`} />
            )}
            <div>
              <p className="text-sm text-white/70">{t("onTime")}</p>
              <p className="mt-1 text-lg font-semibold">
                {overall.submitted} / {overall.total}
              </p>
              <p className="text-sm text-white/70">{t("onTimeHint")}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => (
          <article key={item.label} className="rounded-2xl border border-line bg-paper px-4 py-4 shadow-sm">
            <p className="text-sm text-muted">{item.label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{item.value}</p>
            <p className="mt-1 text-xs text-muted">{item.hint}</p>
          </article>
        ))}
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
        <section aria-label={t("classesHeading")}>
          <h2 className="mb-3 text-lg font-semibold">{t("classesHeading")}</h2>
          <div className="grid gap-4">
            {data.classes.map((schoolClass) => {
              const students = data.students.filter((item) => item.classId === schoolClass.id).length;
              const assignments = data.assignments.filter((item) => item.classId === schoolClass.id).length;
              const focus = focusAssignment(data, schoolClass.id);
              const counts = focus ? tally(data, focus.id) : null;
              const rate = classOnTimeRate(data, schoolClass.id);
              return (
                <article key={schoolClass.id} className="rounded-3xl border border-line bg-paper p-5 shadow-sm">
                  <p className="text-sm font-semibold text-gold-2">
                    {tx(locale, schoolClass.schoolAr, schoolClass.schoolEn)} · {tx(locale, schoolClass.cityAr, schoolClass.cityEn)}
                  </p>
                  <h3 className="mt-1 text-xl font-semibold">{tx(locale, schoolClass.nameAr, schoolClass.nameEn)}</h3>
                  <p className="text-sm text-muted">{tx(locale, schoolClass.subjectAr, schoolClass.subjectEn)}</p>
                  <p className="mt-3 text-sm text-muted">
                    {countLabel(students, locale, "student")} · {countLabel(assignments, locale, "assignment")}
                    {rate !== null ? ` · ${rate}% ${t("rateLabel")}` : ""}
                  </p>
                  {focus && counts ? (
                    <div className="mt-4">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                        <p className="font-medium">{tx(locale, focus.titleAr, focus.titleEn)}</p>
                        <p className="text-muted">{duePhrase(focus.dueDate, locale)}</p>
                      </div>
                      <SplitBar submitted={counts.submitted} late={counts.late} missing={counts.notSubmitted} />
                      <p className="mt-2 text-xs text-muted">
                        {t("onTimeShort")} {counts.submitted} · {t("lateShort")} {counts.late} · {t("missingShort")} {counts.notSubmitted}
                      </p>
                    </div>
                  ) : null}
                  <Link href={focus ? `/assignments?id=${focus.id}` : "/assignments"} className={`${buttonClass.secondary} mt-4`}>
                    {t("viewTable")}
                  </Link>
                </article>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-line bg-paper p-5 shadow-sm" aria-label={t("followHeading")}>
          <h2 className="text-lg font-semibold">{t("followHeading")}</h2>
          <p className="mt-1 text-sm text-muted">{t("followHint")}</p>
          {followUps.length === 0 ? (
            <p className="mt-4 rounded-2xl bg-emerald-50 px-3 py-3 text-sm text-emerald-950">{t("noFollow")}</p>
          ) : (
            <ul className="mt-4 max-h-[640px] space-y-3 overflow-auto pe-1">
              {followUps.map((item) => (
                <li key={`${item.assignment.id}-${item.student.id}`}>
                  <Link
                    href={`/assignments?id=${item.assignment.id}`}
                    className="block rounded-2xl border border-line bg-white px-3 py-3 transition hover:border-teal/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{tx(locale, item.student.nameAr, item.student.nameEn)}</p>
                        <p className="text-sm text-muted">
                          {tx(locale, item.schoolClass.nameAr, item.schoolClass.nameEn)} · {tx(locale, item.assignment.titleAr, item.assignment.titleEn)}
                        </p>
                        <p className="mt-1 text-sm">
                          {item.status === "late" ? t("reasonLate") : t("reasonMissing")}
                        </p>
                      </div>
                      <StatusBadge status={item.status} label={statusText(item.status, t)} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
