"use server";

import { z } from "zod";
import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import {
  GUEST_NAME_MAX,
  GUEST_REASON_MAX,
  guestLoginEnabled,
} from "@/lib/auth/guest";
import {
  emailSchema,
  localeSchema,
  fail,
  ok,
  type ActionResult,
} from "@/lib/validation";
import { getDictionary, type Locale } from "@/lib/i18n";
import { LOCALE_COOKIE } from "@/lib/i18n/server";

const inputSchema = z.object({
  name: z.string().trim().min(1).max(GUEST_NAME_MAX),
  email: emailSchema,
  reason: z.string().trim().min(1).max(GUEST_REASON_MAX),
  locale: localeSchema,
});

/**
 * Sign in as a guest without an OTP.
 *
 * Supabase's anonymous sign-in creates a fresh user with a live session using
 * only the public key, so no service-role key is needed anywhere. What the
 * guest typed travels as user metadata, and the name lands in `profiles` the
 * same way the OTP path fills it, so the app has something to show.
 *
 * The email is what the guest says it is: nothing is sent to it and nothing is
 * verified. That is the point of a guest door, and why it only opens while
 * `ALLOW_GUEST_LOGIN` is on.
 */
export async function guestLogin(input: unknown): Promise<ActionResult> {
  const locale = pickLocale(input);
  const c = copy(locale);

  if (!guestLoginEnabled()) return fail(c.disabled);

  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    if (field === "name") return fail(c.badName, "name");
    if (field === "email") return fail(c.badEmail, "email");
    if (field === "reason") return fail(c.badReason, "reason");
    return fail(c.generic);
  }

  const { name, email, reason } = parsed.data;
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.signInAnonymously({
    options: {
      data: {
        full_name: name,
        guest: true,
        guest_email: email,
        guest_reason: reason,
      },
    },
  });

  if (error) {
    const text = error.message.toLowerCase();
    if (text.includes("anonymous")) return fail(c.anonymousOff);
    if (error.status === 429 || text.includes("rate limit")) {
      return fail(c.rateLimited);
    }
    return fail(c.generic);
  }
  if (!user) return fail(c.generic);

  // Same as the OTP path: the first sign-in creates the profile row.
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(
      { id: user.id, full_name: name },
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

function pickLocale(input: unknown): Locale {
  const candidate =
    typeof input === "object" && input !== null && "locale" in input
      ? (input as { locale: unknown }).locale
      : undefined;
  const parsed = localeSchema.safeParse(candidate);
  return parsed.success ? parsed.data : "en";
}

/** Errors say what to do next, in the reader's language (CLAUDE.md §6). */
function copy(locale: Locale) {
  const shared = getDictionary(locale);
  const stop = locale === "hi" ? "।" : ".";
  const generic =
    shared.common.somethingWentWrong + stop + " " + shared.common.tryAgain + stop;
  const table = {
    hi: {
      disabled: "गेस्ट लॉगिन बंद है।",
      badName: "अपना नाम लिखें।",
      badEmail: "ईमेल सही नहीं लग रहा। फिर से लिखें।",
      badReason: "बताएँ कि आप ऐप क्यों देखना चाहते हैं।",
      anonymousOff:
        "गेस्ट लॉगिन Supabase में चालू नहीं है। Authentication में “Allow anonymous sign-ins” चालू करें।",
      rateLimited: "बहुत बार कोशिश हुई। कुछ देर बाद फिर से कोशिश करें।",
      generic,
    },
    "hi-Latn": {
      disabled: "Guest login band hai.",
      badName: "Apna naam likhein.",
      badEmail: "Email sahi nahi lag raha. Phir se likhein.",
      badReason: "Batayein ki aap app kyun dekhna chahte hain.",
      anonymousOff:
        "Guest login Supabase mein chalu nahi hai. Authentication mein “Allow anonymous sign-ins” chalu karein.",
      rateLimited: "Bahut baar koshish hui. Kuch der baad phir se koshish karein.",
      generic,
    },
    en: {
      disabled: "Guest login is turned off.",
      badName: "Please write your name.",
      badEmail: "That email does not look right. Please write it again.",
      badReason: "Tell us why you would like to try the app.",
      anonymousOff:
        "Guest login is not switched on in Supabase. Turn on “Allow anonymous sign-ins” under Authentication.",
      rateLimited: "Too many tries. Please try again in a little while.",
      generic,
    },
  } as const;
  return table[locale];
}
