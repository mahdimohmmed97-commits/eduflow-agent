import assert from "node:assert/strict";
import { test } from "node:test";
import { dictionary } from "@/lib/i18n";
import { directionForDraft, directionForLocale, draftTextAttributes } from "@/lib/draft-direction";

test("a draft uses its own language for direction, even when the page language differs", () => {
  assert.deepEqual(directionForLocale("ar"), { lang: "ar", dir: "rtl", align: "right" });
  assert.deepEqual(directionForLocale("en"), { lang: "en", dir: "ltr", align: "left" });

  const arabicInEnglishPage = draftTextAttributes("ar", "السلام عليكم منيرة المطيري،");
  assert.equal(arabicInEnglishPage.lang, "ar");
  assert.equal(arabicInEnglishPage.dir, "rtl");
  assert.equal(arabicInEnglishPage.style.textAlign, "right");
  assert.equal(arabicInEnglishPage.style.unicodeBidi, "plaintext");

  const englishInArabicPage = draftTextAttributes("en", "Hello Munira Al Mutairi,");
  assert.equal(englishInArabicPage.lang, "en");
  assert.equal(englishInArabicPage.dir, "ltr");
  assert.equal(englishInArabicPage.style.textAlign, "left");
  assert.equal(englishInArabicPage.style.unicodeBidi, "plaintext");

  assert.equal(directionForDraft("ar", "Hello Munira,").dir, "rtl");
  assert.equal(directionForDraft("en", "السلام عليكم،").dir, "ltr");
  assert.equal(directionForDraft(undefined, "السلام عليكم،").align, "right");
  assert.equal(directionForDraft(undefined, "Hello Munira,").align, "left");
});

test("risk scores and levels are labelled as an experimental indicator from fictional data", () => {
  for (const key of ["riskScore", "riskHigh", "riskWatch", "riskSteady", "riskDemoLabel"] as const) {
    assert.match(dictionary.ar[key], /تجريب/);
    assert.match(dictionary.ar[key], /خيال/);
    assert.match(dictionary.en[key], /[Ee]xperimental/);
    assert.match(dictionary.en[key], /fictional/);
    assert.equal(/[\u0600-\u06FF]/.test(dictionary.en[key]), false);
  }
  assert.match(dictionary.ar.riskDemoLabel, /ليست تقييماً حقيقياً/);
  assert.match(dictionary.en.riskDemoLabel, /not a real assessment/);
});
