import { addDays, todayIso } from "@/lib/dates";
import type { Assignment, DemoData, SchoolClass, Student, Submission, SubmissionStatus } from "@/lib/types";

function submission(
  assignmentId: string,
  studentId: string,
  status: SubmissionStatus,
  dueDate: string,
  note = "",
): Submission {
  return {
    assignmentId,
    studentId,
    status,
    note,
    submittedOn: status === "submitted" ? dueDate : status === "late" ? addDays(dueDate, 1) : "",
  };
}

function roster(
  assignmentId: string,
  dueDate: string,
  statuses: Record<string, SubmissionStatus>,
  notes: Record<string, string> = {},
): Submission[] {
  return Object.entries(statuses).map(([studentId, status]) =>
    submission(assignmentId, studentId, status, dueDate, notes[studentId] ?? ""),
  );
}

export function createSeed(today = todayIso()): DemoData {
  const fractionsDue = addDays(today, -12);
  const linearDue = addDays(today, -4);
  const geometryDue = addDays(today, 3);
  const vocabDue = addDays(today, -10);
  const essayDue = addDays(today, -2);
  const readingDue = addDays(today, 5);

  const classes: SchoolClass[] = [
    {
      id: "cls-g8-math",
      nameAr: "الصف الثامن — أ",
      nameEn: "Grade 8 — A",
      subjectAr: "الرياضيات",
      subjectEn: "Mathematics",
      gradeAr: "الصف الثامن",
      gradeEn: "Grade 8",
      schoolAr: "مدرسة النور الدولية",
      schoolEn: "Al Noor International School",
      cityAr: "دبي",
      cityEn: "Dubai",
      timeZone: "Asia/Dubai",
    },
    {
      id: "cls-g10-english",
      nameAr: "الصف العاشر — ب",
      nameEn: "Grade 10 — B",
      subjectAr: "اللغة الإنجليزية",
      subjectEn: "English",
      gradeAr: "الصف العاشر",
      gradeEn: "Grade 10",
      schoolAr: "مركز إشراق للتدريب",
      schoolEn: "Ishraq Training Center",
      cityAr: "الرياض",
      cityEn: "Riyadh",
      timeZone: "Asia/Riyadh",
    },
  ];

  const students: Student[] = [
    student("stu-01", "cls-g8-math", "ليلى المنصوري", "Layla Al Mansoori", "female", "فاطمة المنصوري", "Fatima Al Mansoori", "+971 50 410 2201"),
    student("stu-02", "cls-g8-math", "عمر الحربي", "Omar Al Harbi", "male", "خالد الحربي", "Khalid Al Harbi", "+971 55 302 1184"),
    student("stu-03", "cls-g8-math", "سارة القحطاني", "Sara Al Qahtani", "female", "سعد القحطاني", "Saad Al Qahtani", "+971 52 880 4410"),
    student("stu-04", "cls-g8-math", "يوسف الشامسي", "Youssef Al Shamsi", "male", "ميثاء الشامسي", "Maitha Al Shamsi", "+971 50 667 9033"),
    student("stu-05", "cls-g8-math", "مريم العتيبي", "Maryam Al Otaibi", "female", "نورة العتيبي", "Noura Al Otaibi", "+971 54 219 6608"),
    student("stu-06", "cls-g8-math", "أحمد الزهراني", "Ahmed Al Zahrani", "male", "فهد الزهراني", "Fahad Al Zahrani", "+971 56 774 3312"),
    student("stu-07", "cls-g8-math", "نورة الدوسري", "Noura Al Dosari", "female", "محمد الدوسري", "Mohammed Al Dosari", "+971 50 918 2256"),
    student("stu-08", "cls-g8-math", "عبدالله السعيد", "Abdullah Al Saeed", "male", "هدى السعيد", "Huda Al Saeed", "+971 55 640 7780"),
    student("stu-09", "cls-g10-english", "هند الفيصل", "Hind Al Faisal", "female", "لطيفة الفيصل", "Latifa Al Faisal", "+966 55 430 2210"),
    student("stu-10", "cls-g10-english", "فيصل النعيمي", "Faisal Al Nuaimi", "male", "ناصر النعيمي", "Nasser Al Nuaimi", "+966 50 218 9044"),
    student("stu-11", "cls-g10-english", "جود البلوشي", "Joud Al Balushi", "female", "راشد البلوشي", "Rashid Al Balushi", "+966 54 662 1187"),
    student("stu-12", "cls-g10-english", "سلطان المطيري", "Sultan Al Mutairi", "male", "منيرة المطيري", "Munira Al Mutairi", "+966 53 901 4472"),
    student("stu-13", "cls-g10-english", "ريم الهاشمي", "Reem Al Hashimi", "female", "عبدالله الهاشمي", "Abdullah Al Hashimi", "+966 56 334 7801"),
    student("stu-14", "cls-g10-english", "ماجد العلي", "Majed Al Ali", "male", "حمد العلي", "Hamad Al Ali", "+966 55 127 6639"),
    student("stu-15", "cls-g10-english", "لينا خان", "Lina Khan", "female", "سميرة خان", "Samira Khan", "+966 50 808 5523"),
  ];

  const assignments: Assignment[] = [
    {
      id: "asg-fractions",
      classId: "cls-g8-math",
      titleAr: "الكسور",
      titleEn: "Fractions",
      descriptionAr: "حل تمارين الكسور المتكافئة من 1 إلى 6 في الدفتر.",
      descriptionEn: "Solve equivalent-fraction exercises 1 to 6 in the notebook.",
      dueDate: fractionsDue,
    },
    {
      id: "asg-linear",
      classId: "cls-g8-math",
      titleAr: "المعادلات الخطية",
      titleEn: "Linear Equations",
      descriptionAr: "حل التمارين من 1 إلى 8 مع توضيح خطوات الحل في الدفتر.",
      descriptionEn: "Solve exercises 1 to 8 and show each step in the notebook.",
      dueDate: linearDue,
    },
    {
      id: "asg-geometry",
      classId: "cls-g8-math",
      titleAr: "الأشكال الهندسية",
      titleEn: "Geometric Shapes",
      descriptionAr: "ارسم الأشكال المطلوبة واحسب المحيط والمساحة.",
      descriptionEn: "Draw the requested shapes and calculate the perimeter and area.",
      dueDate: geometryDue,
    },
    {
      id: "asg-vocab",
      classId: "cls-g10-english",
      titleAr: "المفردات: الوحدة الثانية",
      titleEn: "Vocabulary: Unit 2",
      descriptionAr: "اكتب جملة لكل كلمة من قائمة الوحدة الثانية.",
      descriptionEn: "Write one sentence for each word on the unit 2 list.",
      dueDate: vocabDue,
    },
    {
      id: "asg-essay",
      classId: "cls-g10-english",
      titleAr: "مقال: مدينتي",
      titleEn: "Essay: My City",
      descriptionAr: "مقال من 150 كلمة عن مدينتك، مع مقدمة وخاتمة.",
      descriptionEn: "A 150-word essay about your city, with an introduction and a conclusion.",
      dueDate: essayDue,
    },
    {
      id: "asg-reading",
      classId: "cls-g10-english",
      titleAr: "فهم المقروء: الوحدة الثالثة",
      titleEn: "Reading Comprehension: Unit 3",
      descriptionAr: "أجب عن أسئلة النص «A Day in Diriyah» في الوحدة الثالثة.",
      descriptionEn: "Answer the questions on the text “A Day in Diriyah” in unit 3.",
      dueDate: readingDue,
    },
  ];

  const submissions: Submission[] = [
    ...roster(
      "asg-fractions",
      fractionsDue,
      {
        "stu-01": "submitted",
        "stu-02": "submitted",
        "stu-03": "submitted",
        "stu-04": "submitted",
        "stu-05": "not_submitted",
        "stu-06": "late",
        "stu-07": "late",
        "stu-08": "submitted",
      },
      {
        "stu-06": "بدأ بعد غياب قصير",
        "stu-07": "تأخرت في الكسور ثم التزمت بالواجب التالي",
      },
    ),
    ...roster(
      "asg-linear",
      linearDue,
      {
        "stu-01": "submitted",
        "stu-02": "late",
        "stu-03": "late",
        "stu-04": "submitted",
        "stu-05": "not_submitted",
        "stu-06": "not_submitted",
        "stu-07": "submitted",
        "stu-08": "submitted",
      },
      {
        "stu-02": "سُلّم في الحصة التالية",
        "stu-03": "أُرسل بعد نهاية الدوام",
      },
    ),
    ...roster("asg-geometry", geometryDue, {
      "stu-01": "submitted",
      "stu-02": "submitted",
      "stu-03": "not_submitted",
      "stu-04": "not_submitted",
      "stu-05": "not_submitted",
      "stu-06": "not_submitted",
      "stu-07": "submitted",
      "stu-08": "not_submitted",
    }),
    ...roster(
      "asg-vocab",
      vocabDue,
      {
        "stu-09": "submitted",
        "stu-10": "submitted",
        "stu-11": "submitted",
        "stu-12": "not_submitted",
        "stu-13": "submitted",
        "stu-14": "submitted",
        "stu-15": "late",
      },
      { "stu-15": "سُلّمت قائمة المفردات بعد الحصة" },
    ),
    ...roster("asg-essay", essayDue, {
      "stu-09": "submitted",
      "stu-10": "submitted",
      "stu-11": "late",
      "stu-12": "not_submitted",
      "stu-13": "submitted",
      "stu-14": "late",
      "stu-15": "not_submitted",
    }),
    ...roster("asg-reading", readingDue, {
      "stu-09": "submitted",
      "stu-10": "not_submitted",
      "stu-11": "not_submitted",
      "stu-12": "not_submitted",
      "stu-13": "submitted",
      "stu-14": "not_submitted",
      "stu-15": "not_submitted",
    }),
  ];

  return {
    classes,
    students,
    assignments,
    submissions,
    tone: "formal",
    channel: "whatsapp",
    approvals: [],
    drafts: [],
    measuredPrepareMs: 0,
    trend: [
      { weeksAgo: 3, onTimeRate: 38 },
      { weeksAgo: 2, onTimeRate: 46 },
      { weeksAgo: 1, onTimeRate: 52 },
    ],
    activity: [
      {
        id: "act-morning",
        at: `${today}T07:40:00+04:00`,
        kind: "plan",
        textAr: "هذا الصباح راجع الوكيل الواجبات المستحقة في دبي والرياض. رصد 4 طلاب بنمط متكرر و4 حالات فردية، وخفّض مخاطر نورة الدوسري لأنها عادت إلى الموعد. لم تُرسل أي رسالة.",
        textEn: "This morning the agent reviewed due work in Dubai and Riyadh. It flagged 4 repeated patterns and 4 one-off cases, and lowered Noura Al Dosari’s risk because she is back on time. Nothing was sent.",
      },
      {
        id: "act-noura",
        at: `${addDays(today, -1)}T18:05:00+04:00`,
        kind: "plan",
        textAr: "أمس لاحظ الوكيل أن نورة الدوسري تأخرت في «الكسور» ثم سلّمت «المعادلات الخطية» في الموعد.",
        textEn: "Yesterday the agent noticed Noura Al Dosari was late on Fractions and then on time for Linear Equations.",
      },
    ],
  };
}

function student(
  id: string,
  classId: string,
  nameAr: string,
  nameEn: string,
  gender: Student["gender"],
  parentNameAr: string,
  parentNameEn: string,
  parentPhone: string,
): Student {
  return { id, classId, nameAr, nameEn, gender, parentNameAr, parentNameEn, parentPhone };
}
