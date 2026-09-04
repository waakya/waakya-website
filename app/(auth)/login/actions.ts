"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  activeAuthProvider,
  hashIdentifier,
  type OtpFailure,
} from "@/lib/auth/provider";
import {
  emailSchema,
  localeSchema,
  otpCodeSchema,
  fail,
  ok,
  type ActionResult,
} from "@/lib/validation";
import { getDictionary, toLocale, type Locale } from "@/lib/i18n";
import { LOCALE_COOKIE } from "@/lib/i18n/server";

const requestSchema = z.object({
  email: emailSchema,
  consent: z.literal(true),
  locale: localeSchema,
});

const verifySchema = z.object({
  email: emailSchema,
  code: otpCodeSchema,
  locale: localeSchema,
});

/**
 * Step one of sign-in: send a six-digit code.
 *
 * DPDP consent is captured here — the checkbox is required, and refusing it
 * stops the request rather than being recorded as a silent yes.
 */
export async function requestOtp(
  input: unknown,
): Promise<ActionResult<{ email: string }>> {
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) {
    const locale = pickLocale(input);
    const issue = parsed.error.issues[0];
    if (issue?.path[0] === "consent") {
      return fail(copy(locale).consentRequired, "consent");
    }
    return fail(copy(locale).badEmail, "email");
  }

  const { email, locale } = parsed.data;
  const supabase = await createClient();

  // Rate limit before touching the mail sender, and count the attempt even if
  // it is refused, so retrying cannot reset the window.
  const { data: allowed, error: limitError } = await supabase.rpc(
    "record_otp_request",
    { p_identifier_hash: hashIdentifier(email) },
  );
  if (limitError) return fail(copy(locale).generic);
  if (allowed === false) return fail(copy(locale).rateLimited);

  const result = await activeAuthProvider().sendCode(supabase, email);
  if (!result.ok) return fail(message(result.reason, locale));

  return ok({ email });
}

/** Step two: exchange the code for a session, and make sure a profile exists. */
export async function verifyOtp(input: unknown): Promise<ActionResult> {
  const parsed = verifySchema.safeParse(input);
  if (!parsed.success) {
    return fail(copy(pickLocale(input)).badCode, "code");
  }

  const { email, code, locale } = parsed.data;
  const supabase = await createClient();

  const result = await activeAuthProvider().verifyCode(supabase, email, code);
  if (!result.ok) {
    // A wrong or expired code is a problem with the code box; a rate limit is
    // not a problem with any field, so it names none.
    const field =
      result.reason === "bad_code" || result.reason === "expired"
        ? "code"
        : undefined;
    return fail(message(result.reason, locale), field);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail(copy(locale).generic);

  // First login creates the profile row. Upsert so a repeat login is a no-op.
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: user.id }, { onConflict: "id", ignoreDuplicates: true });
  if (error) return fail(copy(locale).generic);

  // A returning user gets the language they chose; a newly invited staff member
  // has none yet and inherits the org's. The switch on this screen only decides
  // the language of the screen itself.
  await setLocaleCookie(await resolveUserLocale(supabase, user.id, locale));

  return ok();
}

/** The language switch on the login screen, before there is a user to store it on. */
export async function setLoginLocale(locale: Locale): Promise<void> {
  const parsed = localeSchema.safeParse(locale);
  if (!parsed.success) return;
  await setLocaleCookie(parsed.data);
}

/** profile.language, else the org's language, else what they picked here. */
async function resolveUserLocale(
  supabase: Awaited<ReturnType<typeof createClient>>,
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

async function setLocaleCookie(locale: Locale): Promise<void> {
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}

function pickLocale(input: unknown): Locale {
  const candidate =
    typeof input === "object" && input !== null && "locale" in input
      ? (input as { locale: unknown }).locale
      : undefined;
  const parsed = localeSchema.safeParse(candidate);
  return parsed.success ? parsed.data : "hi";
}

/**
 * Errors say what to do next, in the reader's language, and never leak what
 * went wrong inside (§9, CLAUDE.md §6).
 */
function copy(locale: Locale) {
  const shared = getDictionary(locale);
  const table = {
    hi: {
      badEmail: "ईमेल सही नहीं लग रहा। फिर से लिखें।",
      consentRequired: "आगे बढ़ने के लिए प्राइवेसी पॉलिसी पर टिक करें।",
      rateLimited: "बहुत बार भेजा गया। 15 मिनट बाद फिर से कोशिश करें।",
      badCode: "कोड सही नहीं है। फिर से देखें।",
      expired: "कोड की समय सीमा खत्म। नया कोड भेजें।",
      generic: shared.common.somethingWentWrong + "। " + shared.common.tryAgain + "।",
    },
    "hi-Latn": {
      badEmail: "Email sahi nahi lag raha. Phir se likhein.",
      consentRequired: "Aage badhne ke liye Privacy Policy pe tick karein.",
      rateLimited: "Bahut baar bheja gaya. 15 minute baad phir se koshish karein.",
      badCode: "Code sahi nahi hai. Phir se dekhein.",
      expired: "Code ki samay seema khatam. Naya code bhejein.",
      generic: shared.common.somethingWentWrong + ". " + shared.common.tryAgain + ".",
    },
    en: {
      badEmail: "That email does not look right. Please write it again.",
      consentRequired: "Tick the Privacy Policy to continue.",
      rateLimited: "Too many codes sent. Try again in 15 minutes.",
      badCode: "That code is not right. Please check it.",
      expired: "That code has expired. Send a new one.",
      generic: shared.common.somethingWentWrong + ". " + shared.common.tryAgain + ".",
    },
  } as const;
  return table[locale];
}

function message(reason: OtpFailure, locale: Locale): string {
  const c = copy(locale);
  switch (reason) {
    case "rate_limited":
      return c.rateLimited;
    case "bad_code":
      return c.badCode;
    case "expired":
      return c.expired;
    default:
      return c.generic;
  }
}
