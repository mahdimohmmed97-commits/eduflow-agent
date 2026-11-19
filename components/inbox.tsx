"use client";

import { useId, useState } from "react";
import { canDraftParent } from "@/lib/ask";
import { LimitsPanel } from "@/components/limits-panel";
import { Reasoning } from "@/components/reasoning";
import { presentDraft } from "@/lib/channels";
import { runAgent, type ConnectionFallback } from "@/lib/client-agent";
import { formatDate, zoneOf } from "@/lib/dates";
import type { MessageKey } from "@/lib/i18n";
import { dailyActions, improvingStudents, type RiskPattern, type StudentRisk } from "@/lib/risk";
import { ValuePanel } from "@/components/value-panel";
import { approvePreparedDraft, editPreparedDraft, logActivity, rejectPreparedDraft, savePreparedDraft, setChannel, setTone, useEduFlow } from "@/lib/store";
import { givenName, tx, fill } from "@/lib/text";
import { TEACHER, type Audience, type Channel, type DraftSource, type TeacherDraft, type Tone } from "@/lib/types";
import { CopyButton, buttonClass, inputClass } from "@/components/ui";

const patternKey: Record<RiskPattern, MessageKey> = {
  repeated: "patternRepeated",
  worsening: "patternWorsening",
  improving: "patternImproving",
  single: "patternSingle",
  clear: "patternClear",
};

