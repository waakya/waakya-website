import type { Locale } from "@/lib/i18n";
import { TIME_ZONE } from "./time";

/**
 * "Som, 31 Aug" — the date line under a screen title.
 *
 * Latin digits in every language (D-07), so the numbering system is pinned
 * rather than left to the locale's default.
 */
export function formatIndianDate(value: Date | string, locale: Locale): string {
  const tag =
    locale === "hi" ? "hi-IN-u-nu-latn" : "en-IN-u-nu-latn";
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(tag, {
    timeZone: TIME_ZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}
