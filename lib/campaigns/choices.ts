import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getOrgMembers } from "@/lib/org/members";
import { listTemplates } from "./queries";
import type { CampaignChoices } from "@/app/(app)/campaigns/campaign-form";

export async function campaignChoices(orgId: string): Promise<CampaignChoices> {
  const supabase = await createClient();
  const [templates, members, { data: projects }, { data: stages }, { data: sources }] = await Promise.all([
    listTemplates(orgId),
    getOrgMembers(orgId),
    supabase.from("projects").select("id, name").eq("org_id", orgId).order("updated_at", { ascending: false }).limit(200),
    supabase.from("crm_pipeline_stages").select("id, name").eq("org_id", orgId).order("position"),
    supabase.from("crm_contacts").select("source").eq("org_id", orgId).not("source", "is", null).limit(1000),
  ]);
  return {
    templates: templates.map((x) => ({ id: x.id, name: x.name, channel: x.channel, status: x.status })),
    people: members.map((m) => ({ id: m.userId, name: m.name })),
    projects: projects ?? [],
    stages: stages ?? [],
    sources: [...new Set((sources ?? []).map((s) => s.source).filter((s): s is string => !!s))].sort(),
  };
}