export function Inbox() {
  const { data, locale, t } = useEduFlow();
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  if (!data) return null;
  const record = data;
  const actions = dailyActions(data);
  const improving = improvingStudents(data);
  const highCount = actions.filter((item) => item.level === "high").length;

  async function prepare(item: StudentRisk, audience: Audience, manageBusy = true) {
    const issue = item.latestIssue;
    if (!issue) return;
    const assignment = record.assignments.find((entry) => entry.id === issue.assignmentId);
    const schoolClass = record.classes.find((entry) => entry.id === item.student.classId);
    if (!assignment || !schoolClass) return;
    const studentName = tx(locale, item.student.nameAr, item.student.nameEn);
    const parentName = tx(locale, item.student.parentNameAr, item.student.parentNameEn);
    const assignmentTitle = tx(locale, assignment.titleAr, assignment.titleEn);
    const teacherName = tx(locale, TEACHER.nameAr, TEACHER.nameEn);
    if (audience === "parent" && !canDraftParent(parentName)) {
      setNotice(t("missingParent"));
      logActivity("refused", `لا اسم لولي أمر ${item.student.nameAr}. توقفت المسودة.`, `No parent name for ${item.student.nameEn}. The draft stopped.`);
      return;
    }
    setNotice("");
    if (manageBusy) setBusy(`${item.student.id}:${audience}`);
    const started = performance.now();
    const outcome = await runAgent({
      kind: "reminders",
      locale,
      tone: record.tone,
      teacherName,
      schoolLine: `${tx(locale, schoolClass.schoolAr, schoolClass.schoolEn)} — ${tx(locale, schoolClass.cityAr, schoolClass.cityEn)}`,
      className: tx(locale, schoolClass.nameAr, schoolClass.nameEn),
      subject: tx(locale, schoolClass.subjectAr, schoolClass.subjectEn),
      assignmentTitle,
      dueDateLabel: formatDate(assignment.dueDate, locale, zoneOf(record.classes, schoolClass.id)),
      students: [
        {
          id: item.student.id,
          name: studentName,
          givenName: givenName(studentName),
          gender: item.student.gender,
          parentName,
          status: issue.status,
        },
      ],
    });
    if (!outcome.ok) {
      if (manageBusy) setBusy(null);
      return;
    }
    const draft = outcome.result.kind === "reminders" ? outcome.result.drafts[0] : undefined;
    const fullText = audience === "parent" ? draft?.parentMessage : draft?.studentMessage;
    if (!fullText) {
      if (manageBusy) setBusy(null);
      return;
    }
    const presented = presentDraft({
      channel: record.channel,
      tone: record.tone,
      locale,
      audience,
      fullText,
      assignmentTitle,
      studentName,
      givenName: givenName(studentName),
      parentName,
      gender: item.student.gender,
      status: issue.status,
      dueLabel: formatDate(assignment.dueDate, locale, zoneOf(record.classes, schoolClass.id)),
      teacherName,
    });
    const channelAr = record.channel === "email" ? "بريد" : record.channel === "sms" ? "رسالة قصيرة" : "واتساب";
    const channelEn = record.channel === "email" ? "email" : record.channel === "sms" ? "SMS" : "WhatsApp";
    const whoAr = audience === "parent" ? `ولي أمر ${item.student.nameAr}` : item.student.nameAr;
    const whoEn = audience === "parent" ? `${item.student.nameEn}'s parent` : item.student.nameEn;
    const dueLabel = formatDate(assignment.dueDate, locale, zoneOf(record.classes, schoolClass.id));
    const otherNames = record.students
      .filter((student) => student.id !== item.student.id)
      .flatMap((student) => [student.nameAr, student.nameEn, student.parentNameAr, student.parentNameEn]);
    savePreparedDraft({
      studentId: item.student.id,
      assignmentId: assignment.id,
      audience,
      tone: record.tone,
      channel: record.channel,
      text: presented.text,
      subject: presented.subject,
      source: outcome.source,
      fallback: outcome.fallback,
      prepareMs: performance.now() - started,
      allowedParts: [
        studentName,
        givenName(studentName),
        parentName,
        assignmentTitle,
        dueLabel,
        tx(locale, schoolClass.schoolAr, schoolClass.schoolEn),
        tx(locale, schoolClass.cityAr, schoolClass.cityEn),
        tx(locale, schoolClass.nameAr, schoolClass.nameEn),
        tx(locale, schoolClass.subjectAr, schoolClass.subjectEn),
        teacherName,
        item.student.parentPhone,
        presented.text,
        presented.subject,
      ],
      otherNames,
    });
    logActivity(
      "plan",
      `جُهزت مسودة ${channelAr} لـ${whoAr} عن «${assignment.titleAr}». لم تُعتمد ولم تُرسل.`,
      `Prepared a ${channelEn} draft for ${whoEn} about “${assignment.titleEn}”. It is not approved and was not sent.`,
    );
    if (manageBusy) setBusy(null);
  }

  function rejectPending(draftId: string, studentNameAr: string, studentNameEn: string, audience: Audience) {
    const whoAr = audience === "parent" ? `ولي أمر ${studentNameAr}` : studentNameAr;
    const whoEn = audience === "parent" ? `${studentNameEn}'s parent` : studentNameEn;
    rejectPreparedDraft(draftId, `رُفضت مسودة ${whoAr}. لم تُعتمد ولم تُرسل.`, `Rejected the draft for ${whoEn}. It was not approved and was not sent.`);
  }

  function commitPending(draftId: string, studentNameAr: string, studentNameEn: string, titleAr: string, titleEn: string, audience: Audience, channel: Channel, visibleText: string) {
    const channelAr = channel === "email" ? "بريد" : channel === "sms" ? "رسالة قصيرة" : "واتساب";
    const channelEn = channel === "email" ? "email" : channel === "sms" ? "SMS" : "WhatsApp";
    const whoAr = audience === "parent" ? `ولي أمر ${studentNameAr}` : studentNameAr;
    const whoEn = audience === "parent" ? `${studentNameEn}'s parent` : studentNameEn;
    const decision = approvePreparedDraft(
      draftId,
      `اعتمدت مسودة ${channelAr} لـ${whoAr} عن «${titleAr}». لم تُرسل.`,
      `Approved a ${channelEn} draft for ${whoEn} about “${titleEn}”. It was not sent.`,
      visibleText,
    );
    if (!decision.ok) {
      const reason = decision.reason === "teacher_approval_required" || decision.reason === "not_pending" ? "empty" : decision.reason;
      setNotice(blockLabel(reason, t));
    } else setNotice("");
  }

  async function prepareUrgent() {
    const urgent = actions.filter((item) => item.level === "high");
    setBusy("all");
    for (const item of urgent) {
      const existing = record.approvals.find(
        (entry) =>
          entry.studentId === item.student.id &&
          entry.assignmentId === item.latestIssue?.assignmentId &&
          entry.audience === "parent" &&
          entry.tone === record.tone &&
          entry.channel === record.channel,
      );
      if (existing) continue;
      await prepare(item, "parent", false);
    }
    setBusy(null);
  }

  return (
    <div className="space-y-5">
      <ValuePanel />
      <section className="rounded-3xl border border-line bg-paper p-4 shadow-sm sm:p-5">
        <h2 className="text-lg font-semibold">{t("stepsTitle")}</h2>
        <ol className="mt-3 grid gap-2 sm:grid-cols-3">
          {(["stepPrepare", "stepEdit", "stepDecide"] as const).map((key, index) => (
            <li key={key} className="rounded-2xl bg-sand px-3 py-3 text-sm leading-6">
              <span className="font-semibold">{index + 1}. </span>
              {t(key)}
            </li>
          ))}
        </ol>
        <p className="mt-3 text-sm leading-6 text-muted">{t("roleNotIdentity")}</p>
      </section>
      <Reasoning />
      {notice ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-950" role="status">
          {notice}
        </p>
      ) : null}
      <section className="rounded-3xl border border-line bg-paper p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold">{t("inboxTitle")}</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">{t("inboxLead")}</p>
          </div>
          <button
            type="button"
            className={buttonClass.primary}
            disabled={highCount === 0 || busy !== null}
            onClick={() => void prepareUrgent()}
          >
            {busy === "all" ? t("drafting") : t("prepareHigh")}
          </button>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Choice
            label={t("toneLabel")}
            value={data.tone}
            options={[
              ["formal", t("toneFormal")],
              ["friendly", t("toneFriendly")],
            ]}
            onChange={(value) => setTone(value as Tone)}
          />
          <Choice
            label={t("channelLabel")}
            value={data.channel}
            options={[
              ["whatsapp", t("channelWhatsapp")],
              ["email", t("channelEmail")],
              ["sms", t("channelSms")],
            ]}
            onChange={(value) => setChannel(value as Channel)}
          />
        </div>
        {highCount > 0 ? (
          <p className="mt-4 text-sm font-medium text-rose-900">{fill(t("highWaiting"), { count: highCount })}</p>
        ) : null}
      </section>

      {actions.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-line bg-paper px-5 py-10 text-center text-sm text-muted">{t("noActions")}</p>
      ) : (
        <ul className="space-y-4">
          {actions.map((item) => {
            const issue = item.latestIssue;
            const assignment = issue ? data.assignments.find((entry) => entry.id === issue.assignmentId) : null;
            const schoolClass = data.classes.find((entry) => entry.id === item.student.classId);
            const approvals = data.approvals.filter(
              (entry) =>
                entry.studentId === item.student.id &&
                entry.assignmentId === issue?.assignmentId &&
                entry.tone === data.tone &&
                entry.channel === data.channel,
            );
            const name = tx(locale, item.student.nameAr, item.student.nameEn);
            return (
              <li key={item.student.id} className="rounded-3xl border border-line bg-paper p-4 shadow-sm sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-gold-2">
                      {item.level === "high" ? t("riskHigh") : t("riskWatch")} · {t(patternKey[item.pattern])}
                    </p>
                    <h3 className="mt-1 text-xl font-semibold">{name}</h3>
                    <p className="text-sm text-muted">
                      {schoolClass ? `${tx(locale, schoolClass.schoolAr, schoolClass.schoolEn)} · ${tx(locale, schoolClass.cityAr, schoolClass.cityEn)}` : ""}
                      {schoolClass ? ` · ${schoolClass.timeZone === "Asia/Riyadh" ? t("tzRiyadh") : t("tzDubai")}` : ""}
                    </p>
                  </div>
                  <p className="rounded-full bg-navy px-3 py-1 text-sm font-semibold text-white">{fill(t("riskScore"), { score: item.score })}</p>
                </div>
                <p className="mt-3 text-sm leading-6">
                  {item.pattern === "worsening"
                    ? t("actionWorsening")
                    : item.pattern === "single"
                      ? t("actionSingle")
                      : fill(t("actionRepeated"), { count: item.issues.length })}
                </p>
                {assignment && issue ? (
                  <p className="mt-2 text-sm text-muted">
                    {tx(locale, assignment.titleAr, assignment.titleEn)} · {issue.status === "late" ? t("reasonLate") : t("reasonMissing")}
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={buttonClass.primary}
                    disabled={busy !== null}
                    onClick={() => void prepare(item, "parent")}
                  >
                    {busy === `${item.student.id}:parent` ? t("drafting") : t("prepareParent")}
                  </button>
                  <button
                    type="button"
                    className={buttonClass.secondary}
                    disabled={busy !== null}
                    onClick={() => void prepare(item, "student")}
                  >
                    {busy === `${item.student.id}:student` ? t("drafting") : t("prepareStudent")}
                  </button>
                </div>
                {(data.drafts ?? [])
                  .filter(
                    (draft) =>
                      draft.studentId === item.student.id &&
                      draft.assignmentId === issue?.assignmentId &&
                      draft.tone === data.tone &&
                      draft.channel === data.channel &&
                      (draft.status === "pending_review" || draft.status === "rejected"),
                  )
                  .slice(0, 4)
                  .map((draft) =>
                    draft.status === "pending_review" ? (
                      <div key={draft.id} className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold">{t("pendingTitle")}</p>
                          <StatusBadge label={t("statusPending")} tone="pending" />
                          <SourceBadge source={draft.source} label={sourceLabel(draft.source, t)} />
                        </div>
                        <p className="mt-1 text-sm leading-6 text-amber-950">{t("pendingHint")}</p>
                        <FallbackNote fallback={draft.fallback} t={t} />
                        <label className="mt-3 block text-sm font-medium" htmlFor={`draft-${draft.id}`}>
                          {t("draftEditorLabel")} · {draft.audience === "parent" ? t("toParent") : t("toStudent")}
                        </label>
                        <textarea
                          id={`draft-${draft.id}`}
                          className={`${inputClass} mt-1.5 min-h-40`}
                          value={draft.text}
                          onChange={(event) => editPreparedDraft(draft.id, event.target.value)}
                        />
                        {draft.blockReason ? (
                          <p className="mt-3 text-sm leading-6 text-rose-900" role="alert">
                            {blockLabel(draft.blockReason, t)}
                          </p>
                        ) : null}
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            className={buttonClass.primary}
                            disabled={!draft.text.trim()}
                            onClick={(event) => {
                              const field = event.currentTarget.closest("div")?.parentElement?.querySelector("textarea");
                              const visible = field instanceof HTMLTextAreaElement ? field.value : draft.text;
                              commitPending(
                                draft.id,
                                item.student.nameAr,
                                item.student.nameEn,
                                assignment?.titleAr ?? "",
                                assignment?.titleEn ?? "",
                                draft.audience,
                                draft.channel,
                                visible,
                              );
                            }}
                          >
                            {t("approveEdited")}
                          </button>
                          <button
                            type="button"
                            className={buttonClass.danger}
                            onClick={() => rejectPending(draft.id, item.student.nameAr, item.student.nameEn, draft.audience)}
                          >
                            {t("rejectDraft")}
                          </button>
                        </div>
                        <p className="mt-3 text-xs leading-5 text-muted">{t("roleNotIdentity")}</p>
                      </div>
                    ) : (
                      <div key={draft.id} className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold">{draft.audience === "parent" ? t("toParent") : t("toStudent")}</p>
                          <StatusBadge label={t("statusRejected")} tone="rejected" />
                          <SourceBadge source={draft.source} label={sourceLabel(draft.source, t)} />
                        </div>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-7">{draft.text}</p>
                        <button type="button" className={`${buttonClass.secondary} mt-3`} disabled={busy !== null} onClick={() => void prepare(item, draft.audience)}>
                          {t("regenerateDraft")}
                        </button>
                      </div>
                    ),
                  )}
                {approvals.map((approval) => (
                  <div key={approval.id} className="mt-4 rounded-2xl bg-sand px-4 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{t("approvedDraft")}</p>
                      <StatusBadge label={t("statusApproved")} tone="approved" />
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-950">{t("simDraft")}</span>
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-teal ring-1 ring-teal/20">{t("notSent")}</span>
                      <SourceBadge source={approval.source ?? "template"} label={sourceLabel(approval.source ?? "template", t)} />
                      {data.channel === "sms" ? <span className="text-xs text-muted">{t("smsReady")}</span> : null}
                    </div>
                    {data.channel === "email" ? (
                      <p className="mt-2 text-sm font-medium">
                        {t("subjectLabel")}: {approval.subject}
                      </p>
                    ) : null}
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7">{approval.text}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <CopyButton
                        text={approval.text}
                        label={t("copyChannel")}
                        copiedLabel={t("copied")}
                        onCopied={() => {
                          setCopiedId(approval.id);
                          logActivity(
                            "copied",
                            `نُسخ نص ${name} ولم يُرسل.`,
                            `Copied the text for ${name}. It was not sent.`,
                          );
                        }}
                      />
                      {copiedId === approval.id ? (
                        <span className="rounded-full bg-teal px-3 py-1 text-sm font-semibold text-white" role="status">
                          {t("copied")}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </li>
            );
          })}
        </ul>
      )}

      {improving.length > 0 ? (
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
          <h2 className="text-lg font-semibold text-emerald-950">{t("improvingTitle")}</h2>
          <p className="mt-1 text-sm text-emerald-950">{t("improvingBody")}</p>
          <ul className="mt-3 space-y-2">
            {improving.map((item) => (
              <li key={item.student.id} className="text-sm font-medium text-emerald-950">
                {tx(locale, item.student.nameAr, item.student.nameEn)} · {fill(t("riskScore"), { score: item.score })}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <LimitsPanel />
    </div>
  );
}

function sourceLabel(source: DraftSource, t: (key: MessageKey) => string) {
  if (source === "openai") return t("sourceBadgeAi");
  if (source === "local") return t("sourceBadgeLocal");
  return t("sourceBadgeTemplate");
}

function blockLabel(reason: NonNullable<TeacherDraft["blockReason"]>, t: (key: MessageKey) => string) {
  if (reason === "unsupported_claim") return t("claimBlocked");
  if (reason === "unknown_fact") return t("unknownFactBlocked");
  if (reason === "other_student") return t("otherStudentBlocked");
  return t("emptyBlocked");
}

function FallbackNote({ fallback, t }: { fallback: ConnectionFallback | null; t: (key: MessageKey) => string }) {
  if (!fallback) return null;
  const key = fallback === "timeout" ? "timeoutNotice" : fallback === "offline" ? "offlineNotice" : "serverNotice";
  return (
    <p className="mt-3 rounded-xl bg-white px-3 py-2 text-sm leading-6 text-ink" role="status">
      {t(key)}
    </p>
  );
}

function StatusBadge({ label, tone }: { label: string; tone: "pending" | "approved" | "rejected" }) {
  const toneClass =
    tone === "approved" ? "bg-teal/10 text-teal" : tone === "rejected" ? "bg-rose-100 text-rose-900" : "bg-amber-100 text-amber-950";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${toneClass}`}>{label}</span>;
}

function SourceBadge({ source, label }: { source: DraftSource; label: string }) {
  const toneClass = source === "openai" ? "bg-navy text-white" : source === "local" ? "bg-white text-ink ring-1 ring-line" : "bg-teal/10 text-teal";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${toneClass}`}>{label}</span>;
}

function Choice({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<[string, string]>;
  onChange: (value: string) => void;
}) {
  const groupId = useId();
  return (
    <div>
      <p className="mb-2 text-sm font-medium" id={groupId}>
        {label}
      </p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby={groupId}>
        {options.map(([id, text]) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={value === id}
            onClick={() => onChange(id)}
            className={value === id ? buttonClass.primary : buttonClass.secondary}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
