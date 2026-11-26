"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { ContentSkeleton } from "@/components/skeletons";
import { Button, CopyButton, PageIntro, buttonClass, inputClass } from "@/components/ui";
import { ActivityLog } from "@/components/activity-log";
import { Inbox } from "@/components/inbox";
import {
  draftFacts,
  guardReminderRequest,
  type DraftOrigin,
  type ReminderDraft,
  type ReminderRequest,
  type SummaryRequest,
} from "@/lib/agent";
import { validateReminderText } from "@/lib/draft-validator";
import { issueText, originClass, originKey, reasonText } from "@/lib/safety-labels";
import { runAgent, type ConnectionFallback, type ShownSource } from "@/lib/client-agent";
import type { MessageKey } from "@/lib/i18n";
import { formatDate, isPastDue, zoneOf } from "@/lib/dates";
import { logActivity, useEduFlow } from "@/lib/store";
import { classOnTimeRate, listFollowUps, resolvedStatus, tally } from "@/lib/stats";
import { draftTextAttributes } from "@/lib/draft-direction";
import { givenName, tx } from "@/lib/text";
import { TEACHER, type DemoData, type Locale } from "@/lib/types";

type Translator = (key: MessageKey) => string;
type Tab = "inbox" | "reminders" | "summary" | "log";

function tabFromQuery(value: string | null): Tab {
  if (value === "reminders" || value === "summary" || value === "log" || value === "inbox") return value;
  return "inbox";
}

