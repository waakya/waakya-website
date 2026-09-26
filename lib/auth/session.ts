import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { toLocale, type Locale } from "@/lib/i18n";
import type { MemberRole } from "@/lib/supabase/types";
import { resolveEnabledModules, type ModuleKey } from "@/lib/modules/catalog";
import { can, type Capability } from "@/lib/permissions";

/** The cookie that names the business a person with several is working in. */
export const ACTIVE_ORG_COOKIE = "waakya_org";

export interface ViewerOrg {
  id: string;
  name: string;
  language: Locale;
  ackMinutes: number;
  /** "21:00" / "08:00" in Asia/Kolkata: no reminders in between. */
  quietStart: string;
  quietEnd: string;
}

export interface Viewer {
  userId: string;
  email: string | null;
  fullName: string | null;
  /** null until the user creates or joins an org. */
  org: ViewerOrg | null;
  role: MemberRole | null;
  /** The capabilities switched on for the active business. */
  modules: Set<ModuleKey>;
  /** Every business this person belongs to, oldest first. */
  memberships: { orgId: string; orgName: string; role: MemberRole }[];
}

type MembershipRow = {
  role: MemberRole;
  org_id: string;
  created_at: string;
  orgs: {
    id: string;
    name: string;
    language: string;
    ack_minutes: number;
    quiet_start: string;
    quiet_end: string;
  } | null;
};

/**
 * The signed-in user plus their active org, resolved once per request.
 *
 * `cache` dedupes it across the layout, the page and any server action in the
 * same render, so a screen costs one round trip rather than five.
 *
 * A person in several businesses works in the one named by the
 * `waakya_org` cookie; without a cookie, or with one that names a business
 * they are not in, the oldest membership wins, as it always did.
 */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const supabase = await createClient();
  // Verified locally against the project's ES256 public keys; no auth-server
  // round trip. proxy.ts has already refreshed the session on this request.
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (!claims?.sub) return null;
  const user = {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : null,
  };

  const [{ data: profile }, { data: membershipRows, error: membershipError }, cookieStore] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    supabase
      .from("memberships")
      .select("role, org_id, created_at, orgs(id, name, language, ack_minutes, quiet_start, quiet_end)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(20),
    cookies(),
  ]);

  // A failed lookup is an error, never "no business": treating it as empty
  // would send an owner to the setup screen whenever the database hiccups.
  if (membershipError) throw new Error(`memberships: ${membershipError.message}`);
  const rows = (membershipRows ?? []) as MembershipRow[];
  const wanted = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;
  const membership = rows.find((row) => row.org_id === wanted) ?? rows[0] ?? null;
  const org = membership?.orgs ?? null;

  // The claims were verified locally, which proves the token was signed with a
  // key this project trusts — not that its user still exists here. A token for
  // a deleted user, or one minted by another project that shares the signing
  // key (every local Supabase stack ships the same default key), would
  // otherwise read as "a new user with no business" and be sent to /setup,
  // where nothing can be created for a user who is not in auth.users. So on
  // this one path — no membership — ask the auth server. Members keep the
  // fast local check; only people about to see /setup pay the round trip.
  if (!membership) {
    const { data: confirmed, error } = await supabase.auth.getUser();
    if (error || confirmed.user?.id !== user.id) return null;
  }

  const { data: moduleRows } = org
    ? await supabase.from("organization_modules").select("module_key, enabled").eq("org_id", org.id)
    : { data: [] };

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
    modules: resolveEnabledModules(moduleRows ?? []),
    memberships: rows
      .filter((row) => row.orgs)
      .map((row) => ({ orgId: row.org_id, orgName: row.orgs!.name, role: row.role })),
  };
});

/** Use inside the protected layout and every server action that needs a user. */
export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  return viewer;
}

export type OrgViewer = Viewer & { org: ViewerOrg };

/** Use where an org is required — task screens, the dashboard, invites. */
export async function requireOrg(): Promise<OrgViewer> {
  const viewer = await requireViewer();
  if (!viewer.org) {
    // A customer with no business of their own belongs on their project
    // page, not on the business setup screen.
    const supabase = await createClient();
    const { data } = await supabase.rpc("my_customer_access");
    redirect(data?.length ? "/portal" : "/setup");
  }
  return viewer as OrgViewer;
}

/**
 * Use at the top of a module's screens: a switched-off capability is not a
 * blank page, it is Today.
 */
export async function requireModule(key: ModuleKey): Promise<OrgViewer> {
  const viewer = await requireOrg();
  if (!viewer.modules.has(key)) redirect("/aaj");
  return viewer;
}

/** True when the active business has the capability switched on. */
export function hasModule(viewer: Pick<Viewer, "modules">, key: ModuleKey): boolean {
  return viewer.modules.has(key);
}

/** Owner and admin can verify, reassign and cancel; manager can too. */
export function canManage(role: MemberRole | null): boolean {
  return role === "owner" || role === "admin" || role === "manager";
}

/** The permission matrix, applied to this viewer. */
export function viewerCan(viewer: Pick<Viewer, "role">, capability: Capability): boolean {
  return can(viewer.role, capability);
}
