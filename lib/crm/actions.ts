"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { requireOrg, viewerCan, hasModule } from "@/lib/auth/session";
import { getOrgMembers } from "@/lib/org/members";
import { getCrm } from "@/lib/i18n/crm";
import { fail, ok, uuidSchema, type ActionResult } from "@/lib/validation";
import { createTask } from "@/lib/tasks/create";
import { DEADLINE_PRESETS } from "@/lib/tasks/deadlines";
import { recordEvent } from "@/lib/events/emit";
import { notifyWith, writeMessage, writeSubject } from "@/lib/notify";
import { normalizeEmail, normalizePhone, ACTIVITY_KINDS, CONTACT_SOURCES } from "./model";
import { kickAutomation } from "@/lib/automation/kick";

/**
 * The CRM's writes. Every one: the module must be on, the person must hold
 * the capability, the input is validated, the database checks it all again,
 * and the history line is written by the database.
 */

async function crmViewer() {
  const viewer = await requireOrg();
  const t = getCrm(viewer.org.language);
  if (!hasModule(viewer, "crm")) return { viewer, t, refused: fail(t.errors.moduleOff) as ActionResult<never> };
  return { viewer, t, refused: null };
}

function refresh(contactId?: string) {
  revalidatePath("/crm");
  revalidatePath("/crm/pipeline");
  revalidatePath("/aaj");
  if (contactId) revalidatePath(`/crm/${contactId}`);
}

const contactSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  email: z.string().trim().max(254).optional().or(z.literal("")),
  companyName: z.string().trim().max(120).optional().or(z.literal("")),
  source: z.enum(CONTACT_SOURCES).optional(),
  interest: z.string().trim().max(140).optional().or(z.literal("")),
  notes: z.string().trim().max(4000).optional().or(z.literal("")),
  tags: z.array(z.string().trim().min(1).max(30)).max(30).optional(),
  ownerId: uuidSchema.optional().or(z.literal("")),
  projectId: uuidSchema.optional().or(z.literal("")),
});

/** A new enquiry from the form. Finds the person by phone or email first. */
export async function createContact(input: unknown): Promise<ActionResult<{ id: string; existed: boolean }>> {
  const { viewer, t, refused } = await crmViewer();
  if (refused) return refused;
  if (!viewerCan(viewer, "crm.write")) return fail(t.errors.notAllowed);
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) return fail(t.errors.badInput, String(parsed.error.issues[0]?.path[0] ?? ""));
  const phone = normalizePhone(parsed.data.phone || null);
  const email = normalizeEmail(parsed.data.email || null);
  if (parsed.data.phone && !phone) return fail(t.errors.badInput, "phone");
  if (parsed.data.email && !email) return fail(t.errors.badInput, "email");
  if (!phone && !email) return fail(t.errors.needReach, "phone");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("crm_upsert_lead", {
    p_org: viewer.org.id,
    p_full_name: parsed.data.fullName,
    p_phone: phone ?? undefined,
    p_email: email ?? undefined,
    p_source: parsed.data.source ?? undefined,
    p_message: parsed.data.notes || undefined,
    p_interest: parsed.data.interest || undefined,
    p_actor_kind: "user",
    p_owner: parsed.data.ownerId || undefined,
  });
  const row = Array.isArray(data) ? data[0] : null;
  if (error || !row) return fail(error?.code === "42501" ? t.errors.notAllowed : t.errors.generic);

  if (!row.deduplicated && (parsed.data.companyName || parsed.data.tags?.length || parsed.data.projectId)) {
    await supabase
      .from("crm_contacts")
      .update({
        company_name: parsed.data.companyName || null,
        tags: parsed.data.tags ?? [],
        project_id: parsed.data.projectId || null,
      })
      .eq("id", row.contact_id)
      .eq("org_id", viewer.org.id);
  }
  refresh(row.contact_id);
  kickAutomation(viewer.org.id);
  return ok({ id: row.contact_id, existed: row.deduplicated });
}

const updateSchema = contactSchema.partial().extend({ id: uuidSchema });

