"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { requireOrg, viewerCan, hasModule } from "@/lib/auth/session";
import { getVendors } from "@/lib/i18n/vendors";
import { fail, ok, uuidSchema, type ActionResult } from "@/lib/validation";
import { createTask } from "@/lib/tasks/create";
import { normalizeEmail, normalizePhone } from "@/lib/crm/model";

async function vendorsViewer() {
  const viewer = await requireOrg();
  const t = getVendors(viewer.org.language);
  if (!hasModule(viewer, "vendors")) return { viewer, t, refused: fail(t.errors.moduleOff) as ActionResult<never> };
  return { viewer, t, refused: null };
}

function refresh(assignmentId?: string, projectId?: string | null) {
  revalidatePath("/vendors", "layout");
  revalidatePath("/aaj");
  if (assignmentId) revalidatePath(`/vendors/assignments/${assignmentId}`);
  if (projectId) revalidatePath(`/projects/${projectId}`);
}

const vendorSchema = z.object({
  id: uuidSchema.optional(),
  name: z.string().trim().min(1).max(120),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  email: z.string().trim().max(254).optional().or(z.literal("")),
  category: z.string().trim().max(60).optional().or(z.literal("")),
  gstin: z.string().trim().max(20).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  status: z.enum(["active", "inactive"]).optional(),
});

export async function saveVendor(input: unknown): Promise<ActionResult<{ id: string }>> {
  const { viewer, t, refused } = await vendorsViewer();
  if (refused) return refused;
  if (!viewerCan(viewer, "vendors.write")) return fail(t.errors.notAllowed);
  const parsed = vendorSchema.safeParse(input);
  if (!parsed.success) return fail(t.errors.badInput, String(parsed.error.issues[0]?.path[0] ?? ""));
  const d = parsed.data;
  const phone = d.phone ? normalizePhone(d.phone) : null;
  if (d.phone && !phone) return fail(t.errors.badInput, "phone");
  const email = d.email ? normalizeEmail(d.email) : null;
  if (d.email && !email) return fail(t.errors.badInput, "email");
  const supabase = await createClient();
  const row = { name: d.name, phone_e164: phone, email, category: d.category || null, gstin: d.gstin ? d.gstin.toUpperCase() : null, notes: d.notes || null, ...(d.status ? { status: d.status } : {}) };
  if (d.id) {
    const { error } = await supabase.from("vendors").update(row).eq("id", d.id).eq("org_id", viewer.org.id);
    if (error) return fail(error.code === "42501" ? t.errors.notAllowed : t.errors.generic);
    refresh();
    return ok({ id: d.id });
  }
  const { data, error } = await supabase.from("vendors").insert({ org_id: viewer.org.id, created_by: viewer.userId, ...row }).select("id").single();
  if (error || !data) return fail(error?.code === "42501" ? t.errors.notAllowed : t.errors.generic);
  refresh();
  return ok({ id: data.id });
}

const assignSchema = z.object({
  vendorId: uuidSchema,
  projectId: uuidSchema.optional().or(z.literal("")),
  recordId: uuidSchema.optional().or(z.literal("")),
  title: z.string().trim().min(1).max(140),
  details: z.string().trim().max(2000).optional().or(z.literal("")),
  amount: z.number().min(0).max(1e12).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  ownerId: uuidSchema.optional().or(z.literal("")),
  customerVisible: z.boolean().default(false),
  recordStatusOnSubmit: z.string().max(40).optional().or(z.literal("")),
  recordStatusOnVerify: z.string().max(40).optional().or(z.literal("")),
});

/**
 * Give a vendor work. When an owner inside the business is named, a real
 * task is made for them: collect the work, attach proof, submit. The task
 * and the assignment point at each other, so proof lives in one place.
 */
export async function assignVendorWork(input: unknown): Promise<ActionResult<{ id: string }>> {
  const { viewer, t, refused } = await vendorsViewer();
  if (refused) return refused;
  if (!viewerCan(viewer, "vendors.write")) return fail(t.errors.notAllowed);
  const parsed = assignSchema.safeParse(input);
  if (!parsed.success) return fail(t.errors.badInput, String(parsed.error.issues[0]?.path[0] ?? ""));
  const d = parsed.data;
  const supabase = await createClient();
  const { data: vendor } = await supabase.from("vendors").select("id, name").eq("id", d.vendorId).eq("org_id", viewer.org.id).maybeSingle();
  if (!vendor) return fail(t.errors.notFound);

  const { data, error } = await supabase
    .from("vendor_assignments")
    .insert({
      org_id: viewer.org.id,
      vendor_id: d.vendorId,
      project_id: d.projectId || null,
      record_id: d.recordId || null,
      title: d.title,
      details: d.details || null,
      amount: d.amount ?? null,
      due_date: d.dueDate || null,
      customer_visible: d.customerVisible,
      record_status_on_submit: d.recordStatusOnSubmit || null,
      record_status_on_verify: d.recordStatusOnVerify || null,
      created_by: viewer.userId,
    })
    .select("id")
    .single();
  if (error || !data) return fail(error?.code === "42501" ? t.errors.notAllowed : t.errors.generic);

  if (d.ownerId) {
    const dueAt = d.dueDate ? new Date(`${d.dueDate}T12:30:00.000Z`) : null; // 18:00 IST
    const created = await createTask({
      assigneeId: d.ownerId,
      title: `${vendor.name}: ${d.title}`,
      priority: "normal",
      proofRequired: true,
      deadline: dueAt && dueAt.getTime() > Date.now() ? { kind: "at", at: dueAt.toISOString() } : { kind: "preset", preset: "tomorrow_morning" },
      origin: { kind: "vendor_action", id: data.id, label: vendor.name },
      links: { projectId: d.projectId || undefined, recordId: d.recordId || undefined, vendorAssignmentId: data.id },
    });
    if (created.ok) {
      await supabase.from("vendor_assignments").update({ task_id: created.data.taskId }).eq("id", data.id).eq("org_id", viewer.org.id);
      await supabase.from("tasks").update({ vendor_assignment_id: data.id }).eq("id", created.data.taskId);
    }
  }
  refresh(data.id, d.projectId || null);
  return ok({ id: data.id });
}

