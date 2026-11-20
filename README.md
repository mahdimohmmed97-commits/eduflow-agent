# EduFlow Agent

وكيل متابعة الواجبات للمدارس الخاصة ومراكز التدريب في الإمارات والسعودية.  
An assignment follow-up agent for private schools and training centers in the UAE and Saudi Arabia.

The app opens on a short introduction, then a seeded teacher workspace. There is no login. Edits stay in the browser. The agent proposes a daily plan and drafts messages for the teacher to approve and copy. Nothing is sent automatically.

---

## English

### What it is

EduFlow Agent is a demo for Dubai’s Create AI Agents Championship. A coordinator sees who is late across a fictional Dubai school and a fictional Riyadh center, and the agent prepares the next message for approval.

The official submission rules read on 20 November 2026 are inventoried in `SUBMISSION_READINESS.md`. Running this repo locally is a developer path. It is not the judge test link. The deadline stated there is 4 January 2027 at 11:59 AM Dubai time (GST).

If `OPENAI_API_KEY` is set, drafts are written with OpenAI. If it is missing, or the call fails, the same screens fill in with realistic templates so the demo still works. The key stays on the server.

### Features

- A landing screen that states the problem for UAE and Saudi schools
- Arabic interface (right to left) by default, with an English toggle (left to right)
- Due dates judged in Asia/Dubai or Asia/Riyadh, not the browser’s clock
- Classes, students, and assignments, including a submission table: on time, late, or not submitted
- An agent inbox: daily plan, an experimental risk indicator from fictional patterns across assignments, and prepare, edit, reject, or approve
- Tone (formal or friendly) and channel-ready text for WhatsApp, email, or SMS
- A short activity log of what the agent noticed, approved, or copied
- A panel of students who have not submitted, drafts prepared, drafts approved, and measured preparation time. That duration is not time saved for the teacher. Counts from the fictional record are labeled as demo data
- Weekly summary drafts
- Seeded story: 2 classes, 15 students, 6 assignments, one student who recovered and several who did not
- Reset to demo scenario, stored in `localStorage` (no database)
- An About / Limits page: what is built, what is planned, and data handling. It does not show a time-saved figure or a model-cost guess
- A reliability check and an activity log, including refusals

Simulated pieces are labeled in the interface. Class records are fictional. WhatsApp, email, and SMS are text you copy; nothing is delivered. There is no login and no hosted copy. Run the app locally, and use Reset to demo scenario to restore the story. See `docs/JUDGE_DEMO_GUIDE.md`.

The on-time rate on the dashboard is calculated from the fictional seeded record. It is not a school result. The seed file also keeps weekly story points of 38, 46, and 52. Those points are labeled fictional in `lib/seed.ts` and are not shown as an outcome. No minutes-saved figure and no model price are shown. With no API key, drafts use the local template.

### Run locally

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Optional checks:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

`npm test` was added in the Phase 1 safety pass. It checks missing submissions, rejected requests, reminder wording, and the rule that nothing is sent without a teacher, and that nothing is sent even then.

To use the model instead of the built-in templates, copy the sample env file and add a key:

```bash
cp .env.example .env.local
```

