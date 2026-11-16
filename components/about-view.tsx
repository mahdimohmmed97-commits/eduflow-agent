"use client";

import { PageIntro } from "@/components/ui";
import { useEduFlow } from "@/lib/store";

const copy = {
  ar: {
    title: "عن الوكيل وحدوده",
    body: "ما يعمل اليوم، وما هو مخطط، وأين يتوقف الإنسان. الأرقام المعلّمة كتقدير ليست نتيجة اختبار.",
    built: "يعمل الآن",
    planned: "مخطط ولم يُبنَ",
    limits: "حدود معروفة",
    data: "البيانات",
    cost: "تكلفة المهمة",
    oversight: "أين يتدخل الإنسان",
    access: "وصول الحكام",
    builtItems: [
      "مهمة واحدة من البداية إلى النتيجة: رصد المتأخر، قرار من يُراسَل، مسودة، ثم اعتماد.",
      "درجة مخاطر من نمط التسليم عبر الواجبات، مع استثناء من عاد إلى الموعد.",
      "نبرة رسمية أو ودّية، ونص واتساب أو بريد أو رسالة قصيرة.",
      "توقيت آسيا/دبي وآسيا/الرياض في حكم الاستحقاق.",
      "رفض الطلب الفارغ أو الخارج عن المهمة، ورفض مسودة ولي الأمر إذا غاب اسمه.",
      "فحص موثوقية داخل الصفحة، وسجل لما اعتُمد أو رُفض.",
      "قالب محلي يعمل بلا مفتاح، ونموذج OpenAI اختياري على الخادم.",
    ],
    plannedItems: [
      "إرسال حقيقي إلى واتساب أو بريد أو رسالة قصيرة.",
      "ربط بسجل مدرسة حقيقي.",
      "حسابات لأكثر من معلم، وصلاحيات.",
      "رد ولي الأمر داخل المنتج.",
      "قياس وقت المعلمة مع مستخدمين حقيقيين. رقم الدقائق الموفّرة تقدير.",
    ],
    limitItems: [
      "لا يرسل أي رسالة، حتى بعد الاعتماد.",
      "لا يخترع درجات ولا يتصل بولي الأمر.",
      "العربية والإنجليزية فقط.",
      "دبي والرياض اليوم كلاهما UTC+4، لذلك يطابق يومهما. الكود يطلب منطقة الصف صراحة حتى لا يعتمد على ساعة الجهاز.",
      "إذا تعذّر النموذج، تُستخدم القوالب وتُعلَّم النتيجة بذلك.",
    ],
    dataItems: [
      "الأسماء والهواتف في العرض خيالية.",
      "تعديلاتك تبقى في localStorage على هذا المتصفح. زر الإعادة يمسحها.",
      "لا قاعدة بيانات، ومفتاح النموذج لا يصل إلى المتصفح.",
      "عند استخدام النموذج يُرسل إلى الخادم اسم الطالب وولي الأمر والمادة والحالة. رقم الهاتف لا يُرسل.",
    ],
    costItems: [
      "بلا مفتاح نموذج: تكلفة الصياغة صفر. هذا مسار العرض الافتراضي.",
      "مع gpt-4o-mini: تقدير أقل من 0.01 درهم لمسودة طالب وولي أمر، وأقل من 0.05 درهم لخطة من أربع مسودات عاجلة. تقدير من أسعار النموذج العلنية، لا فاتورة مقاسة.",
      "الوقت الموفّر (6 دقائق للمسودة) تقدير لم يُقاس مع معلمين.",
      "نسبة التسليم في الموعد محسوبة من سجل العرض، وليست تقدير سوق.",
    ],
    oversightItems: [
      "كل مسودة تنتظر زر الاعتماد.",
      "النسخ لا يرسل.",
      "المعلمة تغيّر الحالة والنبرة والقناة واللغة.",
      "الطلب الغامض أو الخارج عن المهمة يتوقف ويُسجَّل.",
    ],
    accessBody: "لا تسجيل دخول. افتح الرابط، وزر إعادة البيانات التجريبية يعيد قصة العرض إن تغيّر شيء. اتركوا الصفحة متاحة حتى نهاية البطولة.",
  },
  en: {
    title: "About the agent and its limits",
    body: "What works today, what is only planned, and where a person steps in. Figures marked as estimates are not test results.",
    built: "Working now",
    planned: "Planned, not built",
    limits: "Known limits",
    data: "Data",
    cost: "Cost per task",
    oversight: "Where a person steps in",
    access: "Judge access",
    builtItems: [
      "One task from trigger to result: find who is late, decide who is contacted, draft, then wait for approval.",
      "A risk score from the pattern across assignments, skipping a student who is back on time.",
      "Formal or friendly tone, and WhatsApp, email, or SMS text.",
      "Asia/Dubai and Asia/Riyadh when judging a due date.",
      "Refusal of an empty or out-of-scope request, and of a parent draft when the parent name is missing.",
      "An in-page reliability check, and a log of approvals and refusals.",
      "A local template with no key, and optional OpenAI on the server.",
    ],
    plannedItems: [
      "Real delivery to WhatsApp, email, or SMS.",
      "A connection to a real school record.",
      "Accounts for more than one teacher, and permissions.",
      "A parent reply inside the product.",
      "A timed study with real teachers. The minutes-saved figure is an estimate.",
    ],
    limitItems: [
      "It sends no message, even after approval.",
      "It does not invent marks or call a parent.",
      "Arabic and English only.",
      "Dubai and Riyadh are both UTC+4 today, so the calendar day matches. The code still asks for the class zone instead of the device clock.",
      "If the model fails, templates are used and the result says so.",
    ],
    dataItems: [
      "Names and phone numbers in the demo are fictional.",
      "Your edits stay in localStorage on this browser. Reset clears them.",
      "There is no database, and the model key never reaches the browser.",
      "When the model is used, the server sends the student name, parent name, subject, and status. The phone number is not sent.",
    ],
    costItems: [
      "With no model key, drafting costs nothing. That is the default demo path.",
      "With gpt-4o-mini: an estimate under 0.01 AED for one student-and-parent draft, and under 0.05 AED for a plan of four urgent drafts. Estimated from public model prices, not a measured bill.",
      "Time saved (6 minutes a draft) is an estimate and was not measured with teachers.",
      "The on-time rate is calculated from the demo record. It is not a market estimate.",
    ],
    oversightItems: [
      "Every draft waits for the approve button.",
      "Copying does not send.",
      "The teacher changes status, tone, channel, and language.",
      "An unclear or out-of-scope request stops and is logged.",
    ],
    accessBody: "No login. Open the link. Reset demo data restores the story if anything changed. Keep the page available until the championship ends.",
  },
} as const;

export function AboutView() {
  const { locale } = useEduFlow();
  const text = copy[locale];
  const sections = [
    [text.built, text.builtItems],
    [text.planned, text.plannedItems],
    [text.limits, text.limitItems],
    [text.data, text.dataItems],
    [text.cost, text.costItems],
    [text.oversight, text.oversightItems],
  ] as const;

  return (
    <div>
      <PageIntro eyebrow="EduFlow Agent" title={text.title} body={text.body} />
      <div className="grid gap-4 lg:grid-cols-2">
        {sections.map(([title, items]) => (
          <section key={title} className="rounded-3xl border border-line bg-paper p-5 shadow-sm">
            <h2 className="text-lg font-semibold">{title}</h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-ink">
              {items.map((item) => (
                <li key={item} className="rounded-2xl bg-sand px-3 py-2">
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <section className="mt-4 rounded-3xl border border-line bg-paper p-5 shadow-sm">
        <h2 className="text-lg font-semibold">{text.access}</h2>
        <p className="mt-2 text-sm leading-7 text-muted">{text.accessBody}</p>
      </section>
    </div>
  );
}
