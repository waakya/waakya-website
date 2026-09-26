"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { requireOrg, viewerCan, hasModule } from "@/lib/auth/session";
import { getRecords } from "@/lib/i18n/records";
import { fail, ok, uuidSchema, type ActionResult } from "@/lib/validation";
import type { Json } from "@/lib/supabase/types";
import { createTask } from "@/lib/tasks/create";
import { DEADLINE_PRESETS } from "@/lib/tasks/deadlines";
import { FIELD_TYPES, keyFromLabel, validateValues, type FieldDefinition } from "./schema";
import { RECORD_TEMPLATES } from "./templates";
import { getRecordType } from "./queries";
import { kickAutomation } from "@/lib/automation/kick";

async function recordsViewer() {
  const viewer = await requireOrg();
  const t = getRecords(viewer.org.language);
  if (!hasModule(viewer, "records")) return { viewer, t, refused: fail(t.errors.moduleOff) as ActionResult<never> };
  return { viewer, t, refused: null };
}

function refresh(typeKey?: string, id?: string) {
  revalidatePath("/records");
  revalidatePath("/records/types");
  if (typeKey) revalidatePath(`/records/${typeKey}`);
  if (typeKey && id) revalidatePath(`/records/${typeKey}/${id}`);
  revalidatePath("/aaj");
}

// ---------------------------------------------------------------- types --

const statusSchema = z.object({
  key: z.string().regex(/^[a-z][a-z0-9_]{0,39}$/),
  label: z.string().trim().min(1).max(40),
  tone: z.enum(["neel", "amber", "laal", "hara", "muted", "outline"]).default("outline"),
  isTerminal: z.boolean().optional(),
});

const fieldSchema = z.object({
  key: z.string().regex(/^[a-z][a-z0-9_]{0,39}$/),
  label: z.string().trim().min(1).max(60),
  fieldType: z.enum(FIELD_TYPES),
  required: z.boolean().default(false),
  showInList: z.boolean().default(true),
  customerVisible: z.boolean().default(false),
  unit: z.string().trim().max(20).optional().or(z.literal("")),
  options: z
    .object({
      choices: z.array(z.object({ key: z.string().min(1).max(40), label: z.string().trim().min(1).max(60) })).max(50).optional(),
      recordType: z.string().max(40).optional(),
      min: z.number().optional(),
      max: z.number().optional(),
    })
    .default({}),
});

const typeSchema = z.object({
  key: z.string().regex(/^[a-z][a-z0-9_]{1,39}$/).optional(),
  name: z.string().trim().min(1).max(60),
  namePlural: z.string().trim().min(1).max(60),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  statuses: z.array(statusSchema).min(1).max(20),
  defaultStatus: z.string().optional(),
  customerVisibleDefault: z.boolean().default(false),
  fields: z.array(fieldSchema).max(60),
});

