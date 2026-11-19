"use client";

import { useId, useState } from "react";
import { canDraftParent } from "@/lib/ask";
import { LimitsPanel } from "@/components/limits-panel";
import { Reasoning } from "@/components/reasoning";
import { presentDraft } from "@/lib/channels";
import { runAgent, type ShownSource } from "@/lib/client-agent";
import { formatDate, zoneOf } from "@/lib/dates";
import type { MessageKey } from "@/lib/i18n";
import { dailyActions, improvingStudents, type RiskPattern, type StudentRisk } from "@/lib/risk";
import { logActivity, recordApproval, setChannel, setTone, useEduFlow } from "@/lib/store";
import { givenName, tx, fill } from "@/lib/text";
import { TEACHER, type Audience, type Channel, type Tone } from "@/lib/types";
import { CopyButton, buttonClass, inputClass } from "@/components/ui";

type PendingDraftCard = {
  studentId: string;
  assignmentId: string;
  audience: Audience;
  tone: Tone;
  channel: Channel;
  text: string;
  subject: string;
  source: ShownSource;
};

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
  const [pending, setPending] = useState<Record<string, PendingDraftCard>>({});
  if (!data) return null;
  const record = data;
  const actions = dailyActions(data);
  const improving = improvingStudents(data);
  const highCount = actions.filter((item) => item.level === "high").length;

  function pendingKey(studentId: string, audience: Audience) {
    return `${studentId}:${audience}`;
  }

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
    setPending((current) => ({
      ...current,
      [pendingKey(item.student.id, audience)]: {
        studentId: item.student.id,
        assignmentId: assignment.id,
        audience,
        tone: record.tone,
        channel: record.channel,
        text: presented.text,
        subject: presented.subject,
        source: outcome.source,
      },
    }));
    logActivity(
      "plan",
      `جُهزت مسودة ${channelAr} لـ${whoAr} عن «${assignment.titleAr}». لم تُعتمد ولم تُرسل.`,
      `Prepared a ${channelEn} draft for ${whoEn} about “${assignment.titleEn}”. It is not approved and was not sent.`,
    );
    if (manageBusy) setBusy(null);
  }

  function rejectPending(studentId: string, audience: Audience, studentNameAr: string, studentNameEn: string) {
    setPending((current) => {
      const next = { ...current };
      delete next[pendingKey(studentId, audience)];
      return next;
    });
    const whoAr = audience === "parent" ? `ولي أمر ${studentNameAr}` : studentNameAr;
    const whoEn = audience === "parent" ? `${studentNameEn}'s parent` : studentNameEn;
    logActivity("refused", `رُفضت مسودة ${whoAr}. لم تُعتمد ولم تُرسل.`, `Rejected the draft for ${whoEn}. It was not approved and was not sent.`);
  }

  function commitPending(studentId: string, audience: Audience, studentNameAr: string, studentNameEn: string, titleAr: string, titleEn: string) {
    const staged = pending[pendingKey(studentId, audience)];
    if (!staged || !staged.text.trim()) return;
    const channelAr = staged.channel === "email" ? "بريد" : staged.channel === "sms" ? "رسالة قصيرة" : "واتساب";
    const channelEn = staged.channel === "email" ? "email" : staged.channel === "sms" ? "SMS" : "WhatsApp";
    const whoAr = audience === "parent" ? `ولي أمر ${studentNameAr}` : studentNameAr;
    const whoEn = audience === "parent" ? `${studentNameEn}'s parent` : studentNameEn;
    recordApproval({
      studentId,
      assignmentId: staged.assignmentId,
      tone: staged.tone,
      channel: staged.channel,
      audience,
      text: staged.text,
      subject: staged.subject,
      source: staged.source,
      actor: "teacher",
      textAr: `اعتمدت مسودة ${channelAr} لـ${whoAr} عن «${titleAr}». لم تُرسل.`,
      textEn: `Approved a ${channelEn} draft for ${whoEn} about “${titleEn}”. It was not sent.`,
    });
    setPending((current) => {
      const next = { ...current };
      delete next[pendingKey(studentId, audience)];
      return next;
    });
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
                {(["parent", "student"] as const).map((audience) => {
                  const staged = pending[`${item.student.id}:${audience}`];
                  if (!staged || staged.tone !== data.tone || staged.channel !== data.channel || staged.assignmentId !== issue?.assignmentId) {
                    return null;
                  }
                  return (
                    <div key={audience} className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
                      <p className="text-sm font-semibold">{t("pendingTitle")}</p>
                      <p className="mt-1 text-sm leading-6 text-amber-950">{t("pendingHint")}</p>
                      <label className="mt-3 block text-sm font-medium" htmlFor={`draft-${item.student.id}-${audience}`}>
                        {t("draftEditorLabel")} · {audience === "parent" ? t("approveParent") : t("approveStudent")}
                      </label>
                      <textarea
                        id={`draft-${item.student.id}-${audience}`}
                        className={`${inputClass} mt-1.5 min-h-40`}
                        value={staged.text}
                        onChange={(event) => {
                          const value = event.target.value;
                          setPending((current) => {
                            const key = `${item.student.id}:${audience}`;
                            const existing = current[key];
                            if (!existing) return current;
                            return { ...current, [key]: { ...existing, text: value } };
                          });
                        }}
                      />
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          className={buttonClass.primary}
                          disabled={!staged.text.trim()}
                          onClick={() =>
                            commitPending(
                              item.student.id,
                              audience,
                              item.student.nameAr,
                              item.student.nameEn,
                              assignment?.titleAr ?? "",
                              assignment?.titleEn ?? "",
                            )
                          }
                        >
                          {t("approveEdited")}
                        </button>
                        <button
                          type="button"
                          className={buttonClass.secondary}
                          onClick={() => rejectPending(item.student.id, audience, item.student.nameAr, item.student.nameEn)}
                        >
                          {t("rejectDraft")}
                        </button>
                      </div>
                    </div>
                  );
                })}
                {approvals.map((approval) => (
                  <div key={approval.id} className="mt-4 rounded-2xl bg-sand px-4 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{t("approvedDraft")}</p>
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-950">{t("simDraft")}</span>
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-teal ring-1 ring-teal/20">{t("notSent")}</span>
                      <span className="text-xs text-muted">
                        {approval.source === "openai" ? t("sourceOpenAI") : approval.source === "local" ? t("sourceLocal") : t("sourceTemplate")}
                      </span>
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
