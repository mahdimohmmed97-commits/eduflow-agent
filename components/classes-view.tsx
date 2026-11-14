"use client";

import { useState } from "react";
import { PlusIcon } from "@/components/icons";
import { ContentSkeleton } from "@/components/skeletons";
import { Button, Field, Modal, PageIntro, buttonClass, inputClass } from "@/components/ui";
import { addClass, addStudent, deleteClass, deleteStudent, useEduFlow } from "@/lib/store";
import { countLabel, fill, pair, tx } from "@/lib/text";
import type { Gender } from "@/lib/types";

type DeleteTarget = { id: string; label: string; kind: "class" | "student" };

const emptyClass = {
  nameAr: "",
  nameEn: "",
  subjectAr: "",
  subjectEn: "",
  gradeAr: "",
  gradeEn: "",
  schoolAr: "",
  schoolEn: "",
  cityAr: "",
  cityEn: "",
};

const emptyStudent = {
  classId: "",
  nameAr: "",
  nameEn: "",
  parentAr: "",
  parentEn: "",
  phone: "",
  gender: "" as Gender | "",
};

export function ClassesView() {
  const { data, locale, t } = useEduFlow();
  const [open, setOpen] = useState<"class" | "student" | null>(null);
  const [pending, setPending] = useState<DeleteTarget | null>(null);
  const [classForm, setClassForm] = useState(emptyClass);
  const [studentForm, setStudentForm] = useState(emptyStudent);
  const [error, setError] = useState("");

  if (!data) return <ContentSkeleton />;

  function closeModal() {
    setOpen(null);
    setError("");
    setClassForm(emptyClass);
    setStudentForm(emptyStudent);
  }

  function submitClass(event: React.FormEvent) {
    event.preventDefault();
    const [nameAr, nameEn] = pair(classForm.nameAr, classForm.nameEn);
    const [subjectAr, subjectEn] = pair(classForm.subjectAr, classForm.subjectEn);
    const [gradeAr, gradeEn] = pair(classForm.gradeAr, classForm.gradeEn);
    const [schoolAr, schoolEn] = pair(classForm.schoolAr, classForm.schoolEn);
    const [cityAr, cityEn] = pair(classForm.cityAr, classForm.cityEn);
    if (!nameAr || !subjectAr || !gradeAr || !schoolAr || !cityAr) {
      setError(t("formError"));
      return;
    }
    addClass({ nameAr, nameEn, subjectAr, subjectEn, gradeAr, gradeEn, schoolAr, schoolEn, cityAr, cityEn });
    closeModal();
  }

  function submitStudent(event: React.FormEvent) {
    event.preventDefault();
    const [nameAr, nameEn] = pair(studentForm.nameAr, studentForm.nameEn);
    const [parentNameAr, parentNameEn] = pair(studentForm.parentAr, studentForm.parentEn);
    if (!studentForm.classId) {
      setError(t("needClass"));
      return;
    }
    if (!nameAr) {
      setError(t("needName"));
      return;
    }
    if (!studentForm.gender) {
      setError(t("needGender"));
      return;
    }
    if (!parentNameAr) {
      setError(t("formError"));
      return;
    }
    addStudent({
      classId: studentForm.classId,
      nameAr,
      nameEn,
      gender: studentForm.gender,
      parentNameAr,
      parentNameEn,
      parentPhone: studentForm.phone.trim(),
    });
    closeModal();
  }

  return (
    <div>
      <PageIntro
        title={t("classesTitle")}
        body={t("classesBody")}
        action={
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => { setError(""); setOpen("class"); }}>
              <PlusIcon className="h-4 w-4" />
              {t("addClass")}
            </Button>
            <Button variant="secondary" onClick={() => { setError(""); setOpen("student"); }} disabled={data.classes.length === 0}>
              <PlusIcon className="h-4 w-4" />
              {t("addStudent")}
            </Button>
          </div>
        }
      />

      {data.classes.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-line bg-paper px-5 py-10 text-center text-sm text-muted">{t("emptyClasses")}</p>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {data.classes.map((schoolClass) => {
            const roster = data.students.filter((item) => item.classId === schoolClass.id);
            return (
              <section key={schoolClass.id} className="rounded-3xl border border-line bg-paper p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gold-2">
                      {tx(locale, schoolClass.schoolAr, schoolClass.schoolEn)} · {tx(locale, schoolClass.cityAr, schoolClass.cityEn)}
                    </p>
                    <h2 className="mt-1 text-xl font-semibold">{tx(locale, schoolClass.nameAr, schoolClass.nameEn)}</h2>
                    <p className="text-sm text-muted">
                      {tx(locale, schoolClass.subjectAr, schoolClass.subjectEn)} · {tx(locale, schoolClass.gradeAr, schoolClass.gradeEn)}
                    </p>
                    <p className="mt-2 text-sm text-muted">{countLabel(roster.length, locale, "student")}</p>
                  </div>
                  <button
                    type="button"
                    className={buttonClass.ghost}
                    onClick={() => setPending({ id: schoolClass.id, kind: "class", label: tx(locale, schoolClass.nameAr, schoolClass.nameEn) })}
                  >
                    {t("delete")}
                  </button>
                </div>
                {roster.length === 0 ? (
                  <p className="mt-4 text-sm text-muted">{t("emptyStudents")}</p>
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[520px] text-sm">
                      <caption className="sr-only">{t("roster")}</caption>
                      <thead className="text-start text-xs text-muted">
                        <tr>
                          <th className="pb-2 font-medium">{t("student")}</th>
                          <th className="pb-2 font-medium">{t("gender")}</th>
                          <th className="pb-2 font-medium">{t("parent")}</th>
                          <th className="pb-2 font-medium">{t("parentPhone")}</th>
                          <th className="pb-2 font-medium">{t("actions")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roster.map((student) => (
                          <tr key={student.id} className="border-t border-line">
                            <td className="py-3 font-medium">{tx(locale, student.nameAr, student.nameEn)}</td>
                            <td className="py-3 text-muted">{student.gender === "female" ? t("girl") : t("boy")}</td>
                            <td className="py-3">{tx(locale, student.parentNameAr, student.parentNameEn)}</td>
                            <td className="py-3" dir="ltr">
                              {student.parentPhone || "—"}
                            </td>
                            <td className="py-3">
                              <button
                                type="button"
                                className={buttonClass.ghost}
                                onClick={() =>
                                  setPending({
                                    id: student.id,
                                    kind: "student",
                                    label: tx(locale, student.nameAr, student.nameEn),
                                  })
                                }
                              >
                                {t("delete")}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      <Modal open={open === "class"} title={t("createClass")} closeLabel={t("close")} onClose={closeModal}>
        <p className="mb-4 text-sm text-muted">{t("fieldHint")}</p>
        <form onSubmit={submitClass} className="grid gap-4 sm:grid-cols-2">
          <Field label={t("nameAr")}><input className={inputClass} value={classForm.nameAr} onChange={(event) => setClassForm({ ...classForm, nameAr: event.target.value })} /></Field>
          <Field label={t("nameEn")}><input className={inputClass} value={classForm.nameEn} onChange={(event) => setClassForm({ ...classForm, nameEn: event.target.value })} /></Field>
          <Field label={t("subjectAr")}><input className={inputClass} value={classForm.subjectAr} onChange={(event) => setClassForm({ ...classForm, subjectAr: event.target.value })} /></Field>
          <Field label={t("subjectEn")}><input className={inputClass} value={classForm.subjectEn} onChange={(event) => setClassForm({ ...classForm, subjectEn: event.target.value })} /></Field>
          <Field label={t("gradeAr")}><input className={inputClass} value={classForm.gradeAr} onChange={(event) => setClassForm({ ...classForm, gradeAr: event.target.value })} /></Field>
          <Field label={t("gradeEn")}><input className={inputClass} value={classForm.gradeEn} onChange={(event) => setClassForm({ ...classForm, gradeEn: event.target.value })} /></Field>
          <Field label={t("schoolAr")}><input className={inputClass} value={classForm.schoolAr} onChange={(event) => setClassForm({ ...classForm, schoolAr: event.target.value })} /></Field>
          <Field label={t("schoolEn")}><input className={inputClass} value={classForm.schoolEn} onChange={(event) => setClassForm({ ...classForm, schoolEn: event.target.value })} /></Field>
          <Field label={t("cityAr")}><input className={inputClass} value={classForm.cityAr} onChange={(event) => setClassForm({ ...classForm, cityAr: event.target.value })} /></Field>
          <Field label={t("cityEn")}><input className={inputClass} value={classForm.cityEn} onChange={(event) => setClassForm({ ...classForm, cityEn: event.target.value })} /></Field>
          {error ? <p className="text-sm text-rose-700 sm:col-span-2" role="alert">{error}</p> : null}
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit">{t("save")}</Button>
            <Button variant="secondary" onClick={closeModal}>{t("cancel")}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={open === "student"} title={t("createStudent")} closeLabel={t("close")} onClose={closeModal}>
        <p className="mb-4 text-sm text-muted">{t("fieldHint")}</p>
        <form onSubmit={submitStudent} className="grid gap-4 sm:grid-cols-2">
          <Field label={t("chooseClass")}>
            <select className={inputClass} value={studentForm.classId} onChange={(event) => setStudentForm({ ...studentForm, classId: event.target.value })}>
              <option value="">{t("selectClass")}</option>
              {data.classes.map((schoolClass) => (
                <option key={schoolClass.id} value={schoolClass.id}>
                  {tx(locale, schoolClass.nameAr, schoolClass.nameEn)}
                </option>
              ))}
            </select>
          </Field>
          <div>
            <p className="mb-1.5 text-sm font-medium">{t("gender")}</p>
            <div className="flex gap-2">
              {(["female", "male"] as const).map((gender) => (
                <button
                  key={gender}
                  type="button"
                  aria-pressed={studentForm.gender === gender}
                  onClick={() => setStudentForm({ ...studentForm, gender })}
                  className={studentForm.gender === gender ? buttonClass.primary : buttonClass.secondary}
                >
                  {gender === "female" ? t("girl") : t("boy")}
                </button>
              ))}
            </div>
          </div>
          <Field label={t("nameAr")}><input className={inputClass} value={studentForm.nameAr} onChange={(event) => setStudentForm({ ...studentForm, nameAr: event.target.value })} /></Field>
          <Field label={t("nameEn")}><input className={inputClass} value={studentForm.nameEn} onChange={(event) => setStudentForm({ ...studentForm, nameEn: event.target.value })} /></Field>
          <Field label={t("parentAr")}><input className={inputClass} value={studentForm.parentAr} onChange={(event) => setStudentForm({ ...studentForm, parentAr: event.target.value })} /></Field>
          <Field label={t("parentEn")}><input className={inputClass} value={studentForm.parentEn} onChange={(event) => setStudentForm({ ...studentForm, parentEn: event.target.value })} /></Field>
          <Field label={t("phone")} hint={t("phoneOptional")}>
            <input className={inputClass} dir="ltr" value={studentForm.phone} onChange={(event) => setStudentForm({ ...studentForm, phone: event.target.value })} />
          </Field>
          {error ? <p className="text-sm text-rose-700 sm:col-span-2" role="alert">{error}</p> : null}
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit">{t("save")}</Button>
            <Button variant="secondary" onClick={closeModal}>{t("cancel")}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={pending !== null} title={t("deleteTitle")} closeLabel={t("close")} onClose={() => setPending(null)}>
        <p className="text-sm leading-6 text-muted">{fill(t("deleteBody"), { name: pending?.label ?? "" })}</p>
        <div className="mt-6 flex gap-2">
          <Button
            variant="danger"
            onClick={() => {
              if (!pending) return;
              if (pending.kind === "class") deleteClass(pending.id);
              else deleteStudent(pending.id);
              setPending(null);
            }}
          >
            {t("confirmDelete")}
          </Button>
          <Button variant="secondary" onClick={() => setPending(null)}>{t("cancel")}</Button>
        </div>
      </Modal>
    </div>
  );
}
