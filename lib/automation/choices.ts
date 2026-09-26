import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getOrgMembers } from "@/lib/org/members";
import type { EditorChoices } from "@/app/(app)/automations/rule-editor";

export async function editorChoices(orgId: string): Promise<EditorChoices> {
  const supabase = await createClient();
  const [members, { data: stages }, { data: types }, { data: templates }] = await Promise.all([
    getOrgMembers(orgId),
    supabase.from("crm_pipeline_stages").select("id, name").eq("org_id", orgId).order("position"),
    supabase.from("record_types").select("name, statuses").eq("org_id", orgId).is("archived_at", null),
    supabase.from("message_templates").select("id, name").eq("org_id", orgId).eq("status", "approved"),
  ]);
  return {
    people: members.map((m) => ({ id: m.userId, name: m.name })),
    stages: stages ?? [],
    statuses: (types ?? []).flatMap((t) => (((t.statuses as unknown) as { key: string; label: string }[] | null) ?? []).map((s) => ({ key: s.key, label: s.label, type: t.name }))),
    templates: templates ?? [],
  };
}