export async function updateContact(input: unknown): Promise<ActionResult> {
  const { viewer, t, refused } = await crmViewer();
  if (refused) return refused;
  if (!viewerCan(viewer, "crm.write")) return fail(t.errors.notAllowed);
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return fail(t.errors.badInput, String(parsed.error.issues[0]?.path[0] ?? ""));
  const d = parsed.data;
  const patch: Record<string, unknown> = {};
  if (d.fullName !== undefined) patch.full_name = d.fullName;
  if (d.phone !== undefined) {
    const phone = d.phone ? normalizePhone(d.phone) : null;
    if (d.phone && !phone) return fail(t.errors.badInput, "phone");
    patch.phone_e164 = phone;
  }
  if (d.email !== undefined) {
    const email = d.email ? normalizeEmail(d.email) : null;
    if (d.email && !email) return fail(t.errors.badInput, "email");
    patch.email = email;
  }
  if (d.companyName !== undefined) patch.company_name = d.companyName || null;
  if (d.source !== undefined) patch.source = d.source;
  if (d.notes !== undefined) patch.notes = d.notes || null;
  if (d.tags !== undefined) patch.tags = d.tags;
  if (d.projectId !== undefined) patch.project_id = d.projectId || null;

  const supabase = await createClient();
  const { error } = await supabase.from("crm_contacts").update(patch as never).eq("id", d.id).eq("org_id", viewer.org.id);
  if (error) {
    if (error.code === "23505") return fail(t.errors.duplicate);
    if (error.code === "23514") return fail(error.message.includes("reach") ? t.errors.needReach : t.errors.badInput);
    return fail(error.code === "42501" ? t.errors.notAllowed : t.errors.generic);
  }
  await recordEvent(supabase, {
    orgId: viewer.org.id,
    type: "contact.updated",
    entityType: "contact",
    entityId: d.id,
    payload: { title: d.fullName ?? undefined, fields: Object.keys(patch) },
  });
  refresh(d.id);
  return ok();
}

const assignSchema = z.object({ id: uuidSchema, ownerId: uuidSchema.nullable() });

