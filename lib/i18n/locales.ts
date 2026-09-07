// Three UI languages, not two (D-05). Hindi is Devanagari, Hinglish is Roman
// Hindi — how most staff already type on WhatsApp — and English is the third.
// Latin digits in all three (D-07); never localise numerals.

export const LOCALES = ["hi", "hi-Latn", "en"] as const;

export type Locale = (typeof LOCALES)[number];

/**
 * The fallback for a signed-in account that has said nothing: their profile's
 * language, else their org's, else this (the org column also defaults to `hi`).
 */
export const DEFAULT_LOCALE: Locale = "hi";

/**
 * What a signed-out visitor sees — the landing page, login, privacy — until
 * they pick from the switch. English, so a browser set to English is not
 * offered a machine translation of a page that already has its own.
 */
export const VISITOR_LOCALE: Locale = "en";

/** The switch reads हिंदी · Hinglish · English, in that order. */
export const LOCALE_LABELS: Record<Locale, string> = {
  hi: "हिंदी",
  "hi-Latn": "Hinglish",
  en: "English",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** Coerce anything (a DB column, a cookie) to a supported locale. */
export function toLocale(value: unknown, fallback: Locale = DEFAULT_LOCALE): Locale {
  return isLocale(value) ? value : fallback;
}

/**
 * The value for <html lang>. Hinglish is Roman-script Hindi, which is
 * `hi-Latn` per BCP-47; the CSS only swaps the Devanagari family on `hi`.
 */
export function htmlLang(locale: Locale): string {
  return locale;
}
