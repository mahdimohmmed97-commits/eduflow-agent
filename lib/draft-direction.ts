import type { Locale } from "@/lib/types";

export type DraftTextDirection = {
  lang: "ar" | "en";
  dir: "rtl" | "ltr";
  align: "right" | "left";
};

export function directionForLocale(locale: Locale): DraftTextDirection {
  if (locale === "ar") return { lang: "ar", dir: "rtl", align: "right" };
  return { lang: "en", dir: "ltr", align: "left" };
}

export function directionForText(text: string): DraftTextDirection {
  const first = text.match(/[\p{L}\p{N}]/u)?.[0] ?? "";
  if (/\p{Script=Arabic}/u.test(first)) return directionForLocale("ar");
  return directionForLocale("en");
}

export function directionForDraft(locale: Locale | undefined, text: string): DraftTextDirection {
  if (locale === "ar" || locale === "en") return directionForLocale(locale);
  return directionForText(text);
}

export function draftTextAttributes(locale: Locale | undefined, text: string) {
  const direction = directionForDraft(locale, text);
  return {
    lang: direction.lang,
    dir: direction.dir,
    style: {
      unicodeBidi: "plaintext" as const,
      textAlign: direction.align,
    },
  };
}
