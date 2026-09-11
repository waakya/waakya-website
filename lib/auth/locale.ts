import "server-only";

import { cookies } from "next/headers";
import type { createClient } from "@/lib/supabase/server";
import { toLocale, type Locale } from "@/lib/i18n";
import { LOCALE_COOKIE } from "@/lib/i18n/server";

type Client = Awaited<ReturnType<typeof createClient>>;

/**
 * The language a user sees after signing in, by any route.
 *
 * profile.language, else the org's language, else what they picked on the
 * login screen. A returning user gets the language they chose; a newly
 * invited staff member has none yet and inherits the org's.
 */
export async function resolveUserLocale(
  supabase: Client,
  userId: string,
  chosen: Locale,
): Promise<Locale> {
  const [{ data: profile }, { data: membership }] = await Promise.all([
    supabase.from("profiles").select("language").eq("id", userId).maybeSingle(),
    supabase
      .from("memberships")
      .select("orgs(language)")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);
  if (profile?.language) return toLocale(profile.language, chosen);
  if (membership?.orgs?.language) return toLocale(membership.orgs.language, chosen);
  return chosen;
}

export async function setLocaleCookie(locale: Locale): Promise<void> {
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