/** Ownership is a manager's call; a member may take an unowned lead themselves. */
export async function assignContact(input: unknown): Promise<ActionResult> {
  const { viewer, t, refused } = await crmViewer();
  if (refused) return refused;
  const parsed = assignSchema.safeParse(input);
  if (!parsed.success) return fail(t.errors.badInput);
  const selfClaim = parsed.data.ownerId === viewer.userId;
  if (!viewerCan(viewer, "crm.assign") && !selfClaim) return fail(t.errors.notAllowed);
  if (parsed.data.ownerId) {
    const members = await getOrgMembers(viewer.org.id);
    if (!members.some((m) => m.userId === parsed.data.ownerId)) return fail(t.errors.badInput, "ownerId");
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crm_contacts")
    .update({ owner_id: parsed.data.ownerId })
    .eq("id", parsed.data.id)
    .eq("org_id", viewer.org.id)
    .select("full_name, owner_id")
    .maybeSingle();
  if (error) return fail(error.code === "42501" ? t.errors.notAllowed : t.errors.generic);
  if (!data) return fail(t.errors.notFound);

  // The database wrote the history and the in-app line; email follows here.
  if (data.owner_id && data.owner_id !== viewer.userId) {
    const { data: email } = await supabase.rpc("org_member_email", { p_user: data.owner_id });
    if (email) {
      const locale = viewer.org.language;
      const body = writeMessage("lead_assigned", locale, { actor: viewer.fullName?.trim() || "—", task: data.full_name });
      await notifyWith(supabase, {
        orgId: viewer.org.id,
        userId: data.owner_id,
        event: "lead_assigned",
        locale,
        body,
        email,
        subject: writeSubject(viewer.org.name, body),
        url: `${siteUrl()}/crm/${parsed.data.id}`,
        href: `/crm/${parsed.data.id}`,
        dedupeKey: `crm:${parsed.data.id}:assigned:${data.owner_id}:${new Date().toISOString().slice(0, 16)}`,
      });
    }
  }
  refresh(parsed.data.id);
  return ok();
}

const activitySchema = z.object({
  contactId: uuidSchema,
  kind: z.enum(ACTIVITY_KINDS),
  body: z.string().trim().min(1).max(4000),
  opportunityId: uuidSchema.optional(),
});

/** A call, a meeting, a note: what happened, in the contact's own timeline. */
export async function logActivity(input: unknown): Promise<ActionResult> {
  const { viewer, t, refused } = await crmViewer();
  if (refused) return refused;
  if (!viewerCan(viewer, "crm.write")) return fail(t.errors.notAllowed);
  const parsed = activitySchema.safeParse(input);
  if (!parsed.success) return fail(t.errors.badInput, "body");
  const supabase = await createClient();
  const { error } = await supabase.from("crm_activities").insert({
    org_id: viewer.org.id,
    contact_id: parsed.data.contactId,
    opportunity_id: parsed.data.opportunityId ?? null,
    kind: parsed.data.kind,
    body: parsed.data.body,
    actor_kind: "user",
    actor_id: viewer.userId,
  });
  if (error) return fail(error.code === "42501" ? t.errors.notAllowed : t.errors.generic);
  refresh(parsed.data.contactId);
  return ok();
}

const followUpSchema = z.object({
  contactId: uuidSchema,
  at: z.string().datetime().nullable(),
  note: z.string().trim().max(200).optional().or(z.literal("")),
});

/** The next action and when: what Today reads. */
export async function setFollowUp(input: unknown): Promise<ActionResult> {
  const { viewer, t, refused } = await crmViewer();
  if (refused) return refused;
  if (!viewerCan(viewer, "crm.write")) return fail(t.errors.notAllowed);
  const parsed = followUpSchema.safeParse(input);
  if (!parsed.success) return fail(t.errors.badInput, "at");
  const supabase = await createClient();
  const { error } = await supabase
    .from("crm_contacts")
    .update({ next_action_at: parsed.data.at, next_action_note: parsed.data.at ? parsed.data.note || null : null })
    .eq("id", parsed.data.contactId)
    .eq("org_id", viewer.org.id);
  if (error) return fail(error.code === "42501" ? t.errors.notAllowed : t.errors.generic);
  refresh(parsed.data.contactId);
  return ok();
}

export async function convertToCustomer(input: unknown): Promise<ActionResult> {
  const { viewer, t, refused } = await crmViewer();
  if (refused) return refused;
  if (!viewerCan(viewer, "crm.write")) return fail(t.errors.notAllowed);
  const parsed = uuidSchema.safeParse(input);
  if (!parsed.success) return fail(t.errors.badInput);
  const supabase = await createClient();
  const { error } = await supabase.from("crm_contacts").update({ kind: "customer" }).eq("id", parsed.data).eq("org_id", viewer.org.id);
  if (error) return fail(error.code === "42501" ? t.errors.notAllowed : t.errors.generic);
  refresh(parsed.data);
  return ok();
}

const archiveSchema = z.object({ id: uuidSchema, archived: z.boolean() });

export async function archiveContact(input: unknown): Promise<ActionResult> {
  const { viewer, t, refused } = await crmViewer();
  if (refused) return refused;
  if (!viewerCan(viewer, "crm.assign")) return fail(t.errors.notAllowed);
  const parsed = archiveSchema.safeParse(input);
  if (!parsed.success) return fail(t.errors.badInput);
  const supabase = await createClient();
  const { error } = await supabase
    .from("crm_contacts")
    .update({ archived_at: parsed.data.archived ? new Date().toISOString() : null })
    .eq("id", parsed.data.id)
    .eq("org_id", viewer.org.id);
  if (error) return fail(error.code === "23505" ? t.errors.duplicate : error.code === "42501" ? t.errors.notAllowed : t.errors.generic);
  refresh(parsed.data.id);
  return ok();
}

const moveSchema = z.object({ opportunityId: uuidSchema, stageId: uuidSchema, note: z.string().trim().max(1000).optional().or(z.literal("")) });

/** Move a deal along the pipeline; won and lost close it (the database decides). */
export async function moveOpportunity(input: unknown): Promise<ActionResult<{ status: string }>> {
  const { viewer, t, refused } = await crmViewer();
  if (refused) return refused;
  if (!viewerCan(viewer, "crm.write")) return fail(t.errors.notAllowed);
  const parsed = moveSchema.safeParse(input);
  if (!parsed.success) return fail(t.errors.badInput);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("crm_move_opportunity", {
    p_opportunity: parsed.data.opportunityId,
    p_stage: parsed.data.stageId,
    p_note: parsed.data.note || undefined,
  });
  if (error) {
    if (error.message.includes("not in this pipeline")) return fail(t.errors.stageOutside);
    if (error.message.includes("closed")) return fail(t.errors.closed);
    return fail(error.code === "42501" ? t.errors.notAllowed : t.errors.generic);
  }
  const row = data as { contact_id: string; status: string } | null;
  refresh(row?.contact_id);
  kickAutomation(viewer.org.id);
  return ok({ status: row?.status ?? "open" });
}

const dealSchema = z.object({
  contactId: uuidSchema,
  title: z.string().trim().min(1).max(140),
  value: z.number().min(0).max(1e12).optional(),
  projectId: uuidSchema.optional().or(z.literal("")),
});

export async function createOpportunity(input: unknown): Promise<ActionResult<{ id: string }>> {
  const { viewer, t, refused } = await crmViewer();
  if (refused) return refused;
  if (!viewerCan(viewer, "crm.write")) return fail(t.errors.notAllowed);
  const parsed = dealSchema.safeParse(input);
  if (!parsed.success) return fail(t.errors.badInput, "title");
  const supabase = await createClient();
  const { data: pipelineId } = await supabase.rpc("crm_install_default_pipeline", { p_org: viewer.org.id });
  if (!pipelineId) return fail(t.errors.generic);
  const { data: stage } = await supabase
    .from("crm_pipeline_stages")
    .select("id")
    .eq("pipeline_id", pipelineId)
    .eq("kind", "open")
    .order("position", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!stage) return fail(t.errors.generic);
  const { data, error } = await supabase
    .from("crm_opportunities")
    .insert({
      org_id: viewer.org.id,
      contact_id: parsed.data.contactId,
      pipeline_id: pipelineId,
      stage_id: stage.id,
      title: parsed.data.title,
      value: parsed.data.value ?? null,
      owner_id: viewer.userId,
      project_id: parsed.data.projectId || null,
      created_by: viewer.userId,
    })
    .select("id")
    .single();
  if (error || !data) return fail(error?.code === "42501" ? t.errors.notAllowed : t.errors.generic);
  refresh(parsed.data.contactId);
  return ok({ id: data.id });
}

const taskSchema = z.object({
  contactId: uuidSchema,
  assigneeId: uuidSchema,
  title: z.string().trim().min(2).max(140),
  preset: z.enum(DEADLINE_PRESETS as unknown as [string, ...string[]]),
  opportunityId: uuidSchema.optional(),
});

/** Work for a customer: a real task with the customer's name on its origin. */
export async function createTaskForContact(input: unknown): Promise<ActionResult<{ taskId: string }>> {
  const { viewer, t, refused } = await crmViewer();
  if (refused) return refused;
  const parsed = taskSchema.safeParse(input);
  if (!parsed.success) return fail(t.errors.badInput, "title");
  const supabase = await createClient();
  const { data: contact } = await supabase
    .from("crm_contacts")
    .select("id, full_name, project_id")
    .eq("id", parsed.data.contactId)
    .eq("org_id", viewer.org.id)
    .maybeSingle();
  if (!contact) return fail(t.errors.notFound);
  const created = await createTask({
    assigneeId: parsed.data.assigneeId,
    title: parsed.data.title,
    priority: "normal",
    proofRequired: false,
    deadline: { kind: "preset", preset: parsed.data.preset },
    origin: { kind: "crm", id: contact.id, label: contact.full_name },
    links: {
      contactId: contact.id,
      opportunityId: parsed.data.opportunityId,
      projectId: contact.project_id ?? undefined,
    },
  });
  if (!created.ok) return created;
  await supabase.from("crm_activities").insert({
    org_id: viewer.org.id,
    contact_id: contact.id,
    opportunity_id: parsed.data.opportunityId ?? null,
    kind: "task",
    body: parsed.data.title,
    actor_kind: "user",
    actor_id: viewer.userId,
    task_id: created.data.taskId,
  });
  refresh(contact.id);
  return ok({ taskId: created.data.taskId });
}

// ------------------------------------------------------------ pipeline --

const stageSchema = z.object({
  name: z.string().trim().min(1).max(40),
  kind: z.enum(["open", "won", "lost"]).default("open"),
});

export async function addStage(input: unknown): Promise<ActionResult<{ id: string }>> {
  const { viewer, t, refused } = await crmViewer();
  if (refused) return refused;
  if (!viewerCan(viewer, "crm.pipeline.manage")) return fail(t.errors.notAllowed);
  const parsed = stageSchema.safeParse(input);
  if (!parsed.success) return fail(t.errors.badInput, "name");
  const supabase = await createClient();
  const { data: pipelineId } = await supabase.rpc("crm_install_default_pipeline", { p_org: viewer.org.id });
  if (!pipelineId) return fail(t.errors.generic);
  const { data: last } = await supabase
    .from("crm_pipeline_stages")
    .select("position")
    .eq("pipeline_id", pipelineId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const key = `${parsed.data.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 30) || "stage"}_${Date.now().toString(36)}`;
  const { data, error } = await supabase
    .from("crm_pipeline_stages")
    .insert({
      org_id: viewer.org.id,
      pipeline_id: pipelineId,
      key,
      name: parsed.data.name,
      kind: parsed.data.kind,
      position: (last?.position ?? -1) + 1,
    })
    .select("id")
    .single();
  if (error || !data) return fail(t.errors.generic);
  refresh();
  revalidatePath("/crm/settings");
  return ok({ id: data.id });
}

const renameSchema = z.object({ id: uuidSchema, name: z.string().trim().min(1).max(40) });

export async function renameStage(input: unknown): Promise<ActionResult> {
  const { viewer, t, refused } = await crmViewer();
  if (refused) return refused;
  if (!viewerCan(viewer, "crm.pipeline.manage")) return fail(t.errors.notAllowed);
  const parsed = renameSchema.safeParse(input);
  if (!parsed.success) return fail(t.errors.badInput, "name");
  const supabase = await createClient();
  const { error } = await supabase.from("crm_pipeline_stages").update({ name: parsed.data.name }).eq("id", parsed.data.id).eq("org_id", viewer.org.id);
  if (error) return fail(t.errors.generic);
  refresh();
  revalidatePath("/crm/settings");
  return ok();
}

export async function deleteStage(input: unknown): Promise<ActionResult> {
  const { viewer, t, refused } = await crmViewer();
  if (refused) return refused;
  if (!viewerCan(viewer, "crm.pipeline.manage")) return fail(t.errors.notAllowed);
  const parsed = uuidSchema.safeParse(input);
  if (!parsed.success) return fail(t.errors.badInput);
  const supabase = await createClient();
  const { count } = await supabase.from("crm_opportunities").select("id", { count: "exact", head: true }).eq("stage_id", parsed.data);
  if ((count ?? 0) > 0) return fail(t.pipeline.cannotDelete);
  const { error } = await supabase.from("crm_pipeline_stages").delete().eq("id", parsed.data).eq("org_id", viewer.org.id);
  if (error) return fail(t.errors.generic);
  refresh();
  revalidatePath("/crm/settings");
  return ok();
}

const orderSchema = z.object({ ids: z.array(uuidSchema).min(1).max(30) });

export async function reorderStages(input: unknown): Promise<ActionResult> {
  const { viewer, t, refused } = await crmViewer();
  if (refused) return refused;
  if (!viewerCan(viewer, "crm.pipeline.manage")) return fail(t.errors.notAllowed);
  const parsed = orderSchema.safeParse(input);
  if (!parsed.success) return fail(t.errors.badInput);
  const supabase = await createClient();
  for (const [position, id] of parsed.data.ids.entries()) {
    const { error } = await supabase.from("crm_pipeline_stages").update({ position }).eq("id", id).eq("org_id", viewer.org.id);
    if (error) return fail(t.errors.generic);
  }
  refresh();
  revalidatePath("/crm/settings");
  return ok();
}

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