const progressSchema = z.object({ id: uuidSchema, status: z.enum(["in_progress", "submitted"]), note: z.string().trim().max(2000).optional().or(z.literal("")) });

/** The task owner (or a manager) reports the vendor's progress; submitting hands it to a manager. */
export async function progressVendorWork(input: unknown): Promise<ActionResult> {
  const { viewer, t, refused } = await vendorsViewer();
  if (refused) return refused;
  const parsed = progressSchema.safeParse(input);
  if (!parsed.success) return fail(t.errors.badInput);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vendor_assignments")
    .update({ execution_status: parsed.data.status, ...(parsed.data.status === "submitted" ? { submitted_note: parsed.data.note || null } : {}) })
    .eq("id", parsed.data.id)
    .eq("org_id", viewer.org.id)
    .select("id, project_id")
    .maybeSingle();
  if (error) return fail(error.code === "42501" ? t.errors.notAllowed : error.code === "22023" ? t.errors.notSubmitted : t.errors.generic);
  if (!data) return fail(t.errors.notAllowed);
  refresh(data.id, data.project_id);
  return ok();
}

const verifySchema = z.object({ id: uuidSchema, verdict: z.enum(["verified", "rejected"]), note: z.string().trim().max(2000).optional().or(z.literal("")) });

/** A manager's word: the work is done, or it goes back. */
export async function verifyVendorWork(input: unknown): Promise<ActionResult> {
  const { viewer, t, refused } = await vendorsViewer();
  if (refused) return refused;
  if (!viewerCan(viewer, "vendors.verify")) return fail(t.errors.notAllowed);
  const parsed = verifySchema.safeParse(input);
  if (!parsed.success) return fail(t.errors.badInput);
  if (parsed.data.verdict === "rejected" && !parsed.data.note) return fail(t.errors.needNote, "note");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vendor_assignments")
    .update({ execution_status: parsed.data.verdict, rejection_note: parsed.data.verdict === "rejected" ? parsed.data.note || null : null })
    .eq("id", parsed.data.id)
    .eq("org_id", viewer.org.id)
    .select("id, project_id, task_id")
    .maybeSingle();
  if (error) return fail(error.code === "22023" ? t.errors.notSubmitted : error.code === "42501" ? t.errors.notAllowed : t.errors.generic);
  if (!data) return fail(t.errors.notFound);
  // The internal task follows: verified work is verified work.
  if (data.task_id && parsed.data.verdict === "verified") {
    const { data: task } = await supabase.from("tasks").select("state").eq("id", data.task_id).maybeSingle();
    if (task?.state === "done") await supabase.from("tasks").update({ state: "verified", verified_at: new Date().toISOString() }).eq("id", data.task_id);
  }
  refresh(data.id, data.project_id);
  return ok();
}

const paymentSchema = z.object({ assignmentId: uuidSchema, amount: z.number().positive().max(1e12), paidAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")), note: z.string().trim().max(500).optional().or(z.literal("")) });

export async function recordVendorPayment(input: unknown): Promise<ActionResult> {
  const { viewer, t, refused } = await vendorsViewer();
  if (refused) return refused;
  if (!viewerCan(viewer, "vendors.payment.record")) return fail(t.errors.notAllowed);
  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) return fail(t.errors.badInput, "amount");
  const supabase = await createClient();
  const { error } = await supabase.from("vendor_payments").insert({
    org_id: viewer.org.id,
    assignment_id: parsed.data.assignmentId,
    amount: parsed.data.amount,
    ...(parsed.data.paidAt ? { paid_at: parsed.data.paidAt } : {}),
    note: parsed.data.note || null,
    recorded_by: viewer.userId,
  });
  if (error) return fail(error.code === "42501" ? t.errors.notAllowed : t.errors.generic);
  refresh(parsed.data.assignmentId);
  return ok();
}
