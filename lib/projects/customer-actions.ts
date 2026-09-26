"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { requireOrg, viewerCan, hasModule, type OrgViewer } from "@/lib/auth/session";
import { getPortal } from "@/lib/i18n/portal";
import { fail, ok, uuidSchema, type ActionResult } from "@/lib/validation";
import { notifyWith } from "@/lib/notify";
import { recordEvent } from "@/lib/events/emit";
import type { Json } from "@/lib/supabase/types";

/**
 * The business side of the customer's page: link the customer, give them
 * the door, shape the story (milestones, updates, visibility), ask them to
 * decide, answer them. Every write is a manager's; the database agrees.
 */

async function manager(): Promise<{ viewer: OrgViewer; t: ReturnType<typeof getPortal>["business"]; refused: ActionResult<never> | null }> {
  const viewer = await requireOrg();
  const t = getPortal(viewer.org.language).business;
  if (!viewerCan(viewer, "projects.manage")) return { viewer, t, refused: fail(t.errors.notAllowed) };
  return { viewer, t, refused: null };
}

function refresh(projectId: string) {
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  revalidatePath("/aaj");
  revalidatePath("/portal", "layout");
}

const linkSchema = z.object({ projectId: uuidSchema, contactId: uuidSchema.nullable() });

export async function setProjectCustomer(input: unknown): Promise<ActionResult> {
  const { viewer, t, refused } = await manager();
  if (refused) return refused;
  const parsed = linkSchema.safeParse(input);
  if (!parsed.success) return fail(t.errors.badInput);
  const supabase = await createClient();
  const { error } = await supabase.from("projects").update({ contact_id: parsed.data.contactId }).eq("id", parsed.data.projectId).eq("org_id", viewer.org.id);
  if (error) return fail(t.errors.generic);
  if (parsed.data.contactId) {
    await supabase.from("crm_contacts").update({ project_id: parsed.data.projectId }).eq("id", parsed.data.contactId).eq("org_id", viewer.org.id).is("project_id", null);
  }
  refresh(parsed.data.projectId);
  return ok();
}

const summarySchema = z.object({ projectId: uuidSchema, summary: z.string().trim().max(240) });

export async function setCustomerSummary(input: unknown): Promise<ActionResult> {
  const { viewer, t, refused } = await manager();
  if (refused) return refused;
  const parsed = summarySchema.safeParse(input);
  if (!parsed.success) return fail(t.errors.badInput);
  const supabase = await createClient();
  const { error } = await supabase.from("projects").update({ customer_summary: parsed.data.summary || null }).eq("id", parsed.data.projectId).eq("org_id", viewer.org.id);
  if (error) return fail(t.errors.generic);
  refresh(parsed.data.projectId);
  return ok();
}

/** Give the project's customer a door: an invite link bound to their email. */
export async function grantCustomerAccess(input: unknown): Promise<ActionResult<{ url: string }>> {
  const { viewer, t, refused } = await manager();
  if (refused) return refused;
  if (!hasModule(viewer, "customer_experience")) return fail(t.errors.moduleOff);
  const parsed = uuidSchema.safeParse(input);
  if (!parsed.success) return fail(t.errors.badInput);
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, name, contact_id, crm_contacts!projects_contact_id_fkey(email, full_name)")
    .eq("id", parsed.data)
    .eq("org_id", viewer.org.id)
    .maybeSingle();
  if (!project) return fail(t.errors.notFound);
  if (!project.contact_id) return fail(t.errors.noContact);
  const contact = project.crm_contacts as { email: string | null; full_name: string } | null;
  if (!contact?.email) return fail(t.errors.noEmail);

  let { data: access } = await supabase.from("customer_access").select("id, invite_token, status").eq("org_id", viewer.org.id).eq("contact_id", project.contact_id).maybeSingle();
  if (!access) {
    const token = randomBytes(16).toString("hex");
    const { data: created, error } = await supabase
      .from("customer_access")
      .insert({ org_id: viewer.org.id, contact_id: project.contact_id, email: contact.email, invite_token: token, invited_by: viewer.userId })
      .select("id, invite_token, status")
      .single();
    if (error || !created) return fail(error?.code === "42501" ? t.errors.notAllowed : t.errors.generic);
    access = created;
  } else if (access.status === "revoked") {
    const { data: reopened } = await supabase.from("customer_access").update({ status: "invited", revoked_at: null }).eq("id", access.id).select("id, invite_token, status").single();
    if (reopened) access = reopened;
  }
  const { error: linkError } = await supabase
    .from("customer_project_access")
    .upsert({ org_id: viewer.org.id, customer_access_id: access.id, project_id: project.id, granted_by: viewer.userId }, { onConflict: "customer_access_id,project_id" });
  if (linkError) return fail(t.errors.generic);
  const url = `${siteUrl()}/portal/join/${access.invite_token}`;
  refresh(project.id);
  return ok({ url });
}

