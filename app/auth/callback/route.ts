import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { resolveUserLocale, setLocaleCookie } from "@/lib/auth/locale";
import { safeNextPath } from "@/lib/auth/next";
import { getLocale } from "@/lib/i18n/server";

/**
 * Where Google sends people back after they choose an account.
 *
 * Supabase appends a one-time `code`; it is exchanged here, on the server,
 * against the PKCE verifier that `startGoogleSignIn` left in a cookie. So the
 * session lands in cookies `@supabase/ssr` can read, and a code copied out of
 * somebody else's address bar is useless without that cookie.
 *
 * Every failure goes back to the login screen with a flag the screen turns
 * into a next step, in the reader's language. Nothing internal is shown.
 */
const paramsSchema = z.object({
  code: z.string().min(8).max(512),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const failed = NextResponse.redirect(new URL("/login?oauth=failed", url.origin));

  // Google reports a cancelled or refused consent as `error`, not as a code.
  if (url.searchParams.get("error")) return failed;

  const parsed = paramsSchema.safeParse({ code: url.searchParams.get("code") });
  if (!parsed.success) return failed;

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(parsed.data.code);
  if (error) return failed;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return failed;

  // First sign-in creates the profile row, exactly as the OTP path does.
  // Upsert so a returning user is a no-op.
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({ id: user.id }, { onConflict: "id", ignoreDuplicates: true });
  if (profileError) return failed;

  // Google knows the person's name; email sign-in never asked for one, which
  // left owners as "—". Fill it only while the profile has none, so a name
  // someone set in Settings (or an owner's invite) is never overwritten.
  const meta = user.user_metadata ?? {};
  const googleName = String(meta.full_name ?? meta.name ?? "").trim().slice(0, 60);
  if (googleName) {
    await supabase
      .from("profiles")
      .update({ full_name: googleName })
      .eq("id", user.id)
      .is("full_name", null);
  }

  await setLocaleCookie(await resolveUserLocale(supabase, user.id, await getLocale()));

  const next = safeNextPath(url.searchParams.get("next")) ?? "/aaj";
  return NextResponse.redirect(new URL(next, url.origin));
}