export function AgentView() {
  const { data, locale, t } = useEduFlow();
  const params = useSearchParams();
  const [languageChoice, setLanguageChoice] = useState<Locale | null>(null);
  const [tabDraft, setTabDraft] = useState<{ query: string; tab: Tab } | null>(null);
  const [assignmentDraft, setAssignmentDraft] = useState<{ query: string; id: string } | null>(null);
  const [classChoice, setClassChoice] = useState("all");
  const [picked, setPicked] = useState<{ assignmentId: string; ids: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [reminders, setReminders] = useState<{ key: string; source: ShownSource; fallback: ConnectionFallback | null; drafts: ReminderDraft[]; request: ReminderRequest } | null>(null);
  const [summary, setSummary] = useState<{ key: string; source: ShownSource; fallback: ConnectionFallback | null; text: string; origin: DraftOrigin } | null>(null);
  const [guardNotice, setGuardNotice] = useState<{ key: string; lines: string[] } | null>(null);

  if (!data) return <ContentSkeleton />;
  const record = data;

  const query = params.toString();
  const requestedTab = tabFromQuery(params.get("tab"));
  const tab = tabDraft && tabDraft.query === query ? tabDraft.tab : requestedTab;
  const draftLocale = languageChoice ?? locale;
  const followUps = listFollowUps(data);
  const defaultAssignment = followUps[0]?.assignment.id ?? [...data.assignments].sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]?.id ?? "";
  const requestedAssignment = params.get("assignment");
  const assignmentFromUrl =
    requestedAssignment && data.assignments.some((item) => item.id === requestedAssignment) ? requestedAssignment : defaultAssignment;
  const assignmentId = assignmentDraft && assignmentDraft.query === query ? assignmentDraft.id : assignmentFromUrl;
  const assignment = data.assignments.find((item) => item.id === assignmentId) ?? null;
  const flagged = followUps.filter((item) => item.assignment.id === assignmentId);
  const selectedIds = picked && picked.assignmentId === assignmentId ? picked.ids : flagged.map((item) => item.student.id);
  const reminderKey = `${assignmentId}:${[...selectedIds].sort().join(",")}:${draftLocale}:${data.tone}`;
  const visibleReminders = reminders && reminders.key === reminderKey ? reminders : null;

  const summaryRequest = buildSummary(data, draftLocale, classChoice);
  const summaryKey = JSON.stringify(summaryRequest);
  const visibleSummary = summary && summary.key === summaryKey ? summary : null;

  function editReminder(studentId: string, field: "studentMessage" | "parentMessage", value: string) {
    setReminders((current) => {
      if (!current) return current;
      return {
        ...current,
        drafts: current.drafts.map((draft) => (draft.studentId === studentId ? { ...draft, [field]: value } : draft)),
      };
    });
  }

  function rejectReminder(studentId: string) {
    setReminders((current) => {
      if (!current) return current;
      const drafts = current.drafts.filter((draft) => draft.studentId !== studentId);
      if (drafts.length === 0) return null;
      return { ...current, drafts };
    });
  }

  async function generateReminders() {
    if (!assignment || selectedIds.length === 0) return;
    const request = buildReminders(record, draftLocale, assignment.id, selectedIds);
    if (!request) return;
    setLoading(true);
    const outcome = await runAgent(request);
    if (!outcome.ok) {
      if (outcome.error === "untrusted_record") {
        setReminders(null);
        setGuardNotice({ key: reminderKey, lines: (outcome.issues ?? []).map((issue) => issueText(issue, locale)) });
        logActivity("refused", "توقفت مسودات التذكير: بيانات السجل غير موثوقة. لم يُكتب شيء ولم يُرسل.", "Reminder drafts stopped: the record data is untrusted. Nothing was written or sent.");
      }
      setLoading(false);
      return;
    }
    setGuardNotice(null);
    const guarded = guardReminderRequest(request);
    const drafts = outcome.result.kind === "reminders" ? outcome.result.drafts : [];
    setReminders({ key: reminderKey, source: outcome.source, fallback: outcome.fallback, drafts, request: guarded.ok && guarded.request.kind === "reminders" ? guarded.request : request });
    logActivity(
      "plan",
      `صيغت مسودات تذكير لـ«${tx(locale, assignment.titleAr, assignment.titleEn)}». لم تُرسل.`,
      `Drafted reminders for “${tx(locale, assignment.titleEn, assignment.titleEn)}”. Nothing was sent.`,
    );
    setLoading(false);
  }

  async function generateSummary() {
    if (!summaryRequest) return;
    setLoading(true);
    const outcome = await runAgent(summaryRequest);
    if (!outcome.ok) {
      setLoading(false);
      return;
    }
    const text = outcome.result.kind === "summary" ? outcome.result.summary : "";
    const origin: DraftOrigin = outcome.result.kind === "summary" ? outcome.result.summaryOrigin : "template";
    setSummary({ key: summaryKey, source: outcome.source, fallback: outcome.fallback, text, origin });
    logActivity("summary", "صيغ ملخص الأسبوع للمراجعة. لم يُرسل.", "Drafted the weekly summary for review. It was not sent.");
    setLoading(false);
  }

  return (
    <div>
      <PageIntro eyebrow={t("agentKicker")} title={t("agentTitle")} body={t("agentBody")} />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-line bg-paper px-4 py-3">
        <p className="text-sm font-medium text-ink">{t("nothingAuto")}</p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted">{t("messageLanguage")}</span>
          <div className="flex rounded-full bg-sand p-1 ring-1 ring-line" role="group" aria-label={t("draftLanguageAria")}>
            {(["ar", "en"] as const).map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={draftLocale === item}
                onClick={() => setLanguageChoice(item)}
                className={`cursor-pointer rounded-full px-3 py-1.5 text-sm font-semibold ${draftLocale === item ? "bg-navy text-white" : "text-muted"}`}
              >
                {item === "ar" ? "العربية" : "English"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label={t("tabAria")}>
        {([
          ["inbox", "tabInbox"],
          ["reminders", "tabReminders"],
          ["summary", "tabSummary"],
          ["log", "tabLog"],
        ] as const).map(([item, key]) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={tab === item}
            onClick={() => setTabDraft({ query, tab: item })}
            className={tab === item ? buttonClass.primary : buttonClass.secondary}
          >
            {t(key)}
          </button>
        ))}
      </div>

      {tab === "inbox" ? (
        <Inbox />
      ) : tab === "log" ? (
        <ActivityLog />
      ) : data.assignments.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-line bg-paper px-5 py-10 text-center text-sm text-muted">{t("emptyAgent")}</p>
      ) : tab === "reminders" ? (
        <div className="grid items-start gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <section className="rounded-3xl border border-line bg-paper p-4 shadow-sm">
            <p className="text-sm font-semibold text-gold-2">{t("reminderKicker")}</p>
            <label className="mt-3 block text-sm font-medium" htmlFor="assignment-picker">
              {t("chooseAssignment")}
            </label>
            <select
              id="assignment-picker"
              className={`${inputClass} mt-1.5`}
              value={assignmentId}
              onChange={(event) => setAssignmentDraft({ query, id: event.target.value })}
            >
              {data.assignments.map((item) => (
                <option key={item.id} value={item.id}>
                  {tx(locale, item.titleAr, item.titleEn)}
                </option>
              ))}
            </select>
            {assignment ? (
              <p className="mt-2 text-xs leading-5 text-muted">
                {formatDate(assignment.dueDate, locale, zoneOf(data.classes, assignment.classId))} · {isPastDue(assignment.dueDate, zoneOf(data.classes, assignment.classId)) ? t("pastDue") : t("upcoming")}
              </p>
            ) : null}
            <div className="mt-4 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">{t("recipients")}</h2>
              <div className="flex gap-1">
                <button type="button" className={buttonClass.ghost} onClick={() => setPicked({ assignmentId, ids: flagged.map((item) => item.student.id) })}>
                  {t("selectAll")}
                </button>
                <button type="button" className={buttonClass.ghost} onClick={() => setPicked({ assignmentId, ids: [] })}>
                  {t("clearAll")}
                </button>
              </div>
            </div>
            {flagged.length === 0 ? (
              <p className="mt-3 rounded-2xl bg-emerald-50 px-3 py-3 text-sm text-emerald-950">{t("positiveEmpty")}</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {flagged.map((item) => {
                  const checked = selectedIds.includes(item.student.id);
                  return (
                    <li key={item.student.id}>
                      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-white px-3 py-3">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={checked}
                          onChange={() => {
                            const next = checked
                              ? selectedIds.filter((id) => id !== item.student.id)
                              : [...selectedIds, item.student.id];
                            setPicked({ assignmentId, ids: next });
                          }}
                        />
                        <span>
                          <span className="block font-semibold">{tx(draftLocale, item.student.nameAr, item.student.nameEn)}</span>
                          <span className="block text-sm text-muted">
                            {item.status === "late" ? t("reasonLate") : t("reasonMissing")}
                          </span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
            {flagged.length > 0 && selectedIds.length === 0 ? <p className="mt-3 text-sm text-rose-700">{t("atLeastOne")}</p> : null}
            <Button className="mt-4 w-full" onClick={() => void generateReminders()} disabled={loading || selectedIds.length === 0}>
              {loading && tab === "reminders" ? t("generating") : visibleReminders ? t("regenerate") : t("generate")}
            </Button>
          </section>

          <section className="space-y-4">
            {guardNotice && guardNotice.key === reminderKey ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-950" role="alert">
                <p className="font-semibold">{t("recordRejected")}</p>
                <ul className="mt-2 list-disc ps-5">
                  {guardNotice.lines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {!visibleReminders ? (
              <div className="rounded-3xl border border-dashed border-line bg-paper px-5 py-12 text-center">
                <p className="text-lg font-semibold">{t("draftMark")}</p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{t("willNotSend")}</p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">{t("messagesReady")}</h2>
                    <p className="text-sm text-muted">{sourceCaption(visibleReminders.source, t, visibleReminders.drafts.flatMap((draft) => [draft.studentOrigin, draft.parentOrigin]))}</p>
                    <FallbackLine fallback={visibleReminders.fallback} t={t} />
                  </div>
                  <CopyButton
                    text={visibleReminders.drafts
                      .filter((draft) => {
                        const student = visibleReminders.request.students.find((item) => item.id === draft.studentId);
                        if (!student) return false;
                        const facts = draftFacts(visibleReminders.request, student);
                        return [draft.studentMessage, draft.parentMessage].every((text) => validateReminderText(text, facts).ok);
                      })
                      .map((draft) => {
                        const student = flagged.find((item) => item.student.id === draft.studentId);
                        const name = student ? tx(draftLocale, student.student.nameAr, student.student.nameEn) : draft.studentId;
                        return `${name}\n\n${draft.studentMessage}\n\n${draft.parentMessage}`;
                      })
                      .join("\n\n----------\n\n")}
                    label={t("copyAll")}
                    copiedLabel={t("copied")}
                  />
                </div>
                {visibleReminders.drafts.map((draft) => {
                  const student = data.students.find((item) => item.id === draft.studentId);
                  if (!student) return null;
                  const name = tx(draftLocale, student.nameAr, student.nameEn);
                  const parent = tx(draftLocale, student.parentNameAr, student.parentNameEn);
                  const requestStudent = visibleReminders.request.students.find((item) => item.id === draft.studentId);
                  const facts = requestStudent ? draftFacts(visibleReminders.request, requestStudent) : null;
                  const problems = (text: string, origin: DraftOrigin) => {
                    if (origin === "blocked") return null;
                    if (!facts) return [t("emptyBlocked")];
                    const check = validateReminderText(text, facts);
                    return check.ok ? null : check.reasons.map((reason) => reasonText(reason, draftLocale));
                  };
                  const blocked = (draft.blockReasons ?? []).map((reason) => reasonText(reason, draftLocale));
                  const headerOrigin: DraftOrigin | "mixed" = draft.studentOrigin === draft.parentOrigin ? draft.studentOrigin : "mixed";
                  return (
                    <article key={draft.studentId} className="rounded-3xl border border-line bg-paper p-4 shadow-sm sm:p-5">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gold-2">{t("draftOnlyShort")}</p>
                          <h3 className="text-lg font-semibold" {...draftTextAttributes(draftLocale, name)}>{name}</h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-950 ring-1 ring-amber-200">
                            {t("statusPending")}
                          </span>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${originClass(headerOrigin)}`}>{t(originKey(headerOrigin))}</span>
                          <button type="button" className={buttonClass.secondary} onClick={() => rejectReminder(draft.studentId)}>
                            {t("rejectDraft")}
                          </button>
                        </div>
                      </div>
                      <div className="grid gap-4 lg:grid-cols-2">
                        <MessageCard
                          title={t("toStudent")}
                          who={name}
                          locale={draftLocale}
                          text={draft.studentMessage}
                          origin={draft.studentOrigin}
                          originLabel={t(originKey(draft.studentOrigin))}
                          blockedNote={draft.studentOrigin === "blocked" ? `${t("messageBlocked")} ${blocked.join(" · ")}` : undefined}
                          editWarning={(() => {
                            const found = problems(draft.studentMessage, draft.studentOrigin);
                            return found ? `${t("editNeedsReview")} ${found.join(" · ")}` : undefined;
                          })()}
                          copyLabel={t("copyStudent")}
                          copiedLabel={t("copied")}
                          editorLabel={t("draftEditorLabel")}
                          onTextChange={(value) => editReminder(draft.studentId, "studentMessage", value)}
                        />
                        <MessageCard
                          title={t("toParent")}
                          who={parent}
                          locale={draftLocale}
                          phone={student.parentPhone}
                          phoneHint={t("phoneHint")}
                          text={draft.parentMessage}
                          origin={draft.parentOrigin}
                          originLabel={t(originKey(draft.parentOrigin))}
                          blockedNote={draft.parentOrigin === "blocked" ? `${t("messageBlocked")} ${blocked.join(" · ")}` : undefined}
                          editWarning={(() => {
                            const found = problems(draft.parentMessage, draft.parentOrigin);
                            return found ? `${t("editNeedsReview")} ${found.join(" · ")}` : undefined;
                          })()}
                          copyLabel={t("copyParent")}
                          copiedLabel={t("copied")}
                          editorLabel={t("draftEditorLabel")}
                          onTextChange={(value) => editReminder(draft.studentId, "parentMessage", value)}
                          warm
                        />
                      </div>
                    </article>
                  );
                })}
              </>
            )}
          </section>
        </div>
      ) : (
        <div className="grid items-start gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <section className="rounded-3xl border border-line bg-paper p-4 shadow-sm">
            <p className="text-sm font-semibold text-gold-2">{t("summaryKicker")}</p>
            <label className="mt-3 block text-sm font-medium" htmlFor="class-picker">
              {t("classWord")}
            </label>
            <select id="class-picker" className={`${inputClass} mt-1.5`} value={classChoice} onChange={(event) => setClassChoice(event.target.value)}>
              <option value="all">{t("allClasses")}</option>
              {data.classes.map((schoolClass) => (
                <option key={schoolClass.id} value={schoolClass.id}>
                  {tx(locale, schoolClass.nameAr, schoolClass.nameEn)}
                </option>
              ))}
            </select>
            <p className="mt-3 text-sm leading-6 text-muted">{t("summaryScope")}</p>
            <p className="mt-2 text-sm text-muted">{t("gradebookHint")}</p>
            <p className="mt-2 text-sm text-muted">{t("demoRateLabel")}</p>
            <Button className="mt-4 w-full" onClick={() => void generateSummary()} disabled={loading || !summaryRequest}>
              {loading && tab === "summary" ? t("generating") : visibleSummary ? t("regenerate") : t("generateSummary")}
            </Button>
          </section>
          <section>
            {!visibleSummary || !summaryRequest ? (
              <div className="rounded-3xl border border-dashed border-line bg-paper px-5 py-12 text-center">
                <p className="text-lg font-semibold">{t("weeklyFor")}</p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{t("summaryBody")}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <article className="rounded-3xl border border-line bg-paper p-5 shadow-sm">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold">{t("summaryReady")}</h2>
                      <p className="text-sm text-muted">{sourceCaption(visibleSummary.source, t, [visibleSummary.origin])}</p>
                      <FallbackLine fallback={visibleSummary.fallback} t={t} />
                    </div>
                    <CopyButton text={visibleSummary.text} label={t("copy")} copiedLabel={t("copied")} />
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-7 text-ink" {...draftTextAttributes(draftLocale, visibleSummary.text)}>{visibleSummary.text}</p>
                </article>
                <article className="rounded-3xl border border-line bg-paper p-5 shadow-sm">
                  <h2 className="text-lg font-semibold">{t("flagged")}</h2>
                  <p className="mt-1 text-sm text-muted">{t("fromRecord")}</p>
                  {summaryRequest.classes.every((item) => item.flags.length === 0) ? (
                    <p className="mt-4 rounded-2xl bg-emerald-50 px-3 py-3 text-sm text-emerald-950">{t("noFlags")}</p>
                  ) : (
                    <ul className="mt-4 space-y-2">
                      {summaryRequest.classes.flatMap((schoolClass) =>
                        schoolClass.flags.map((flag) => (
                          <li key={`${schoolClass.id}-${flag.studentId}-${flag.reason}`} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line px-3 py-3">
                            <div>
                              <p className="font-semibold">{flag.studentName}</p>
                              <p className="text-sm text-muted">{schoolClass.name} · {flag.reason}</p>
                            </div>
                            <Link href="/assignments" className={buttonClass.secondary}>
                              {t("openAssignment")}
                            </Link>
                          </li>
                        )),
                      )}
                    </ul>
                  )}
                </article>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function MessageCard({
  title,
  who,
  locale,
  text,
  origin,
  originLabel,
  blockedNote,
  editWarning,
  copyLabel,
  copiedLabel,
  phone,
  phoneHint,
  editorLabel,
  onTextChange,
  warm = false,
}: {
  title: string;
  who: string;
  locale: Locale;
  text: string;
  origin?: DraftOrigin;
  originLabel?: string;
  blockedNote?: string;
  editWarning?: string;
  copyLabel: string;
  copiedLabel: string;
  phone?: string;
  phoneHint?: string;
  editorLabel?: string;
  onTextChange?: (value: string) => void;
  warm?: boolean;
}) {
  const textProps = draftTextAttributes(locale, text);
  return (
    <div className={`flex h-full flex-col rounded-2xl border p-4 ${warm ? "border-amber-200 bg-[#fbf7ef]" : "border-teal/20 bg-[#f3faf9]"}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-muted">{title}</p>
        {origin && originLabel ? <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${originClass(origin)}`}>{originLabel}</span> : null}
      </div>
      <p className="mt-1 font-semibold" {...draftTextAttributes(locale, who)}>{who}</p>
      {phone ? (
        <p className="mt-1 text-xs text-muted">
          <span dir="ltr">{phone}</span>
          {phoneHint ? ` · ${phoneHint}` : ""}
        </p>
      ) : null}
      {blockedNote ? (
        <p className="mt-3 flex-1 rounded-xl bg-rose-50 px-3 py-2 text-sm leading-6 text-rose-950" role="alert">
          {blockedNote}
        </p>
      ) : onTextChange ? (
        <textarea
          aria-label={editorLabel ?? title}
          className={`${inputClass} mt-3 min-h-48 flex-1 whitespace-pre-wrap`}
          value={text}
          onChange={(event) => onTextChange(event.target.value)}
          {...textProps}
        />
      ) : (
        <p className="mt-3 flex-1 whitespace-pre-wrap text-sm leading-7" {...textProps}>{text}</p>
      )}
      {editWarning ? (
        <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm leading-6 text-rose-950" role="alert">
          {editWarning}
        </p>
      ) : null}
      {blockedNote || editWarning ? null : (
        <div className="mt-4">
          <CopyButton text={text} label={copyLabel} copiedLabel={copiedLabel} />
        </div>
      )}
    </div>
  );
}

function FallbackLine({ fallback, t }: { fallback: ConnectionFallback | null; t: Translator }) {
  if (!fallback) return null;
  const key = fallback === "timeout" ? "timeoutNotice" : fallback === "offline" ? "offlineNotice" : "serverNotice";
  return (
    <p className="mt-2 text-sm leading-6 text-ink" role="status">
      {t(key)}
    </p>
  );
}

function sourceCaption(source: ShownSource, t: Translator, origins: DraftOrigin[] = []) {
  if (source === "mixed") return t("mixedCaption");
  if (source === "openai" || source === "anthropic") return t("openaiCaption");
  if (source === "local") return t("offlineCaption");
  if (origins.includes("api_failure_fallback")) return t("apiFailureCaption");
  if (origins.includes("rejected_ai_output")) return t("rejectedCaption");
  return t("templateCaption");
}

function buildReminders(data: DemoData, locale: Locale, assignmentId: string, studentIds: string[]): ReminderRequest | null {
  const assignment = data.assignments.find((item) => item.id === assignmentId);
  const schoolClass = data.classes.find((item) => item.id === assignment?.classId);
  if (!assignment || !schoolClass) return null;
  const allowed = new Set(studentIds);
  const students = data.students
    .filter((student) => student.classId === schoolClass.id && allowed.has(student.id))
    .flatMap((student) => {
      const status = resolvedStatus(data, assignment.id, student.id);
      if (status === "submitted") return [];
      const name = tx(locale, student.nameAr, student.nameEn);
      return [
        {
          id: student.id,
          name,
          givenName: givenName(name),
          gender: student.gender,
          parentName: tx(locale, student.parentNameAr, student.parentNameEn),
          status,
        },
      ];
    });
  if (students.length === 0) return null;
  return {
    kind: "reminders",
    locale,
    teacherName: tx(locale, TEACHER.nameAr, TEACHER.nameEn),
    schoolLine: `${tx(locale, schoolClass.schoolAr, schoolClass.schoolEn)} — ${tx(locale, schoolClass.cityAr, schoolClass.cityEn)}`,
    className: tx(locale, schoolClass.nameAr, schoolClass.nameEn),
    subject: tx(locale, schoolClass.subjectAr, schoolClass.subjectEn),
    assignmentTitle: tx(locale, assignment.titleAr, assignment.titleEn),
    dueDateLabel: formatDate(assignment.dueDate, locale, zoneOf(data.classes, schoolClass.id)),
    tone: data.tone,
    students,
  };
}

function buildSummary(data: DemoData, locale: Locale, classChoice: string): SummaryRequest | null {
  const classes = data.classes.filter((item) => classChoice === "all" || item.id === classChoice);
  if (classes.length === 0) return null;
  const followUps = listFollowUps(data);
  return {
    kind: "summary",
    locale,
    teacherName: tx(locale, TEACHER.nameAr, TEACHER.nameEn),
    classes: classes.map((schoolClass) => ({
      id: schoolClass.id,
      name: tx(locale, schoolClass.nameAr, schoolClass.nameEn),
      subject: tx(locale, schoolClass.subjectAr, schoolClass.subjectEn),
      schoolLine: `${tx(locale, schoolClass.schoolAr, schoolClass.schoolEn)} — ${tx(locale, schoolClass.cityAr, schoolClass.cityEn)}`,
      studentCount: data.students.filter((student) => student.classId === schoolClass.id).length,
      onTimeRate: classOnTimeRate(data, schoolClass.id),
      assignments: data.assignments
        .filter((assignment) => assignment.classId === schoolClass.id)
        .map((assignment) => {
          const counts = tally(data, assignment.id);
          return {
            title: tx(locale, assignment.titleAr, assignment.titleEn),
            dueDateLabel: formatDate(assignment.dueDate, locale, zoneOf(data.classes, schoolClass.id)),
            pastDue: isPastDue(assignment.dueDate, zoneOf(data.classes, schoolClass.id)),
            submitted: counts.submitted,
            late: counts.late,
            notSubmitted: counts.notSubmitted,
          };
        }),
      flags: followUps
        .filter((item) => item.schoolClass.id === schoolClass.id)
        .map((item) => ({
          studentId: item.student.id,
          studentName: tx(locale, item.student.nameAr, item.student.nameEn),
          reason: `${item.status === "late" ? (locale === "ar" ? "تسليم متأخر" : "Late submission") : locale === "ar" ? "لم يُسلّم بعد الموعد" : "Not submitted after the due date"}: ${tx(locale, item.assignment.titleAr, item.assignment.titleEn)}`,
        })),
    })),
  };
}
