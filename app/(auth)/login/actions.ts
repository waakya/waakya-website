"use server";

import { z } from "zod";
import { headers } from "next/headers";
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
import { getDictionary, type Locale } from "@/lib/i18n";
import { resolveUserLocale, setLocaleCookie } from "@/lib/auth/locale";
import { safeNextPath } from "@/lib/auth/next";

const requestSchema = z.object({
  email: emailSchema,
  consent: z.literal(true),
  locale: localeSchema,
});

const googleSchema = z.object({
  consent: z.literal(true),
  locale: localeSchema,
  next: z.string().max(512).nullable().optional(),
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

/**
 * Sign in with Google: returns the address to send the browser to.
 *
 * The same DPDP consent as the OTP path is required first. The PKCE verifier
 * is written to a cookie here, so only this browser can finish the sign-in at
 * /auth/callback. Google accounts need no rate limit of ours: there is no
 * code for anyone to guess and no email for anyone to spam.
 */
export async function startGoogleSignIn(
  input: unknown,
): Promise<ActionResult<{ url: string }>> {
  const parsed = googleSchema.safeParse(input);
  if (!parsed.success) {
    const locale = pickLocale(input);
    const issue = parsed.error.issues[0];
    if (issue?.path[0] === "consent") {
      return fail(copy(locale).consentRequired, "consent");
    }
    return fail(copy(locale).generic);
  }

  const { locale } = parsed.data;
  // The language picked here is the one the callback falls back to.
  await setLocaleCookie(locale);

  const callback = new URL("/auth/callback", await siteOrigin());
  const next = safeNextPath(parsed.data.next);
  if (next) callback.searchParams.set("next", next);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callback.toString(),
      skipBrowserRedirect: true,
      // A shared shop phone often has several Google accounts on it.
      queryParams: { prompt: "select_account" },
    },
  });
  if (error || !data.url) return fail(copy(locale).generic);

  return ok({ url: data.url });
}

/**
 * This site's origin, for the callback address. Next checks a server action's
 * Origin against its Host before running it, so the header is this site's own.
 * Supabase then checks the callback against its redirect allow-list as well.
 */
async function siteOrigin(): Promise<string> {
  const origin = (await headers()).get("origin");
  if (origin && /^https?:\/\/[a-z0-9.-]+(:\d+)?$/i.test(origin)) return origin;
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000"
  );
}

/** The language switch on the login screen, before there is a user to store it on. */
export async function setLoginLocale(locale: Locale): Promise<void> {
  const parsed = localeSchema.safeParse(locale);
  if (!parsed.success) return;
  await setLocaleCookie(parsed.data);
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
