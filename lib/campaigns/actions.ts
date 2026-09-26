"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireOrg, viewerCan, hasModule } from "@/lib/auth/session";
import { getCampaigns } from "@/lib/i18n/campaigns";
import { fail, ok, uuidSchema, type ActionResult } from "@/lib/validation";
import type { Json } from "@/lib/supabase/types";
import { kickAutomation } from "@/lib/automation/kick";
import { planRecipients, segmentSchema } from "./segment";
import { segmentCandidates } from "./queries";
import { sendCampaign as sendWithAdmin } from "./send";

async function campaignsViewer() {
  const viewer = await requireOrg();
  const t = getCampaigns(viewer.org.language);
  if (!hasModule(viewer, "campaigns")) return { viewer, t, refused: fail(t.errors.moduleOff) as ActionResult<never> };
  if (!viewerCan(viewer, "campaigns.manage")) return { viewer, t, refused: fail(t.errors.notAllowed) as ActionResult<never> };
  return { viewer, t, refused: null };
}

const templateSchema = z.object({
  id: uuidSchema.optional(),
  channel: z.enum(["email", "whatsapp"]),
  name: z.string().trim().min(1).max(80),
  subject: z.string().trim().max(140).optional().or(z.literal("")),
  body: z.string().trim().min(1).max(4000),
  providerTemplateName: z.string().trim().max(120).optional().or(z.literal("")),
  providerLanguage: z.string().trim().min(2).max(10).default("en"),
  status: z.enum(["draft", "approved", "rejected"]).default("draft"),
});

export async function saveTemplate(input: unknown): Promise<ActionResult<{ id: string }>> {
  const { viewer, t, refused } = await campaignsViewer();
  if (refused) return refused;
  const parsed = templateSchema.safeParse(input);
  if (!parsed.success) return fail(t.errors.badInput, String(parsed.error.issues[0]?.path[0] ?? ""));
  const d = parsed.data;
  if (d.status === "approved" && !viewerCan(viewer, "campaigns.send")) return fail(t.errors.notAllowed);
  const supabase = await createClient();
  const row = { channel: d.channel, name: d.name, subject: d.subject || null, body: d.body, provider_template_name: d.providerTemplateName || null, provider_language: d.providerLanguage, status: d.status };
  if (d.id) {
    const { error } = await supabase.from("message_templates").update(row).eq("id", d.id).eq("org_id", viewer.org.id);
    if (error) return fail(error.code === "23505" ? t.errors.nameTaken : t.errors.generic);
    revalidatePath("/campaigns", "layout");
    return ok({ id: d.id });
  }
  const { data, error } = await supabase.from("message_templates").insert({ org_id: viewer.org.id, created_by: viewer.userId, ...row }).select("id").single();
  if (error || !data) return fail(error?.code === "23505" ? t.errors.nameTaken : t.errors.generic);
  revalidatePath("/campaigns", "layout");
  return ok({ id: data.id });
}

const campaignSchema = z.object({
  id: uuidSchema.optional(),
  name: z.string().trim().min(1).max(120),
  channel: z.enum(["email", "whatsapp"]),
  templateId: uuidSchema.optional().or(z.literal("")),
  subject: z.string().trim().max(140).optional().or(z.literal("")),
  body: z.string().trim().max(4000).optional().or(z.literal("")),
  segment: segmentSchema,
});

export async function saveCampaign(input: unknown): Promise<ActionResult<{ id: string }>> {
  const { viewer, t, refused } = await campaignsViewer();
  if (refused) return refused;
  const parsed = campaignSchema.safeParse(input);
  if (!parsed.success) return fail(t.errors.badInput, String(parsed.error.issues[0]?.path[0] ?? ""));
  const d = parsed.data;
  if (d.channel === "whatsapp" && !d.templateId) return fail(t.errors.needTemplate, "templateId");
  if (d.channel === "email" && !d.templateId && !d.body) return fail(t.errors.needBody, "body");
  const supabase = await createClient();
  const row = { name: d.name, channel: d.channel, template_id: d.templateId || null, subject: d.subject || null, body: d.body || null, segment: d.segment as unknown as Json };
  if (d.id) {
    const { error } = await supabase.from("campaigns").update(row).eq("id", d.id).eq("org_id", viewer.org.id);
    if (error) return fail(error.code === "42501" ? t.errors.notAllowed : t.errors.generic);
    revalidatePath("/campaigns", "layout");
    return ok({ id: d.id });
  }
  const { data, error } = await supabase.from("campaigns").insert({ org_id: viewer.org.id, created_by: viewer.userId, ...row }).select("id").single();
  if (error || !data) return fail(error?.code === "42501" ? t.errors.notAllowed : t.errors.generic);
  revalidatePath("/campaigns", "layout");
  return ok({ id: data.id });
}

