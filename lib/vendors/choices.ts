import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getOrgMembers } from "@/lib/org/members";
import { listVendors } from "./queries";
import type { AssignChoices } from "@/app/(app)/vendors/assign-form";

/** Everything the assign form offers, in one round of queries. */
export async function assignChoices(orgId: string): Promise<AssignChoices> {
  const supabase = await createClient();
  const [vendors, members, { data: projects }, { data: records }] = await Promise.all([
    listVendors(orgId),
    getOrgMembers(orgId),
    supabase.from("projects").select("id, name").eq("org_id", orgId).neq("status", "completed").order("updated_at", { ascending: false }).limit(200),
    supabase.from("records").select("id, title, project_id, record_types(statuses)").eq("org_id", orgId).is("archived_at", null).order("updated_at", { ascending: false }).limit(300),
  ]);
  return {
    vendors: vendors.filter((v) => v.status === "active").map((v) => ({ id: v.id, name: v.name })),
    projects: projects ?? [],
    records: (records ?? []).map((r) => ({
      id: r.id,
      title: r.title,
      projectId: r.project_id,
      statuses: (((r.record_types as { statuses: unknown } | null)?.statuses as { key: string; label: string }[] | null) ?? []).map((s) => ({ key: s.key, label: s.label })),
    })),
    people: members.map((m) => ({ id: m.userId, name: m.name })),
  };
}
