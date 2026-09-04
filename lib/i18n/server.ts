import { cookies } from "next/headers";
import { DEFAULT_LOCALE, toLocale, type Locale } from "./locales";
import { getDictionary, type Dictionary } from "./dictionary";

export const LOCALE_COOKIE = "vaakya_lang";

/**
 * The locale for this request. A signed-in user's choice lives in the cookie,
 * which is written from their profile on login and by the language switch; a
 * newly invited staff member inherits the org's language, so the cookie is the
 * only thing the render path has to read.
 */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  return toLocale(store.get(LOCALE_COOKIE)?.value, DEFAULT_LOCALE);
}

/** The dictionary for this request. */
export async function getT(): Promise<Dictionary> {
  return getDictionary(await getLocale());
}
