"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { PlusIcon } from "@/components/icons";
import { ContentSkeleton } from "@/components/skeletons";
import { Button, Field, Modal, PageIntro, SplitBar, buttonClass, inputClass, statusTone } from "@/components/ui";
import type { MessageKey } from "@/lib/i18n";
import { duePhrase, formatDate, isPastDue } from "@/lib/dates";
import { addAssignment, deleteAssignment, setSubmission, useEduFlow } from "@/lib/store";
import { assignmentFollowUps, tally } from "@/lib/stats";
import { countLabel, fill, pair, tx } from "@/lib/text";
import type { DemoData, Locale, SubmissionStatus } from "@/lib/types";

type Translator = (key: MessageKey) => string;

export function AssignmentsView() {
  const { data, locale, t } = useEduFlow();
  const params = useSearchParams();
  if (!data) return <ContentSkeleton />;
  const id = params.get("id");
  if (id) return <AssignmentDetail id={id} data={data} locale={locale} t={t} />;
  return <AssignmentList data={data} locale={locale} t={t} />;
}

function AssignmentList({ data, locale, t }: { data: DemoData; locale: Locale; t: Translator }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    classId: data.classes[0]?.id ?? "",
    titleAr: "",
    titleEn: "",
    descriptionAr: "",
    descriptionEn: "",
    dueDate: "",
  });
  const ordered = [...data.assignments].sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  function close() {
    setOpen(false);
    setError("");
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const [titleAr, titleEn] = pair(form.titleAr, form.titleEn);
    const [descriptionAr, descriptionEn] = pair(form.descriptionAr, form.descriptionEn);
    if (!form.classId) {
      setError(t("needClass"));
      return;
    }
    if (!titleAr) {
      setError(t("needTitle"));
      return;
    }
    if (!form.dueDate) {
      setError(t("needDate"));
      return;
    }
    addAssignment({
      classId: form.classId,
      titleAr,
      titleEn,
      descriptionAr,
      descriptionEn,
      dueDate: form.dueDate,
    });
    close();
    setForm({ classId: form.classId, titleAr: "", titleEn: "", descriptionAr: "", descriptionEn: "", dueDate: "" });
  }

  return (
    <div>
      <PageIntro
        title={t("assignmentsTitle")}
        body={t("assignmentsBody")}
        action={
          <Button onClick={() => setOpen(true)} disabled={data.classes.length === 0}>
            <PlusIcon className="h-4 w-4" />
            {t("addAssignment")}
          </Button>
        }
      />
      {ordered.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-line bg-paper px-5 py-10 text-center text-sm text-muted">{t("emptyAssignments")}</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {ordered.map((assignment) => {
            const schoolClass = data.classes.find((item) => item.id === assignment.classId);
            const counts = tally(data, assignment.id);
            const past = isPastDue(assignment.dueDate);
            return (
              <article key={assignment.id} className="rounded-3xl border border-line bg-paper p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gold-2">
                      {schoolClass ? tx(locale, schoolClass.nameAr, schoolClass.nameEn) : ""} · {past ? t("pastDue") : t("upcoming")}
                    </p>
                    <h2 className="mt-1 text-xl font-semibold">{tx(locale, assignment.titleAr, assignment.titleEn)}</h2>
                    <p className="mt-1 text-sm leading-6 text-muted">{tx(locale, assignment.descriptionAr, assignment.descriptionEn)}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-muted">
                  {t("dueWord")}: {formatDate(assignment.dueDate, locale)} · {duePhrase(assignment.dueDate, locale)}
                </p>
                <div className="mt-4">
                  <SplitBar submitted={counts.submitted} late={counts.late} missing={counts.notSubmitted} />
                  <p className="mt-2 text-xs text-muted">
                    {t("onTimeShort")} {counts.submitted} · {t("lateShort")} {counts.late} · {t("missingShort")} {counts.notSubmitted}
                  </p>
                </div>
                <Link href={`/assignments?id=${assignment.id}`} className={`${buttonClass.primary} mt-4`}>
                  {t("viewTable")}
                </Link>
              </article>
            );
          })}
        </div>
      )}
      <Modal open={open} title={t("createAssignment")} closeLabel={t("close")} onClose={close}>
        <p className="mb-4 text-sm text-muted">{t("fieldHint")}</p>
        <form onSubmit={submit} className="grid gap-4">
          <Field label={t("chooseClass")}>
            <select className={inputClass} value={form.classId} onChange={(event) => setForm({ ...form, classId: event.target.value })}>
              <option value="">{t("selectClass")}</option>
              {data.classes.map((schoolClass) => (
                <option key={schoolClass.id} value={schoolClass.id}>
                  {tx(locale, schoolClass.nameAr, schoolClass.nameEn)}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("titleAr")}><input className={inputClass} value={form.titleAr} onChange={(event) => setForm({ ...form, titleAr: event.target.value })} /></Field>
            <Field label={t("titleEn")}><input className={inputClass} value={form.titleEn} onChange={(event) => setForm({ ...form, titleEn: event.target.value })} /></Field>
          </div>
          <Field label={t("descriptionAr")} hint={t("descriptionOptional")}>
            <textarea className={inputClass} rows={3} value={form.descriptionAr} onChange={(event) => setForm({ ...form, descriptionAr: event.target.value })} />
          </Field>
          <Field label={t("descriptionEn")} hint={t("descriptionOptional")}>
            <textarea className={inputClass} rows={3} value={form.descriptionEn} onChange={(event) => setForm({ ...form, descriptionEn: event.target.value })} />
          </Field>
          <Field label={t("dueDate")} hint={t("createdWith")}>
            <input className={inputClass} type="date" dir="ltr" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} />
          </Field>
          {error ? <p className="text-sm text-rose-700" role="alert">{error}</p> : null}
          <div className="flex gap-2">
            <Button type="submit">{t("save")}</Button>
            <Button variant="secondary" onClick={close}>{t("cancel")}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function AssignmentDetail({ id, data, locale, t }: { id: string; data: DemoData; locale: Locale; t: Translator }) {
  const router = useRouter();
  const assignment = data.assignments.find((item) => item.id === id);
  const [filter, setFilter] = useState<"all" | SubmissionStatus>("all");
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!assignment) {
    return (
      <div className="rounded-3xl border border-line bg-paper p-6">
        <p className="text-sm text-muted">{t("missingAssignment")}</p>
        <Link href="/assignments" className={`${buttonClass.secondary} mt-4`}>
          {t("back")}
        </Link>
      </div>
    );
  }

  const schoolClass = data.classes.find((item) => item.id === assignment.classId);
  const roster = data.students.filter((item) => item.classId === assignment.classId);
  const counts = tally(data, assignment.id);
  const flagged = assignmentFollowUps(data, assignment.id);
  const rows = roster.filter((student) => {
    if (filter === "all") return true;
    const submission = data.submissions.find((item) => item.assignmentId === assignment.id && item.studentId === student.id);
    return submission?.status === filter;
  });
  const filters: Array<{ id: "all" | SubmissionStatus; label: string; count: number }> = [
    { id: "all", label: t("filterAll"), count: counts.total },
    { id: "submitted", label: t("filterSubmitted"), count: counts.submitted },
    { id: "late", label: t("filterLate"), count: counts.late },
    { id: "not_submitted", label: t("filterMissing"), count: counts.notSubmitted },
  ];

  return (
    <div>
      <Link href="/assignments" className="text-sm font-semibold text-teal">
        {t("back")}
      </Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-gold-2">{t("trackingEyebrow")}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{tx(locale, assignment.titleAr, assignment.titleEn)}</h1>
          <p className="mt-2 text-sm leading-6 text-muted">{tx(locale, assignment.descriptionAr, assignment.descriptionEn)}</p>
          <p className="mt-3 text-sm text-muted">
            {schoolClass ? `${tx(locale, schoolClass.nameAr, schoolClass.nameEn)} · ${tx(locale, schoolClass.subjectAr, schoolClass.subjectEn)} · ` : ""}
            {tx(locale, schoolClass?.schoolAr ?? "", schoolClass?.schoolEn ?? "")}
            {schoolClass ? ` · ${tx(locale, schoolClass.cityAr, schoolClass.cityEn)}` : ""}
          </p>
          <p className="mt-1 text-sm text-ink">
            {t("dueWord")}: {formatDate(assignment.dueDate, locale)} · {duePhrase(assignment.dueDate, locale)} · {countLabel(roster.length, locale, "student")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {flagged.length > 0 ? (
            <Link href={`/agent?assignment=${assignment.id}`} className={buttonClass.primary}>
              {t("draftReminders")} ({flagged.length})
            </Link>
          ) : (
            <p className="rounded-2xl bg-emerald-50 px-3 py-2 text-sm text-emerald-950">{t("clearFollow")}</p>
          )}
          <Button variant="ghost" onClick={() => setConfirmDelete(true)}>
            {t("delete")}
          </Button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <CountCard label={t("onTimeWork")} value={counts.submitted} tone="text-emerald-800" />
        <CountCard label={t("lateWork")} value={counts.late} tone="text-amber-800" />
        <CountCard label={t("missingWork")} value={counts.notSubmitted} tone="text-rose-800" />
      </div>
      <div className="mt-4">
        <SplitBar submitted={counts.submitted} late={counts.late} missing={counts.notSubmitted} />
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label={t("filterAria")}>
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={filter === item.id}
              onClick={() => setFilter(item.id)}
              className={filter === item.id ? buttonClass.primary : buttonClass.secondary}
            >
              {item.label} ({item.count})
            </button>
          ))}
        </div>
        <p className="text-sm text-muted">{t("tableHint")}</p>
      </div>

      <div className="mt-4 overflow-x-auto rounded-3xl border border-line bg-paper shadow-sm">
        <table className="w-full min-w-[880px] text-sm">
          <caption className="sr-only">
            {tx(locale, assignment.titleAr, assignment.titleEn)}
          </caption>
          <thead className="bg-[#f7f3eb] text-start text-xs font-semibold text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">{t("student")}</th>
              <th className="px-4 py-3 font-semibold">{t("parent")}</th>
              <th className="px-4 py-3 font-semibold">{t("status")}</th>
              <th className="px-4 py-3 font-semibold">{t("submittedOn")}</th>
              <th className="px-4 py-3 font-semibold">{t("note")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((student) => {
              const submission = data.submissions.find((item) => item.assignmentId === assignment.id && item.studentId === student.id);
              const status = submission?.status ?? "not_submitted";
              const name = tx(locale, student.nameAr, student.nameEn);
              return (
                <tr key={student.id} className="border-t border-line">
                  <td className="px-4 py-3 font-medium">{name}</td>
                  <td className="px-4 py-3">
                    <p>{tx(locale, student.parentNameAr, student.parentNameEn)}</p>
                    <p className="text-xs text-muted" dir="ltr">
                      {student.parentPhone || "—"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      aria-label={`${t("statusAria")} ${name}`}
                      className={`cursor-pointer rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ${statusTone[status]}`}
                      value={status}
                      onChange={(event) =>
                        setSubmission(assignment.id, student.id, { status: event.target.value as SubmissionStatus })
                      }
                    >
                      <option value="submitted">{t("statusSubmitted")}</option>
                      <option value="late">{t("statusLate")}</option>
                      <option value="not_submitted">{t("statusMissing")}</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-muted">{formatDate(submission?.submittedOn ?? "", locale)}</td>
                  <td className="px-4 py-3">
                    <input
                      aria-label={`${t("noteAria")} ${name}`}
                      className={inputClass}
                      placeholder={t("notePlaceholder")}
                      value={submission?.note ?? ""}
                      onChange={(event) => setSubmission(assignment.id, student.id, { note: event.target.value })}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal open={confirmDelete} title={t("deleteTitle")} closeLabel={t("close")} onClose={() => setConfirmDelete(false)}>
        <p className="text-sm leading-6 text-muted">
          {fill(t("deleteBody"), { name: tx(locale, assignment.titleAr, assignment.titleEn) })}
        </p>
        <div className="mt-6 flex gap-2">
          <Button
            variant="danger"
            onClick={() => {
              deleteAssignment(assignment.id);
              router.push("/assignments");
            }}
          >
            {t("confirmDelete")}
          </Button>
          <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
            {t("cancel")}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function CountCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <article className="rounded-2xl border border-line bg-paper px-4 py-3">
      <p className="text-sm text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${tone}`}>{value}</p>
    </article>
  );
}