export async function revokeCustomerAccess(input: unknown): Promise<ActionResult> {
  const { viewer, t, refused } = await manager();
  if (refused) return refused;
  const parsed = z.object({ accessId: uuidSchema, projectId: uuidSchema }).safeParse(input);
  if (!parsed.success) return fail(t.errors.badInput);
  const supabase = await createClient();
  const { error } = await supabase.from("customer_access").update({ status: "revoked", revoked_at: new Date().toISOString() }).eq("id", parsed.data.accessId).eq("org_id", viewer.org.id);
  if (error) return fail(t.errors.generic);
  refresh(parsed.data.projectId);
  return ok();
}

// ------------------------------------------------------------- milestones --

const milestoneSchema = z.object({
  projectId: uuidSchema,
  name: z.string().trim().min(1).max(120),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  customerVisible: z.boolean().default(true),
});

export async function addMilestone(input: unknown): Promise<ActionResult<{ id: string }>> {
  const { viewer, t, refused } = await manager();
  if (refused) return refused;
  const parsed = milestoneSchema.safeParse(input);
  if (!parsed.success) return fail(t.errors.badInput, "name");
  const supabase = await createClient();
  const { data: last } = await supabase.from("project_milestones").select("position").eq("project_id", parsed.data.projectId).order("position", { ascending: false }).limit(1).maybeSingle();
  const { data, error } = await supabase
    .from("project_milestones")
    .insert({
      org_id: viewer.org.id,
      project_id: parsed.data.projectId,
      name: parsed.data.name,
      due_date: parsed.data.dueDate || null,
      customer_visible: parsed.data.customerVisible,
      position: (last?.position ?? -1) + 1,
      created_by: viewer.userId,
    })
    .select("id")
    .single();
  if (error || !data) return fail(error?.code === "42501" ? t.errors.notAllowed : t.errors.generic);
  refresh(parsed.data.projectId);
  return ok({ id: data.id });
}

const milestoneUpdate = z.object({
  id: uuidSchema,
  projectId: uuidSchema,
  status: z.enum(["planned", "in_progress", "done"]).optional(),
  customerVisible: z.boolean().optional(),
  remove: z.boolean().optional(),
});

export async function updateMilestone(input: unknown): Promise<ActionResult> {
  const { viewer, t, refused } = await manager();
  if (refused) return refused;
  const parsed = milestoneUpdate.safeParse(input);
  if (!parsed.success) return fail(t.errors.badInput);
  const supabase = await createClient();
  if (parsed.data.remove) {
    const { error } = await supabase.from("project_milestones").delete().eq("id", parsed.data.id).eq("org_id", viewer.org.id);
    if (error) return fail(t.errors.generic);
  } else {
    const patch: Record<string, unknown> = {};
    if (parsed.data.status) patch.status = parsed.data.status;
    if (parsed.data.customerVisible !== undefined) patch.customer_visible = parsed.data.customerVisible;
    const { error } = await supabase.from("project_milestones").update(patch as never).eq("id", parsed.data.id).eq("org_id", viewer.org.id);
    if (error) return fail(t.errors.generic);
  }
  refresh(parsed.data.projectId);
  return ok();
}

// ---------------------------------------------------------------- updates --

const updateSchema = z.object({ projectId: uuidSchema, body: z.string().trim().min(1).max(2000), customerVisible: z.boolean() });

export async function publishUpdate(input: unknown): Promise<ActionResult> {
  const { viewer, t, refused } = await manager();
  if (refused) return refused;
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return fail(t.errors.badInput, "body");
  const supabase = await createClient();
  const { error } = await supabase.from("project_updates").insert({
    org_id: viewer.org.id,
    project_id: parsed.data.projectId,
    kind: "note",
    body: parsed.data.body,
    customer_visible: parsed.data.customerVisible,
    actor_kind: "user",
    created_by: viewer.userId,
  });
  if (error) return fail(error.code === "42501" ? t.errors.notAllowed : t.errors.generic);
  refresh(parsed.data.projectId);
  return ok();
}

const visibilitySchema = z.object({ kind: z.enum(["document", "proof"]), id: uuidSchema, visible: z.boolean(), projectId: uuidSchema.optional() });

export async function setCustomerVisibility(input: unknown): Promise<ActionResult> {
  const { viewer, t, refused } = await manager();
  if (refused) return refused;
  const parsed = visibilitySchema.safeParse(input);
  if (!parsed.success) return fail(t.errors.badInput);
  const supabase = await createClient();
  const { error } = await supabase
    .from(parsed.data.kind === "document" ? "documents" : "proofs")
    .update({ customer_visible: parsed.data.visible })
    .eq("id", parsed.data.id)
    .eq("org_id", viewer.org.id);
  if (error) return fail(error.code === "42501" ? t.errors.notAllowed : t.errors.generic);
  if (parsed.data.projectId) refresh(parsed.data.projectId);
  revalidatePath("/", "layout");
  return ok();
}

// -------------------------------------------------------------- decisions --

const decisionSchema = z.object({
  projectId: uuidSchema,
  title: z.string().trim().min(1).max(140),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  options: z.array(z.string().trim().min(1).max(60)).min(1).max(12),
  blocksTaskId: uuidSchema.optional().or(z.literal("")),
  blocksRecordId: uuidSchema.optional().or(z.literal("")),
  unblockRecordStatus: z.string().max(40).optional().or(z.literal("")),
});

