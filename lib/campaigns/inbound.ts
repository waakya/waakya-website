import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/types";
import { isOptOutMessage } from "./segment";

/**
 * A message that came back on WhatsApp. Find the business by the phone
 * number it arrived on, the person by their number, file it as an activity,
 * mark the campaign reply, honour STOP, and tell the owner. Idempotent by
 * the provider's message id.
 */
export async function recordInboundWhatsApp(
  admin: SupabaseClient<Database>,
  message: { phoneNumberId: string; from: string; messageId: string; body: string; raw: Json; receivedAt?: string },
): Promise<{ ok: true; orgId: string | null; contactId: string | null; duplicate?: boolean } | { ok: false; error: string }> {
  const { data: orgRow } = await admin
    .from("organization_modules")
    .select("org_id")
    .eq("module_key", "campaigns")
    .eq("enabled", true)
    .filter("configuration->>whatsapp_phone_number_id", "eq", message.phoneNumberId)
    .maybeSingle();
  const orgId = orgRow?.org_id ?? null;
  if (!orgId) return { ok: true, orgId: null, contactId: null };

  const phone = `+${message.from.replace(/\D/g, "")}`;
  const { data: contact } = await admin.from("crm_contacts").select("id, full_name, owner_id").eq("org_id", orgId).eq("phone_e164", phone).is("archived_at", null).maybeSingle();
  let contactId = contact?.id ?? null;
  if (!contactId) {
    const { data: created } = await admin.rpc("crm_upsert_lead", { p_org: orgId, p_full_name: phone, p_phone: phone, p_source: "whatsapp", p_message: message.body, p_actor_kind: "integration" });
    contactId = Array.isArray(created) ? created[0]?.contact_id ?? null : null;
  }

  const { data: campaignRow } = contactId
    ? await admin.from("campaign_recipients").select("id, campaign_id").eq("contact_id", contactId).eq("status", "sent").gte("sent_at", new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()).order("sent_at", { ascending: false }).limit(1).maybeSingle()
    : { data: null };

  const { error } = await admin.from("inbound_messages").insert({
    org_id: orgId,
    channel: "whatsapp",
    provider: "meta",
    provider_message_id: message.messageId,
    from_address: phone,
    body: message.body,
    contact_id: contactId,
    campaign_id: campaignRow?.campaign_id ?? null,
    received_at: message.receivedAt ?? new Date().toISOString(),
    raw: message.raw,
  });
  if (error?.code === "23505") return { ok: true, orgId, contactId, duplicate: true };
  if (error) return { ok: false, error: error.message };

  if (contactId) {
    await admin.from("crm_activities").insert({ org_id: orgId, contact_id: contactId, campaign_id: campaignRow?.campaign_id ?? null, kind: "whatsapp", body: message.body.slice(0, 4000), actor_kind: "customer" });
    if (campaignRow) {
      await admin.from("campaign_recipients").update({ status: "replied", replied_at: new Date().toISOString() }).eq("id", campaignRow.id);
      await admin.rpc("record_domain_event", { p_org: orgId, p_type: "campaign.recipient_replied", p_entity_type: "campaign", p_entity_id: campaignRow.campaign_id, p_payload: { title: contact?.full_name ?? phone, contact_id: contactId, body: message.body.slice(0, 200) }, p_actor_kind: "integration" });
    }
    if (isOptOutMessage(message.body)) {
      await admin.from("crm_contacts").update({ whatsapp_opt_out: true }).eq("id", contactId);
    }
    await admin.rpc("record_domain_event", { p_org: orgId, p_type: "customer_message.received", p_entity_type: "contact", p_entity_id: contactId, p_payload: { project_name: contact?.full_name ?? phone, body: message.body.slice(0, 200), contact_id: contactId, channel: "whatsapp" }, p_actor_kind: "integration" });
    const { data: owners } = contact?.owner_id
      ? { data: [{ user_id: contact.owner_id }] }
      : await admin.from("memberships").select("user_id").eq("org_id", orgId).in("role", ["owner", "admin"]);
    for (const o of owners ?? []) {
      await admin.rpc("push_user_notification", { p_org: orgId, p_user: o.user_id, p_event: "campaign_reply", p_body: `${contact?.full_name ?? phone}: ${message.body.slice(0, 200)}`, p_href: `/crm/${contactId}`, p_dedupe: `wa:${message.messageId}:${o.user_id}` });
    }
  }
  return { ok: true, orgId, contactId };
}

/** Delivery receipts: the provider's word on whether a message arrived. */
export async function recordWhatsAppStatus(admin: SupabaseClient<Database>, status: { messageId: string; status: string; error?: string }): Promise<void> {
  const patch =
    status.status === "delivered" || status.status === "read"
      ? { status: "delivered", delivered_at: new Date().toISOString() }
      : status.status === "failed"
        ? { status: "failed", error: status.error ?? "provider_failed" }
        : null;
  if (!patch) return;
  await admin.from("campaign_recipients").update(patch).eq("provider_message_id", status.messageId).in("status", ["sent", "delivered"]);
}
