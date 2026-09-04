import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_LOCALE, isLocale, toLocale, type Locale } from "./locales";
import { getDictionary, type Dictionary } from "./dictionary";

export const LOCALE_COOKIE = "vaakya_lang";

/**
 * The locale for this request.
 *
 * The cookie is the fast path and holds the person's own choice. When it is
 * missing — a new device, cleared site data, a session created some other way —
 * we fall back to what the account says: their profile language, else their
 * org's, which is what a newly invited staff member inherits (owner decision 3).
 *
 * The fallback only runs when a Supabase auth cookie is actually present, so a
 * signed-out page like /login still costs zero queries.
 */
export const getLocale = cache(async (): Promise<Locale> => {
  const store = await cookies();

  const chosen = store.get(LOCALE_COOKIE)?.value;
  if (isLocale(chosen)) return chosen;

  const signedIn = store
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"));
  if (!signedIn) return DEFAULT_LOCALE;

  return localeFromAccount();
});

/** profile.language, else the org's language, else the app default. */
async function localeFromAccount(): Promise<Locale> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return DEFAULT_LOCALE;

  const [{ data: profile }, { data: membership }] = await Promise.all([
    supabase.from("profiles").select("language").eq("id", user.id).maybeSingle(),
    supabase
      .from("memberships")
      .select("orgs(language)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  if (profile?.language) return toLocale(profile.language);
  if (membership?.orgs?.language) return toLocale(membership.orgs.language);
  return DEFAULT_LOCALE;
}

/** The dictionary for this request. */
export async function getT(): Promise<Dictionary> {
  return getDictionary(await getLocale());
}
