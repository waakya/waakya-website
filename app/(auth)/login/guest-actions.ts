"use server";

import { z } from "zod";
import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { GUEST_NAME, GUEST_USER, guestLoginEnabled } from "@/lib/auth/guest";
import { localeSchema, fail, ok, type ActionResult } from "@/lib/validation";
import { getDictionary, type Locale } from "@/lib/i18n";
import { LOCALE_COOKIE } from "@/lib/i18n/server";

const inputSchema = z.object({ locale: localeSchema });

/**
 * Sign in as the guest account without an OTP.
 *
 * Fast path: a password sign-in against the guest user. The first time on a
 * project the user does not exist yet, so the service-role client creates it
 * (already confirmed) and mints a magic-link token that is verified right here
 * on the server — the same exchange `/auth/confirm` does — so the session
 * lands in cookies. After that first time the password path is enough and the
 * service-role key is not needed.
 */
export async function guestLogin(input: unknown): Promise<ActionResult> {
  const parsed = inputSchema.safeParse(input);
  const locale: Locale = parsed.success ? parsed.data.locale : "en";
  const c = copy(locale);

  if (!guestLoginEnabled()) return fail(c.disabled);

  const supabase = await createClient();

  const { error: passwordError } = await supabase.auth.signInWithPassword(
    GUEST_USER,
  );

  if (passwordError) {
    const admin = createAdminClient();
    if (!admin) return fail(c.needsKey);

    // Create the guest if it is missing. "Already registered" is fine: the
    // password may have been changed by hand, and the link below still works.
    const { error: createError } = await admin.auth.admin.createUser({
      email: GUEST_USER.email,
      password: GUEST_USER.password,
      email_confirm: true,
      user_metadata: { full_name: GUEST_NAME },
    });
    if (createError && !/already|exists/i.test(createError.message)) {
      return fail(c.generic);
    }

    const { data: link, error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: GUEST_USER.email,
    });
    const hash = link?.properties?.hashed_token;
    if (linkError || !hash) return fail(c.generic);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      type: "magiclink",
      token_hash: hash,
    });
    if (verifyError) return fail(c.generic);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail(c.generic);

  // Same as the OTP path: the first sign-in creates the profile row.
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(
      { id: user.id, full_name: GUEST_NAME },
      { onConflict: "id", ignoreDuplicates: true },
    );
  if (profileError) return fail(c.generic);

  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  return ok();
}

function copy(locale: Locale) {
  const shared = getDictionary(locale);
  const generic =
    shared.common.somethingWentWrong +
    (locale === "hi" ? "। " : ". ") +
    shared.common.tryAgain +
    (locale === "hi" ? "।" : ".");
  const table = {
    hi: {
      disabled: "गेस्ट लॉगिन बंद है।",
      needsKey:
        "गेस्ट लॉगिन सेट नहीं है। .env.local में SUPABASE_SERVICE_ROLE_KEY डालें।",
      generic,
    },
    "hi-Latn": {
      disabled: "Guest login band hai.",
      needsKey:
        "Guest login set nahi hai. .env.local mein SUPABASE_SERVICE_ROLE_KEY daalein.",
      generic,
    },
    en: {
      disabled: "Guest login is turned off.",
      needsKey:
        "Guest login is not set up. Add SUPABASE_SERVICE_ROLE_KEY to .env.local.",
      generic,
    },
  } as const;
  return table[locale];
}