/** Ask the customer to choose; the answer will open whatever waits on it. */
export async function requestDecision(input: unknown): Promise<ActionResult<{ id: string }>> {
  const { viewer, t, refused } = await manager();
  if (refused) return refused;
  if (!hasModule(viewer, "customer_experience")) return fail(t.errors.moduleOff);
  const parsed = decisionSchema.safeParse(input);
  if (!parsed.success) return fail(t.errors.badInput, String(parsed.error.issues[0]?.path[0] ?? ""));
  const d = parsed.data;
  const seen = new Set<string>();
  const options = d.options
    .map((label) => ({ key: label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40) || "option", label }))
    .filter((o) => (seen.has(o.key) ? false : (seen.add(o.key), true)));
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customer_decisions")
    .insert({
      org_id: viewer.org.id,
      project_id: d.projectId,
      title: d.title,
      description: d.description || null,
      options: options as unknown as Json,
      blocks_task_id: d.blocksTaskId || null,
      blocks_record_id: d.blocksRecordId || null,
      unblock_record_status: d.unblockRecordStatus || null,
      requested_by: viewer.userId,
    })
    .select("id")
    .single();
  if (error || !data) return fail(error?.code === "42501" ? t.errors.notAllowed : t.errors.generic);

  // The customer's copy of the question: on their page, and by email if they have one.
  const { data: access } = await supabase
    .from("customer_access")
    .select("email, user_id, crm_contacts(full_name)")
    .eq("org_id", viewer.org.id)
    .eq("contact_id", (await supabase.from("projects").select("contact_id").eq("id", d.projectId).maybeSingle()).data?.contact_id ?? "")
    .maybeSingle();
  if (access?.email) {
    await notifyWith(supabase, {
      orgId: viewer.org.id,
      userId: viewer.userId,
      event: "decision_requested",
      locale: viewer.org.language,
      body: `${d.title} · ${options.map((o) => o.label).join(" / ")}`,
      email: access.email,
      subject: `${viewer.org.name} · ${d.title}`,
      url: `${siteUrl()}/portal/projects/${d.projectId}`,
      dedupeKey: `decision:${data.id}:asked`,
    }).catch(() => null);
  }
  await recordEvent(supabase, { orgId: viewer.org.id, type: "customer_decision.requested", entityType: "customer_decision", entityId: data.id, payload: { title: d.title, project_id: d.projectId }, key: `decision:${data.id}:requested` });
  refresh(d.projectId);
  return ok({ id: data.id });
}

export async function cancelDecision(input: unknown): Promise<ActionResult> {
  const { viewer, t, refused } = await manager();
  if (refused) return refused;
  const parsed = z.object({ id: uuidSchema, projectId: uuidSchema }).safeParse(input);
  if (!parsed.success) return fail(t.errors.badInput);
  const supabase = await createClient();
  const { error } = await supabase.from("customer_decisions").update({ status: "cancelled" }).eq("id", parsed.data.id).eq("org_id", viewer.org.id).eq("status", "open");
  if (error) return fail(t.errors.generic);
  await supabase.from("tasks").update({ blocked_by_decision_id: null }).eq("blocked_by_decision_id", parsed.data.id);
  refresh(parsed.data.projectId);
  return ok();
}

// --------------------------------------------------------------- messages --

const replySchema = z.object({ projectId: uuidSchema, body: z.string().trim().min(1).max(4000) });

export async function replyToCustomer(input: unknown): Promise<ActionResult> {
  const viewer = await requireOrg();
  const t = getPortal(viewer.org.language).business;
  const parsed = replySchema.safeParse(input);
  if (!parsed.success) return fail(t.errors.badInput, "body");
  const supabase = await createClient();
  const { error } = await supabase.from("customer_messages").insert({
    org_id: viewer.org.id,
    project_id: parsed.data.projectId,
    author_kind: "business",
    author_user_id: viewer.userId,
    body: parsed.data.body,
  });
  if (error) return fail(error.code === "42501" ? t.errors.notAllowed : t.errors.generic);
  await supabase
    .from("customer_messages")
    .update({ read_by_business_at: new Date().toISOString() })
    .eq("project_id", parsed.data.projectId)
    .eq("author_kind", "customer")
    .is("read_by_business_at", null);
  refresh(parsed.data.projectId);
  return ok();
}

export async function markCustomerMessagesRead(input: unknown): Promise<ActionResult> {
  const viewer = await requireOrg();
  const parsed = uuidSchema.safeParse(input);
  if (!parsed.success) return fail("");
  const supabase = await createClient();
  await supabase
    .from("customer_messages")
    .update({ read_by_business_at: new Date().toISOString() })
    .eq("org_id", viewer.org.id)
    .eq("project_id", parsed.data)
    .eq("author_kind", "customer")
    .is("read_by_business_at", null);
  refresh(parsed.data);
  return ok();
}

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
