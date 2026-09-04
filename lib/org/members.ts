import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { MemberRole } from "@/lib/supabase/types";

export interface OrgMember {
  userId: string;
  name: string;
  phone: string | null;
  role: MemberRole;
  joinedAt: string;
}

/**
 * Everyone in the org, with their display names.
 *
 * Two queries rather than an embedded select: `tasks.assigned_to` and
 * `memberships.user_id` reference `auth.users`, which PostgREST cannot join to
 * `profiles`. A team is 2–30 people, so a second query and a Map is both
 * cheaper and clearer than a second foreign key to disambiguate.
 */
export const getOrgMembers = cache(async (orgId: string): Promise<OrgMember[]> => {
  const supabase = await createClient();

  const { data: memberships } = await supabase
    .from("memberships")
    .select("user_id, role, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: true });

  if (!memberships?.length) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, phone")
    .in(
      "id",
      memberships.map((m) => m.user_id),
    );

  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));

  return memberships.map((m) => ({
    userId: m.user_id,
    name: byId.get(m.user_id)?.full_name?.trim() || "—",
    phone: byId.get(m.user_id)?.phone ?? null,
    role: m.role,
    joinedAt: m.created_at,
  }));
});

/** A name lookup for task rows, so a row never shows a uuid. */
export const getMemberNames = cache(
  async (orgId: string): Promise<Map<string, string>> => {
    const members = await getOrgMembers(orgId);
    return new Map(members.map((m) => [m.userId, m.name]));
  },
);
