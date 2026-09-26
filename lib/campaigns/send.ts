import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/types";
import { emailProvider, whatsappProvider } from "@/lib/messaging";
import { planRecipients, tally } from "./segment";
import { segmentCandidates } from "./queries";
import { segmentSchema } from "./segment";

/**
 * Send a campaign, resumably. Recipient rows are written first (one per
 * person, or the reason they are left out); each queued row is then sent
 * and marked. A second call after a crash picks up the queued rows only, so
 * nobody hears twice. Runs with the service role; the caller has already
 * checked who asked.
 */
export async function sendCampaign(admin: SupabaseClient<Database>, orgId: string, campaignId: string): Promise<{ ok: true; counts: Record<string, number> } | { ok: false; error: string }> {
  const { data: campaign } = await admin.from("campaigns").select("*, message_templates(*)").eq("id", campaignId).eq("org_id", orgId).maybeSingle();
  if (!campaign) return { ok: false, error: "not_found" };
  if (!["draft", "scheduled", "sending", "partially_failed"].includes(campaign.status)) return { ok: false, error: "already_sent" };
  const channel = campaign.channel as "email" | "whatsapp";
  const template = campaign.message_templates as { body: string; subject: string | null; provider_template_name: string | null; provider_language: string; status: string; name: string } | null;
  if (channel === "whatsapp" && (!template || template.status !== "approved")) return { ok: false, error: "template_not_approved" };
  const subject = campaign.subject ?? template?.subject ?? campaign.name;
  const body = campaign.body ?? template?.body ?? "";
  if (channel === "email" && !body) return { ok: false, error: "empty_body" };

  const segment = segmentSchema.safeParse(campaign.segment);
  const candidates = await segmentCandidates(admin, orgId, segment.success ? segment.data : {});
  const plan = planRecipients(channel, candidates);
  if (plan.length === 0) return { ok: false, error: "empty_segment" };

  await admin.from("campaigns").update({ status: "sending", started_at: campaign.started_at ?? new Date().toISOString() }).eq("id", campaignId);
  // Rows first, idempotently: a resumed send finds them already there.
  await admin.from("campaign_recipients").upsert(
    plan.map((p) => ({ org_id: orgId, campaign_id: campaignId, contact_id: p.contactId, address: p.address, status: p.suppressed ? "suppressed" : "queued", error: p.suppressed })),
    { onConflict: "campaign_id,contact_id", ignoreDuplicates: true },
  );

  const { data: queued } = await admin
    .from("campaign_recipients")
    .select("id, contact_id, address, crm_contacts(full_name)")
    .eq("campaign_id", campaignId)
    .eq("status", "queued")
    .limit(1000);
  const email = emailProvider();
  const whatsapp = whatsappProvider();
  for (const r of queued ?? []) {
    const name = (r.crm_contacts as { full_name: string } | null)?.full_name ?? "";
    const outcome =
      channel === "email"
        ? await email.send({ to: r.address!, subject: subject.replace(/\{\{name\}\}/g, name), text: body.replace(/\{\{name\}\}/g, name), idempotencyKey: `campaign:${r.id}` })
        : await whatsapp.send({ to: r.address!.replace("+", ""), templateName: template!.provider_template_name ?? template!.name, language: template!.provider_language, parameters: [name], idempotencyKey: `campaign:${r.id}` });
    if (outcome.ok) {
      await admin.from("campaign_recipients").update({ status: "sent", provider: outcome.provider, provider_message_id: outcome.providerMessageId, sent_at: new Date().toISOString(), error: null }).eq("id", r.id);
      await admin.from("crm_activities").insert({ org_id: orgId, contact_id: r.contact_id, campaign_id: campaignId, kind: "campaign", body: `${campaign.name}${channel === "email" ? ` · ${subject}` : ""}`, actor_kind: "system" });
    } else {
      await admin.from("campaign_recipients").update({ status: "failed", provider: outcome.provider, error: outcome.error }).eq("id", r.id);
    }
  }

  const { data: statuses } = await admin.from("campaign_recipients").select("status").eq("campaign_id", campaignId).limit(5000);
  const counts = tally((statuses ?? []).map((s) => s.status));
  const status = counts.failed > 0 ? "partially_failed" : "sent";
  await admin.from("campaigns").update({ status, counts: counts as unknown as Json, finished_at: new Date().toISOString() }).eq("id", campaignId);
  return { ok: true, counts };
}
