import "server-only";

import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/server";
import { getMemberNames } from "@/lib/org/members";
import { segmentSchema, type Candidate, type Segment } from "./segment";

export interface CampaignRow {
  id: string;
  name: string;
  channel: "email" | "whatsapp";
  status: string;
  templateName: string | null;
  subject: string | null;
  body: string | null;
  segment: Segment;
  counts: Record<string, number>;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  createdByName: string | null;
}

export interface RecipientRow {
  id: string;
  contactId: string;
  contactName: string;
  address: string | null;
  status: string;
  error: string | null;
  sentAt: string | null;
  repliedAt: string | null;
}

export interface TemplateRow {
  id: string;
  channel: "email" | "whatsapp";
  name: string;
  subject: string | null;
  body: string;
  providerTemplateName: string | null;
  providerLanguage: string;
  status: string;
}

export const listCampaigns = cache(async (orgId: string): Promise<CampaignRow[]> => {
  const supabase = await createClient();
  const [{ data }, names] = await Promise.all([
    supabase.from("campaigns").select("*, message_templates(name)").eq("org_id", orgId).order("created_at", { ascending: false }).limit(100),
    getMemberNames(orgId),
  ]);
  return (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    channel: c.channel as CampaignRow["channel"],
    status: c.status,
    templateName: (c.message_templates as { name: string } | null)?.name ?? null,
    subject: c.subject,
    body: c.body,
    segment: segmentSchema.safeParse(c.segment).success ? (c.segment as Segment) : {},
    counts: (c.counts as Record<string, number>) ?? {},
    startedAt: c.started_at,
    finishedAt: c.finished_at,
    createdAt: c.created_at,
    createdByName: c.created_by ? (names.get(c.created_by) ?? null) : null,
  }));
});

export const getCampaign = cache(async (orgId: string, id: string): Promise<{ campaign: CampaignRow; recipients: RecipientRow[] } | null> => {
  const campaigns = await listCampaigns(orgId);
  const campaign = campaigns.find((c) => c.id === id);
  if (!campaign) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("campaign_recipients")
    .select("id, contact_id, address, status, error, sent_at, replied_at, crm_contacts(full_name)")
    .eq("campaign_id", id)
    .order("created_at", { ascending: true })
    .limit(2000);
  return {
    campaign,
    recipients: (data ?? []).map((r) => ({
      id: r.id,
      contactId: r.contact_id,
      contactName: (r.crm_contacts as { full_name: string } | null)?.full_name ?? "",
      address: r.address,
      status: r.status,
      error: r.error,
      sentAt: r.sent_at,
      repliedAt: r.replied_at,
    })),
  };
});

export const listTemplates = cache(async (orgId: string): Promise<TemplateRow[]> => {
  const supabase = await createClient();
  const { data } = await supabase.from("message_templates").select("*").eq("org_id", orgId).order("created_at", { ascending: false });
  return (data ?? []).map((t) => ({
    id: t.id,
    channel: t.channel as TemplateRow["channel"],
    name: t.name,
    subject: t.subject,
    body: t.body,
    providerTemplateName: t.provider_template_name,
    providerLanguage: t.provider_language,
    status: t.status,
  }));
});

/** The people a segment names, with what the channel needs to reach them. Works for any client. */
export async function segmentCandidates(client: SupabaseClient<Database>, orgId: string, segment: Segment): Promise<Candidate[]> {
  let query = client
    .from("crm_contacts")
    .select("id, email, phone_e164, email_opt_out, whatsapp_opt_out, archived_at")
    .eq("org_id", orgId)
    .is("archived_at", null)
    .limit(5000);
  if (segment.kind) query = query.eq("kind", segment.kind);
  if (segment.source) query = query.eq("source", segment.source);
  if (segment.ownerId) query = query.eq("owner_id", segment.ownerId);
  if (segment.projectId) query = query.eq("project_id", segment.projectId);
  if (segment.tags?.length) query = query.overlaps("tags", segment.tags);
  const { data } = await query;
  let rows = data ?? [];
  if (segment.stageId) {
    const { data: deals } = await client.from("crm_opportunities").select("contact_id").eq("org_id", orgId).eq("stage_id", segment.stageId).eq("status", "open");
    const allowed = new Set((deals ?? []).map((d) => d.contact_id));
    rows = rows.filter((r) => allowed.has(r.id));
  }
  return rows.map((r) => ({ id: r.id, email: r.email, phone: r.phone_e164, emailOptOut: r.email_opt_out, whatsappOptOut: r.whatsapp_opt_out, archivedAt: r.archived_at }));
}