/** How many people a segment reaches, and how many would be left out, before anything is sent. */
export async function previewSegment(input: unknown): Promise<ActionResult<{ total: number; reachable: number; suppressed: number }>> {
  const { viewer, t, refused } = await campaignsViewer();
  if (refused) return refused;
  const parsed = z.object({ channel: z.enum(["email", "whatsapp"]), segment: segmentSchema }).safeParse(input);
  if (!parsed.success) return fail(t.errors.badInput);
  const supabase = await createClient();
  const candidates = await segmentCandidates(supabase, viewer.org.id, parsed.data.segment);
  const plan = planRecipients(parsed.data.channel, candidates);
  const reachable = plan.filter((p) => !p.suppressed).length;
  return ok({ total: plan.length, reachable, suppressed: plan.length - reachable });
}

/** Sending is an owner or admin's word, done with the service role, resumable. */
export async function sendCampaign(input: unknown): Promise<ActionResult<{ counts: Record<string, number> }>> {
  const { viewer, t, refused } = await campaignsViewer();
  if (refused) return refused;
  if (!viewerCan(viewer, "campaigns.send")) return fail(t.errors.notAllowed);
  const parsed = uuidSchema.safeParse(input);
  if (!parsed.success) return fail(t.errors.badInput);
  const admin = createAdminClient();
  if (!admin) return fail(t.errors.generic);
  const result = await sendWithAdmin(admin, viewer.org.id, parsed.data);
  if (!result.ok) {
    const map: Record<string, string> = { not_found: t.errors.notFound, already_sent: t.errors.alreadySent, template_not_approved: t.errors.templateNotApproved, empty_segment: t.errors.emptySegment, empty_body: t.errors.needBody };
    return fail(map[result.error] ?? t.errors.generic);
  }
  revalidatePath("/campaigns", "layout");
  kickAutomation(viewer.org.id);
  return ok({ counts: result.counts });
}

export async function cancelCampaign(input: unknown): Promise<ActionResult> {
  const { viewer, t, refused } = await campaignsViewer();
  if (refused) return refused;
  const parsed = uuidSchema.safeParse(input);
  if (!parsed.success) return fail(t.errors.badInput);
  const supabase = await createClient();
  const { error } = await supabase.from("campaigns").update({ status: "cancelled" }).eq("id", parsed.data).eq("org_id", viewer.org.id).in("status", ["draft", "scheduled"]);
  if (error) return fail(t.errors.generic);
  revalidatePath("/campaigns", "layout");
  return ok();
}

const optOutSchema = z.object({ contactId: uuidSchema, channel: z.enum(["email", "whatsapp"]), optOut: z.boolean() });

/** Consent is the contact's; the business records it and the sender honours it. */
export async function setContactOptOut(input: unknown): Promise<ActionResult> {
  const viewer = await requireOrg();
  const t = getCampaigns(viewer.org.language);
  if (!viewerCan(viewer, "crm.write")) return fail(t.errors.notAllowed);
  const parsed = optOutSchema.safeParse(input);
  if (!parsed.success) return fail(t.errors.badInput);
  const supabase = await createClient();
  const { error } = await supabase
    .from("crm_contacts")
    .update(parsed.data.channel === "email" ? { email_opt_out: parsed.data.optOut } : { whatsapp_opt_out: parsed.data.optOut })
    .eq("id", parsed.data.contactId)
    .eq("org_id", viewer.org.id);
  if (error) return fail(t.errors.generic);
  revalidatePath(`/crm/${parsed.data.contactId}`);
  return ok();
}

/** The WhatsApp number this business receives on: how the webhook finds the business. */
export async function setWhatsAppNumber(input: unknown): Promise<ActionResult> {
  const { viewer, t, refused } = await campaignsViewer();
  if (refused) return refused;
  if (!viewerCan(viewer, "campaigns.send")) return fail(t.errors.notAllowed);
  const parsed = z.object({ phoneNumberId: z.string().trim().max(40).regex(/^[0-9]*$/) }).safeParse(input);
  if (!parsed.success) return fail(t.errors.badInput, "phoneNumberId");
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_org_module", {
    p_org: viewer.org.id,
    p_key: "campaigns",
    p_enabled: true,
    p_requires: ["crm"],
    p_configuration: { whatsapp_phone_number_id: parsed.data.phoneNumberId || null },
  });
  if (error) return fail(t.errors.generic);
  revalidatePath("/campaigns", "layout");
  return ok();
}
