import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { toLocale, type Locale } from "@/lib/i18n";
import type { MemberRole } from "@/lib/supabase/types";

export interface Viewer {
  userId: string;
  email: string | null;
  fullName: string | null;
  /** null until the user creates or joins an org. */
  org: {
    id: string;
    name: string;
    language: Locale;
    ackMinutes: number;
    /** "21:00" / "08:00" in Asia/Kolkata: no reminders in between. */
    quietStart: string;
    quietEnd: string;
  } | null;
  role: MemberRole | null;
}

/**
 * The signed-in user plus their org, resolved once per request.
 *
 * `cache` dedupes it across the layout, the page and any server action in the
 * same render, so a screen costs one round trip rather than five.
 */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: membership }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    supabase
      .from("memberships")
      .select("role, org_id, orgs(id, name, language, ack_minutes, quiet_start, quiet_end)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  const org = membership?.orgs ?? null;

  return {
    userId: user.id,
    email: user.email ?? null,
    fullName: profile?.full_name ?? null,
    org: org
      ? {
          id: org.id,
          name: org.name,
          language: toLocale(org.language),
          ackMinutes: org.ack_minutes,
          quietStart: org.quiet_start,
          quietEnd: org.quiet_end,
        }
      : null,
    role: membership?.role ?? null,
  };
});

/** Use inside the protected layout and every server action that needs a user. */
export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  return viewer;
}

/** Use where an org is required — task screens, the dashboard, invites. */
export async function requireOrg(): Promise<Viewer & { org: NonNullable<Viewer["org"]> }> {
  const viewer = await requireViewer();
  if (!viewer.org) redirect("/setup");
  return viewer as Viewer & { org: NonNullable<Viewer["org"]> };
}

/** Owner and admin can verify, reassign and cancel; manager can too. */
export function canManage(role: MemberRole | null): boolean {
  return role === "owner" || role === "admin" || role === "manager";
}
