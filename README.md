# EduFlow Agent

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmahdimohmmed97-commits%2Feduflow-agent)

وكيل متابعة الواجبات للمدارس الخاصة ومراكز التدريب في الإمارات والسعودية.  
An assignment follow-up agent for private schools and training centers in the UAE and Saudi Arabia.

The app opens straight into a seeded teacher workspace. There is no login. Edits stay in the browser. Reminder messages and the weekly summary are drafts to review and copy. Nothing is sent automatically.

---

## English

### What it is

EduFlow Agent is a demo for Dubai’s Create AI Agents Championship. A coordinator sees classes, students, and homework, updates who submitted, and asks the agent to draft:

- a reminder to a late or missing student, and a matching note to their parent, in Arabic or English
- a weekly class summary that names who still needs follow-up

If `OPENAI_API_KEY` is set, drafts are written with OpenAI. If it is missing, or the call fails, the same screens fill in with realistic templates so the demo still works.

### Features

- Arabic interface (right to left) by default, with an English toggle (left to right)
- Classes, students, and assignments, including due dates
- A submission table per assignment: submitted, late, or not submitted, plus a teacher note
- Draft-only reminders and a weekly performance summary
- Seeded demo: 2 classes, 15 students, 4 assignments, mixed statuses
- Reset demo data, stored in `localStorage` (no database, safe on Vercel’s read-only filesystem)

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

EduFlow Agent نموذج لبطولة صناعة وكلاء الذكاء الاصطناعي في دبي. يساعد المعلمة أو منسقة المتابعة في المدارس الخاصة ومراكز التدريب على متابعة الواجبات: ترى الصفوف والطلاب، تحدّث حالة التسليم، ثم تطلب من الوكيل صياغة مسودات.

المسودات نوعان:

- رسالة تذكير للطالب المتأخر أو لمن لم يسلّم، ورسالة مقابلة لولي الأمر، بالعربية أو بالإنجليزية
- ملخص أسبوعي لأداء الصف يسمّي من يحتاج متابعة

إذا وُجد `OPENAI_API_KEY` تُصاغ المسودة عبر OpenAI. إذا غاب المفتاح أو تعذّر الاتصال، تظهر قوالب واقعية وبالأسماء نفسها حتى يكتمل العرض.

### المزايا

- واجهة عربية من اليمين إلى اليسار افتراضياً، مع تبديل إلى الإنجليزية من اليسار إلى اليمين
- إضافة الصفوف والطلاب والواجبات مع تاريخ الاستحقاق
- جدول تسليم لكل واجب: تم التسليم، متأخر، أو لم يُسلّم، مع ملاحظة للمعلم
- تذكيرات وملخص أسبوعي على شكل مسودات للمراجعة والنسخ فقط
- بيانات تجريبية جاهزة: صفّان، 15 طالباً، 4 واجبات بحالات مختلطة
- زر إعادة البيانات التجريبية. الحفظ في `localStorage` داخل المتصفح، بلا قاعدة بيانات، ويعمل على نظام ملفات Vercel للقراءة فقط

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
