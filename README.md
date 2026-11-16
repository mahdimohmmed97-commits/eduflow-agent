# EduFlow Agent

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmahdimohmmed97-commits%2Feduflow-agent)

وكيل متابعة الواجبات للمدارس الخاصة ومراكز التدريب في الإمارات والسعودية.  
An assignment follow-up agent for private schools and training centers in the UAE and Saudi Arabia.

The app opens on a short introduction, then a seeded teacher workspace. There is no login. Edits stay in the browser. The agent proposes a daily plan and drafts messages for the teacher to approve and copy. Nothing is sent automatically.

---

## English

### What it is

EduFlow Agent is a demo for Dubai’s Create AI Agents Championship. A coordinator sees who is late across a Dubai school and a Riyadh center, and the agent prepares the next message for approval.

If `OPENAI_API_KEY` is set, drafts are written with OpenAI. If it is missing, or the call fails, the same screens fill in with realistic templates so the demo still works. The key stays on the server.

### Features

- A landing screen that states the problem and the value for UAE and Saudi schools
- Arabic interface (right to left) by default, with an English toggle (left to right)
- Due dates judged in Asia/Dubai or Asia/Riyadh, not the browser’s clock
- Classes, students, and assignments, including a submission table: on time, late, or not submitted
- An agent inbox: daily plan, risk scores from patterns across assignments, and one-click approval
- Tone (formal or friendly) and channel-ready text for WhatsApp, email, or SMS
- A short activity log of what the agent noticed, approved, or copied
- Dashboard impact: estimated time saved, and an on-time submission trend
- Weekly summary drafts
- Seeded story: 2 classes, 15 students, 6 assignments, one student who recovered and several who did not
- Reset demo data, stored in `localStorage` (no database, safe on Vercel’s read-only filesystem)
- An About / Limits page: what is built, what is planned, data handling, and an estimated cost per task
- A reliability check and an activity log, including refusals

Simulated pieces are labeled in the interface. Class records are fictional. WhatsApp, email, and SMS are text you copy; nothing is delivered. There is no login. Open the site, and use Reset demo data to restore the story. Judges can keep using that link for the whole championship.

The on-time rate is calculated from the seeded record. Minutes saved and the model cost are estimates, marked as such. With no API key, one follow-up draft costs nothing to generate. With `gpt-4o-mini`, a student-and-parent draft is estimated at under 0.01 AED from public prices, not from a measured bill.

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
npm run build
```

To use the model instead of the built-in templates, copy the sample env file and add a key:

```bash
cp .env.example .env.local
```

```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

Restart `npm run dev` after changing `.env.local`.

### Deploy on Vercel

Use the button at the top, or open:

https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmahdimohmmed97-commits%2Feduflow-agent

Vercel detects Next.js. No `vercel.json` and no database are required. After the project exists, you can add `OPENAI_API_KEY` under Project Settings → Environment Variables. Leave it empty to keep the template drafts.

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
- صندوق الوكيل: خطة اليوم، درجة مخاطر من نمط الطالب عبر الواجبات، واعتماد بضغطة واحدة
- نبرة رسمية أو ودّية، ونص جاهز لواتساب أو البريد أو رسالة قصيرة
- سجل قصير لما رصده الوكيل أو اعتُمد أو نُسخ
- أثر على لوحة التحكم: تقدير الوقت الموفّر، ومنحنى التسليم في الموعد
- ملخص أسبوعي على شكل مسودة
- قصة تجريبية: صفّان، 15 طالباً، 6 واجبات، وطالبة عادت إلى الموعد وطلاب تكرر تأخرهم
- زر إعادة البيانات التجريبية. الحفظ في `localStorage` داخل المتصفح، بلا قاعدة بيانات، ويعمل على نظام ملفات Vercel للقراءة فقط
- صفحة الحدود: ما يعمل، وما هو مخطط، وكيف تُحفظ البيانات، وتقدير تكلفة المهمة
- فحص موثوقية وسجل نشاط يشمل حالات التوقف

ما هو محاكى مكتوب في الواجهة. سجلات الصفوف خيالية. واتساب والبريد والرسالة القصيرة نص يُنسخ ولا يُسلَّم. لا تسجيل دخول. افتح الموقع، وزر إعادة البيانات التجريبية يعيد القصة. يمكن للحكام إبقاء الرابط مفتوحاً حتى نهاية البطولة.

نسبة التسليم في الموعد محسوبة من السجل التجريبي. الدقائق الموفّرة وتكلفة النموذج تقديرات ومُعلَّمة كذلك. بلا مفتاح، صياغة المسودة لا تكلف شيئاً. مع `gpt-4o-mini` تقدير مسودة الطالب وولي الأمر أقل من 0.01 درهم حسب الأسعار العلنية، لا حسب فاتورة مقاسة.

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
npm run build
```

لاستخدام النموذج بدل القوالب، انسخ ملف البيئة وأضف المفتاح:

```bash
cp .env.example .env.local
```

```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

أعد تشغيل `npm run dev` بعد تعديل `.env.local`.

### النشر على Vercel

استخدم زر Deploy with Vercel في أعلى هذه الصفحة، أو افتح:

https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmahdimohmmed97-commits%2Feduflow-agent

يتعرّف Vercel على Next.js تلقائياً. لا حاجة إلى `vercel.json` ولا إلى قاعدة بيانات. بعد إنشاء المشروع يمكن إضافة `OPENAI_API_KEY` من Project Settings ثم Environment Variables. اتركه فارغاً إن أردت الإبقاء على القوالب الجاهزة.