```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

Restart `npm run dev` after changing `.env.local`.

### Hosting

This repository is not deployed. Do not treat any URL as a live demo. A future hosted copy would be the same Next.js app, still with no database and no sending. That step is not part of this branch. Judges can run a local copy by following `docs/JUDGE_DEMO_GUIDE.md`.

---

## العربية

### ما هو التطبيق

EduFlow Agent نموذج لبطولة صناعة وكلاء الذكاء الاصطناعي في دبي. ترى المنسقة من تأخر في مدرسة بدبي ومركز في الرياض، ويجهّز الوكيل الرسالة التالية بانتظار موافقتها.

إذا وُجد `OPENAI_API_KEY` تُصاغ المسودة عبر OpenAI. إذا غاب المفتاح أو تعذّر الاتصال، تظهر قوالب واقعية وبالأسماء نفسها حتى يكتمل العرض. المفتاح يبقى على الخادم ولا يصل إلى المتصفح.

### المزايا

- شاشة تعريف تشرح المشكلة والقيمة لمدارس الإمارات والسعودية
- واجهة عربية من اليمين إلى اليسار افتراضياً، مع تبديل إلى الإنجليزية من اليسار إلى اليمين
- مواعيد التسليم تُحسب بتوقيت آسيا/دبي أو آسيا/الرياض، لا بساعة المتصفح
- الصفوف والطلاب والواجبات، مع جدول تسليم: في الموعد، متأخر، أو لم يُسلّم
- صندوق الوكيل: خطة اليوم، مؤشر مخاطر تجريبي من بيانات خيالية عبر الواجبات، ثم تجهيز المسودة وتعديلها أو رفضها أو اعتمادها
- نبرة رسمية أو ودّية، ونص جاهز لواتساب أو البريد أو رسالة قصيرة
- سجل قصير لما رصده الوكيل أو اعتُمد أو نُسخ
- لوحة بعدّ الطلاب الذين لم يسلّموا، والمسودات المجهزة، والمسودات المعتمدة، ومدة التجهيز المقاسة. هذه المدة ليست وقتاً وفّرته المعلمة. أعداد السجل الخيالي معلّمة كبيانات عرض
- ملخص أسبوعي على شكل مسودة
- قصة تجريبية: صفّان، 15 طالباً، 6 واجبات، وطالبة عادت إلى الموعد وطلاب تكرر تأخرهم
- زر إعادة سيناريو العرض. الحفظ في `localStorage` داخل المتصفح، بلا قاعدة بيانات
- صفحة الحدود: ما يعمل، وما هو مخطط، وكيف تُحفظ البيانات. لا تعرض وقتاً موفّراً ولا تخميناً لتكلفة النموذج
- فحص موثوقية وسجل نشاط يشمل حالات التوقف

ما هو محاكى مكتوب في الواجهة. سجلات الصفوف خيالية. واتساب والبريد والرسالة القصيرة نص يُنسخ ولا يُسلَّم. لا تسجيل دخول ولا نسخة مستضافة. شغّل التطبيق محلياً، وزر إعادة سيناريو العرض يعيد القصة. انظر `docs/JUDGE_DEMO_GUIDE.md`.

نسبة التسليم في الموعد على لوحة التحكم محسوبة من السجل الخيالي، وليست نتيجة مدرسة. ملف البذرة يُبقي أيضاً نقاطاً قصصية أسبوعية 38 و46 و52. هي معلّمة كخيال في `lib/seed.ts` ولا تُعرض كنتيجة. لا رقم دقائق موفّرة ولا سعر للنموذج. بلا مفتاح تُستخدم القوالب المحلية.

### التشغيل محلياً

يلزم Node.js 20 أو أحدث.

```bash
npm install
npm run dev
```

ثم افتح [http://localhost:3000](http://localhost:3000).

فحوصات اختيارية:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

أُضيف `npm test` في جولة السلامة الأولى. يفحص الطلاب الذين لم يسلّموا، والطلبات المرفوضة، وصياغة التذكير، وقاعدة أن الرسالة لا تُرسل من غير المعلمة، ولا تُرسل حتى بعد اعتمادها.

لاستخدام النموذج بدل القوالب، انسخ ملف البيئة وأضف المفتاح:

```bash
cp .env.example .env.local
```

```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

أعد تشغيل `npm run dev` بعد تعديل `.env.local`.

### الاستضافة

هذا المستودع غير منشور. لا يوجد رابط عرض حي. نسخة مستضافة لاحقاً ستكون تطبيق Next.js نفسه، بلا قاعدة بيانات وبلا إرسال. هذا الفرع لا ينفّذ ذلك. يمكن للحكام تشغيل نسخة محلية باتباع `docs/JUDGE_DEMO_GUIDE.md`.