/** Define or redefine a record type and its fields in one transaction. */
export async function saveRecordType(input: unknown): Promise<ActionResult<{ key: string }>> {
  const { viewer, t, refused } = await recordsViewer();
  if (refused) return refused;
  if (!viewerCan(viewer, "records.types.manage")) return fail(t.errors.notAllowed);
  const parsed = typeSchema.safeParse(input);
  if (!parsed.success) return fail(t.errors.badInput, String(parsed.error.issues[0]?.path.join(".") ?? ""));
  const d = parsed.data;
  const key = d.key ?? keyFromLabel(d.name);
  const statusKeys = new Set(d.statuses.map((s) => s.key));
  const defaultStatus = d.defaultStatus && statusKeys.has(d.defaultStatus) ? d.defaultStatus : d.statuses[0].key;
  const fieldKeys = new Set<string>();
  for (const f of d.fields) {
    if (fieldKeys.has(f.key)) return fail(t.errors.badInput, "fields");
    fieldKeys.add(f.key);
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("install_record_type", {
    p_org: viewer.org.id,
    p_key: key,
    p_name: d.name,
    p_name_plural: d.namePlural,
    p_icon: null as unknown as string,
    p_description: (d.description || null) as unknown as string,
    p_statuses: d.statuses as unknown as Json,
    p_default_status: defaultStatus,
    p_customer_visible_default: d.customerVisibleDefault,
    p_template_key: null as unknown as string,
    p_fields: d.fields.map((f, position) => ({
      key: f.key,
      label: f.label,
      field_type: f.fieldType,
      options: f.options,
      required: f.required,
      position,
      show_in_list: f.showInList,
      customer_visible: f.customerVisible,
      unit: f.unit || null,
    })) as unknown as Json,
  });
  if (error) return fail(error.code === "42501" ? t.errors.notAllowed : error.code === "23505" ? t.errors.keyTaken : t.errors.generic);
  refresh(key);
  return ok({ key });
}

/** Install one of the ready-made templates (idempotent). */
export async function installTemplate(input: unknown): Promise<ActionResult<{ key: string }>> {
  const { viewer, t, refused } = await recordsViewer();
  if (refused) return refused;
  if (!viewerCan(viewer, "records.types.manage")) return fail(t.errors.notAllowed);
  const parsed = z.enum(Object.keys(RECORD_TEMPLATES) as [string, ...string[]]).safeParse(input);
  if (!parsed.success) return fail(t.errors.badInput);
  const template = RECORD_TEMPLATES[parsed.data];
  const supabase = await createClient();
  const { error } = await supabase.rpc("install_record_type", {
    p_org: viewer.org.id,
    p_key: template.key,
    p_name: template.name,
    p_name_plural: template.namePlural,
    p_icon: template.icon,
    p_description: template.description,
    p_statuses: template.statuses as unknown as Json,
    p_default_status: template.defaultStatus,
    p_customer_visible_default: template.customerVisibleDefault,
    p_template_key: template.key,
    p_fields: template.fields.map((f, position) => ({
      key: f.key,
      label: f.label,
      field_type: f.fieldType,
      options: f.options,
      required: f.required,
      position,
      show_in_list: f.showInList,
      customer_visible: f.customerVisible,
      unit: f.unit,
    })) as unknown as Json,
  });
  if (error) return fail(error.code === "42501" ? t.errors.notAllowed : t.errors.generic);
  refresh(template.key);
  return ok({ key: template.key });
}

export async function archiveRecordType(input: unknown): Promise<ActionResult> {
  const { viewer, t, refused } = await recordsViewer();
  if (refused) return refused;
  if (!viewerCan(viewer, "records.types.manage")) return fail(t.errors.notAllowed);
  const parsed = z.object({ key: z.string(), archived: z.boolean() }).safeParse(input);
  if (!parsed.success) return fail(t.errors.badInput);
  const supabase = await createClient();
  const { error } = await supabase
    .from("record_types")
    .update({ archived_at: parsed.data.archived ? new Date().toISOString() : null })
    .eq("org_id", viewer.org.id)
    .eq("key", parsed.data.key);
  if (error) return fail(t.errors.generic);
  refresh(parsed.data.key);
  return ok();
}

// -------------------------------------------------------------- records --

const recordSchema = z.object({
  typeKey: z.string().min(2).max(40),
  id: uuidSchema.optional(),
  title: z.string().trim().min(1).max(200),
  statusKey: z.string().max(40).optional(),
  values: z.record(z.string(), z.unknown()).default({}),
  projectId: uuidSchema.optional().or(z.literal("")),
  contactId: uuidSchema.optional().or(z.literal("")),
  assigneeId: uuidSchema.optional().or(z.literal("")),
  customerVisible: z.boolean().optional(),
});

/** Create or update a record: values are validated against the type here and by the database. */
export async function saveRecord(input: unknown): Promise<ActionResult<{ id: string }>> {
  const { viewer, t, refused } = await recordsViewer();
  if (refused) return refused;
  if (!viewerCan(viewer, "records.write")) return fail(t.errors.notAllowed);
  const parsed = recordSchema.safeParse(input);
  if (!parsed.success) return fail(t.errors.badInput, String(parsed.error.issues[0]?.path[0] ?? ""));
  const d = parsed.data;
  const type = await getRecordType(viewer.org.id, d.typeKey);
  if (!type || type.archivedAt) return fail(t.errors.notFound);
  const { values, issues } = validateValues(type.fields, d.values);
  if (issues.length) {
    const field = type.fields.find((f) => f.key === issues[0].key) as FieldDefinition | undefined;
    return fail(issues[0].reason === "required" ? t.errors.required(field?.label ?? issues[0].key) : t.errors.badInput, issues[0].key);
  }
  if (d.statusKey && !type.statuses.some((s) => s.key === d.statusKey)) return fail(t.errors.badStatus, "statusKey");

  const supabase = await createClient();
  const row = {
    title: d.title,
    values: values as unknown as Json,
    project_id: d.projectId || null,
    contact_id: d.contactId || null,
    assignee_id: d.assigneeId || null,
    ...(d.customerVisible !== undefined ? { customer_visible: d.customerVisible } : {}),
  };
  if (d.id) {
    const { error } = await supabase.from("records").update(row).eq("id", d.id).eq("org_id", viewer.org.id);
    if (error) return fail(error.code === "42501" ? t.errors.notAllowed : error.code === "22023" ? error.message : t.errors.generic);
    refresh(type.key, d.id);
    return ok({ id: d.id });
  }
  const { data, error } = await supabase
    .from("records")
    .insert({
      org_id: viewer.org.id,
      record_type_id: type.id,
      status_key: d.statusKey ?? type.defaultStatus,
      created_by: viewer.userId,
      customer_visible: d.customerVisible ?? type.customerVisibleDefault,
      ...row,
    })
    .select("id")
    .single();
  if (error || !data) return fail(error?.code === "42501" ? t.errors.notAllowed : error?.code === "22023" ? error.message : t.errors.generic);
  refresh(type.key, data.id);
  return ok({ id: data.id });
}

const statusChange = z.object({ id: uuidSchema, statusKey: z.string().max(40), note: z.string().trim().max(500).optional().or(z.literal("")) });

/** Move a record to another status, with a reason the history keeps. */
export async function changeRecordStatus(input: unknown): Promise<ActionResult> {
  const { viewer, t, refused } = await recordsViewer();
  if (refused) return refused;
  if (!viewerCan(viewer, "records.status.change")) return fail(t.errors.notAllowed);
  const parsed = statusChange.safeParse(input);
  if (!parsed.success) return fail(t.errors.badInput);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("set_record_status", { p_record: parsed.data.id, p_status: parsed.data.statusKey, p_note: parsed.data.note || undefined });
  if (error) return fail(error.message.includes("status") ? t.errors.badStatus : error.code === "42501" ? t.errors.notAllowed : t.errors.generic);
  void data;
  revalidatePath("/records", "layout");
  revalidatePath("/aaj");
  kickAutomation(viewer.org.id);
  return ok();
}

export async function archiveRecord(input: unknown): Promise<ActionResult> {
  const { viewer, t, refused } = await recordsViewer();
  if (refused) return refused;
  if (!viewerCan(viewer, "tasks.verify")) return fail(t.errors.notAllowed);
  const parsed = z.object({ id: uuidSchema, archived: z.boolean() }).safeParse(input);
  if (!parsed.success) return fail(t.errors.badInput);
  const supabase = await createClient();
  const { error } = await supabase
    .from("records")
    .update({ archived_at: parsed.data.archived ? new Date().toISOString() : null })
    .eq("id", parsed.data.id)
    .eq("org_id", viewer.org.id);
  if (error) return fail(error.code === "42501" ? t.errors.notAllowed : t.errors.generic);
  revalidatePath("/records", "layout");
  return ok();
}

const taskSchema = z.object({
  recordId: uuidSchema,
  assigneeId: uuidSchema,
  title: z.string().trim().min(2).max(140),
  preset: z.enum(DEADLINE_PRESETS as unknown as [string, ...string[]]),
});

/** Work on a record: a task that says which unit or package it is for. */
export async function createTaskForRecord(input: unknown): Promise<ActionResult<{ taskId: string }>> {
  const { viewer, t, refused } = await recordsViewer();
  if (refused) return refused;
  const parsed = taskSchema.safeParse(input);
  if (!parsed.success) return fail(t.errors.badInput, "title");
  const supabase = await createClient();
  const { data: record } = await supabase
    .from("records")
    .select("id, title, project_id, contact_id")
    .eq("id", parsed.data.recordId)
    .eq("org_id", viewer.org.id)
    .maybeSingle();
  if (!record) return fail(t.errors.notFound);
  const created = await createTask({
    assigneeId: parsed.data.assigneeId,
    title: parsed.data.title,
    priority: "normal",
    proofRequired: false,
    deadline: { kind: "preset", preset: parsed.data.preset },
    origin: { kind: "project", id: record.id, label: record.title },
    links: { recordId: record.id, projectId: record.project_id ?? undefined, contactId: record.contact_id ?? undefined },
  });
  if (!created.ok) return created;
  revalidatePath("/records", "layout");
  return ok({ taskId: created.data.taskId });
}
