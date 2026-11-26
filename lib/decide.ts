import { dailyActions, improvingStudents, type StudentRisk } from "@/lib/risk";
import type { DemoData } from "@/lib/types";

export type TraceStep = {
  id: "goal" | "steps" | "tools" | "decision" | "action" | "result";
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
};

function namesAr(items: StudentRisk[]): string {
  if (items.length === 0) return "لا أحد";
  return items.map((item) => item.student.nameAr).join("، ");
}

function namesEn(items: StudentRisk[]): string {
  if (items.length === 0) return "nobody";
  return items.map((item) => item.student.nameEn).join(", ");
}

export function followUpTrace(data: DemoData): TraceStep[] {
  const actions = dailyActions(data);
  const high = actions.filter((item) => item.level === "high");
  const watch = actions.filter((item) => item.level === "watch");
  const improving = improvingStudents(data);
  const approved = data.approvals.length;
  const waiting = high.filter(
    (item) =>
      !data.approvals.some(
        (entry) => entry.studentId === item.student.id && entry.assignmentId === item.latestIssue?.assignmentId,
      ),
  ).length;

  return [
    {
      id: "goal",
      titleAr: "الهدف",
      titleEn: "Goal",
      bodyAr: "تجهيز متابعة أولياء أمور الطلاب الذين تكرر غياب تسليمهم، من غير إرسال أي رسالة.",
      bodyEn: "Prepare parent follow-ups for students who keep missing work, and send nothing.",
    },
    {
      id: "steps",
      titleAr: "الخطوات التي اختارها",
      titleEn: "Steps chosen",
      bodyAr: "يحسب مؤشراً تجريبياً من الواجبات المستحقة في بيانات محاكاة خيالية، وليس تقييماً حقيقياً. العاجل يحصل على مسودة لولي الأمر. الحالة الفردية تبقى ملاحظة. من عاد إلى الموعد لا تصله رسالة. التوقف هنا للموافقة.",
      bodyEn: "Calculate an experimental indicator from due assignments in fictional simulated data, not a real assessment. Urgent cases get a parent draft. A single case stays on watch. Someone back on time gets no message. Stop here for approval.",
    },
    {
      id: "tools",
      titleAr: "البيانات والأدوات",
      titleEn: "Data and tools",
      bodyAr: "سجل التسليم في هذا المتصفح، وهو بيانات محاكاة. توقيت الصف آسيا/دبي أو آسيا/الرياض. الصياغة قالب محلي، أو OpenAI من الخادم إذا وُجد المفتاح. إرسال واتساب والبريد والرسالة القصيرة غير موصول.",
      bodyEn: "The submission record in this browser, which is simulated data. Class time is Asia/Dubai or Asia/Riyadh. Wording comes from a local template, or from OpenAI on the server when a key exists. WhatsApp, email, and SMS are not connected.",
    },
    {
      id: "decision",
      titleAr: "القرار",
      titleEn: "Decision",
      bodyAr: `عاجل: ${namesAr(high)}. ملاحظة: ${namesAr(watch)}. بلا رسالة: ${namesAr(improving)}.`,
      bodyEn: `Urgent: ${namesEn(high)}. Watch: ${namesEn(watch)}. No message: ${namesEn(improving)}.`,
    },
    {
      id: "action",
      titleAr: "الإجراء",
      titleEn: "Action",
      bodyAr: "يكتب المسودة بالنبرة والقناة اللتين تختارهما المعلمة، ثم ينتظر الاعتماد. النسخ لا يرسل.",
      bodyEn: "It writes the draft in the tone and channel the teacher chooses, then waits. Copying does not send.",
    },
    {
      id: "result",
      titleAr: "النتيجة",
      titleEn: "Result",
      bodyAr: `${approved} مسودة معتمدة في هذا المتصفح. ${waiting} حالات عاجلة ما زالت بانتظار موافقتك. الرسائل المُرسلة: 0.`,
      bodyEn: `${approved} drafts approved in this browser. ${waiting} urgent cases still wait for you. Messages sent: 0.`,
    },
  ];
}
