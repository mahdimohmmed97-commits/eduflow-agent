import { canDraftParent, interpretAsk } from "@/lib/ask";
import { isPastDue, todayIso } from "@/lib/dates";
import { assessStudent } from "@/lib/risk";
import { createSeed } from "@/lib/seed";
import { pastDueTally } from "@/lib/stats";

export type CheckResult = {
  id: string;
  pass: boolean;
  textAr: string;
  textEn: string;
};

export function runReliabilityChecks(): CheckResult[] {
  const instant = new Date("2026-11-16T22:30:00Z");
  const dubai = todayIso("Asia/Dubai", instant);
  const riyadh = todayIso("Asia/Riyadh", instant);
  const data = createSeed("2026-11-16");
  const maryam = data.students.find((student) => student.id === "stu-05");
  const noura = data.students.find((student) => student.id === "stu-07");
  const maryamRisk = maryam ? assessStudent(data, maryam) : null;
  const nouraRisk = noura ? assessStudent(data, noura) : null;
  const rate = pastDueTally(data).rate;
  const dueToday = isPastDue("2026-11-17", "Asia/Dubai", instant);

  return [
    {
      id: "gulf-day",
      pass: dubai === "2026-11-17" && riyadh === "2026-11-17" && !dueToday,
      textAr: `يوم الخليج عند 22:30 بالتوقيت العالمي: دبي ${dubai}، الرياض ${riyadh}. المستحق في ذلك اليوم ليس متأخراً.`,
      textEn: `Gulf day at 22:30 UTC: Dubai ${dubai}, Riyadh ${riyadh}. Work due that day is not past due.`,
    },
    {
      id: "maryam-risk",
      pass: Boolean(maryamRisk && maryamRisk.score >= 60 && maryamRisk.pattern === "repeated"),
      textAr: `مريم العتيبي: المخاطر ${maryamRisk?.score ?? "—"} والنمط ${maryamRisk?.pattern ?? "—"}. المتوقع عاجل ومتكرر.`,
      textEn: `Maryam Al Otaibi: risk ${maryamRisk?.score ?? "—"}, pattern ${maryamRisk?.pattern ?? "—"}. Expected urgent and repeated.`,
    },
    {
      id: "noura-improving",
      pass: nouraRisk?.pattern === "improving",
      textAr: `نورة الدوسري: النمط ${nouraRisk?.pattern ?? "—"}. المتوقع أن الوكيل لا يرسل لها رسالة.`,
      textEn: `Noura Al Dosari: pattern ${nouraRisk?.pattern ?? "—"}. The agent is expected to send her no message.`,
    },
    {
      id: "live-rate",
      pass: rate !== null && rate > 0 && rate < 100,
      textAr: `نسبة التسليم في الموعد محسوبة من سجل العرض الخيالي: ${rate ?? "—"}%. ليست نتيجة مدرسة.`,
      textEn: `On-time rate calculated from the fictional demo record: ${rate ?? "—"}%. This is not a school result.`,
    },
    {
      id: "empty-ask",
      pass: interpretAsk("  ") === "empty",
      textAr: "طلب فارغ: الوكيل يسأل عن واجب أو طالب ولا يخترع مهمة.",
      textEn: "An empty request: the agent asks for an assignment or a student and does not invent a task.",
    },
    {
      id: "out-of-scope",
      pass: interpretAsk("احجز طاولة في مطعم الليلة") === "out_of_scope",
      textAr: "طلب خارج المهمة (حجز مطعم): الوكيل يرفض ولا يكتب رسالة.",
      textEn: "An out-of-scope request (book a restaurant): the agent refuses and writes no message.",
    },
    {
      id: "in-scope",
      pass: interpretAsk("ذكّر ولي أمر من لم يسلّم") === "followup",
      textAr: "طلب متابعة واجبات: الوكيل يعيده إلى خطة اليوم.",
      textEn: "A homework follow-up request: the agent sends it back to today’s plan.",
    },
    {
      id: "missing-parent",
      pass: canDraftParent("") === false && canDraftParent("نورة العتيبي") === true,
      textAr: "بلا اسم ولي أمر لا تُكتب مسودة ولي الأمر. الاسم الموجود يكفي.",
      textEn: "With no parent name, no parent draft is written. A real name is enough.",
    },
  ];
}
