"use server";

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { requireOrg, requireViewer, canManage } from "@/lib/auth/session";
import { getDictionary, toLocale, type Locale } from "@/lib/i18n";
import { LOCALE_COOKIE } from "@/lib/i18n/server";
import {
  fail,
  indianPhoneSchema,
  localeSchema,
  ok,
  uuidSchema,
  type ActionResult,
} from "@/lib/validation";

const createOrgSchema = z.object({
  name: z.string().trim().min(2, "too short").max(80),
  language: localeSchema,
});

const inviteSchema = z.object({
  fullName: z.string().trim().min(1).max(60),
  phone: indianPhoneSchema,
  role: z.enum(["admin", "manager", "member"]),
});

/**
 * Creates the business and makes the creator its owner.
 *
 * Both rows are written by `create_org()` in one transaction, because a
 * membership a user can insert for themselves would let anyone join any org
 * (see migration 0003).
 */
export async function createOrg(
  input: unknown,
): Promise<ActionResult<{ orgId: string }>> {
  const viewer = await requireViewer();
  const parsed = createOrgSchema.safeParse(input);
  if (!parsed.success) {
    return fail(errors(fallbackLocale(input)).nameTooShort, "name");
  }
  if (viewer.org) return fail(errors(parsed.data.language).alreadyInOrg);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_org", {
    p_name: parsed.data.name,
    p_language: parsed.data.language,
  });
  if (error || !data) return fail(errors(parsed.data.language).generic);

  revalidatePath("/", "layout");
  return ok({ orgId: data });
}

/** Creates an invite and returns the link the owner sends themselves. */
export async function createInvite(
  input: unknown,
): Promise<ActionResult<{ url: string; token: string }>> {
  const viewer = await requireOrg();
  const locale = viewer.org.language;
  if (!canManage(viewer.role)) return fail(errors(locale).notAllowed);

  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    if (field === "phone") return fail(errors(locale).badPhone, "phone");
    return fail(errors(locale).badName, "fullName");
  }

  // 32 hex characters: guessable only by brute force, and the invite is
  // single-use and expires in 30 days.
  const token = randomBytes(16).toString("hex");

  const supabase = await createClient();
  const { error } = await supabase.from("invites").insert({
    org_id: viewer.org.id,
    full_name: parsed.data.fullName,
    phone: parsed.data.phone,
    role: parsed.data.role,
    token,
    created_by: viewer.userId,
  });
  if (error) return fail(errors(locale).generic);

  revalidatePath("/staff");
  return ok({ token, url: `${siteUrl()}/join/${token}` });
}

export async function revokeInvite(inviteId: unknown): Promise<ActionResult> {
  const viewer = await requireOrg();
  const locale = viewer.org.language;
  if (!canManage(viewer.role)) return fail(errors(locale).notAllowed);

  const parsed = uuidSchema.safeParse(inviteId);
  if (!parsed.success) return fail(errors(locale).generic);

  const supabase = await createClient();
  const { error } = await supabase
    .from("invites")
    .delete()
    .eq("id", parsed.data)
    .eq("org_id", viewer.org.id);
  if (error) return fail(errors(locale).generic);

  revalidatePath("/staff");
  return ok();
}

/** Joins the org behind an invite token. */
export async function acceptInvite(token: unknown): Promise<ActionResult> {
  const viewer = await requireViewer();
  const parsed = z.string().regex(/^[0-9a-f]{32}$/).safeParse(token);
  const supabase = await createClient();

  // Before joining, the reader's language is their own; after, the org's.
  const locale = toLocale(viewer.org?.language, "hi");
  if (!parsed.success) return fail(getDictionary(locale).org.joinNotFound);

  const { data: orgId, error } = await supabase.rpc("accept_invite", {
    p_token: parsed.data,
  });
  if (error) {
    const t = getDictionary(locale).org;
    if (error.code === "P0002") return fail(t.joinNotFound);
    return fail(t.joinUsed);
  }

  // A new staff member inherits the org's language (owner decision 3).
  if (orgId) {
    const { data: org } = await supabase
      .from("orgs")
      .select("language")
      .eq("id", orgId)
      .maybeSingle();
    if (org) await writeLocaleCookie(toLocale(org.language, locale));
  }

  revalidatePath("/", "layout");
  return ok();
}

/** The language switch, once there is a user to store the choice on. */
export async function setUserLocale(locale: Locale): Promise<void> {
  const parsed = localeSchema.safeParse(locale);
  if (!parsed.success) return;

  const viewer = await requireViewer();
  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({ language: parsed.data })
    .eq("id", viewer.userId);

  await writeLocaleCookie(parsed.data);
  revalidatePath("/", "layout");
}

async function writeLocaleCookie(locale: Locale): Promise<void> {
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}

function fallbackLocale(input: unknown): Locale {
  const candidate =
    typeof input === "object" && input !== null && "language" in input
      ? (input as { language: unknown }).language
      : undefined;
  return toLocale(candidate, "hi");
}

function errors(locale: Locale) {
  const table = {
    hi: {
      nameTooShort: "बिज़नेस का नाम कम से कम 2 अक्षर का होना चाहिए।",
      alreadyInOrg: "आप पहले से एक बिज़नेस में हैं।",
      badPhone: "10 अंकों का मोबाइल नंबर डालिए।",
      badName: "नाम डालिए।",
      notAllowed: "यह काम सिर्फ़ मालिक या मैनेजर कर सकते हैं।",
      generic: "नहीं हो पाया। फिर से कोशिश करें।",
    },
    "hi-Latn": {
      nameTooShort: "Business ka naam kam se kam 2 akshar ka hona chahiye.",
      alreadyInOrg: "Aap pehle se ek business mein hain.",
      badPhone: "10 ank ka mobile number daaliye.",
      badName: "Naam daaliye.",
      notAllowed: "Yeh kaam sirf owner ya manager kar sakte hain.",
      generic: "Nahi ho paya. Phir se koshish karein.",
    },
    en: {
      nameTooShort: "The business name needs at least 2 characters.",
      alreadyInOrg: "You are already in a business.",
      badPhone: "Enter a 10-digit mobile number.",
      badName: "Enter a name.",
      notAllowed: "Only an owner or a manager can do this.",
      generic: "That did not go through. Try again.",
    },
  } as const;
  return table[locale];
}
