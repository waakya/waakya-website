import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getMemberNames } from "@/lib/org/members";
import type { TaskState } from "@/lib/supabase/types";
import type { FieldDefinition, FieldValue, StatusDefinition } from "./schema";

export interface RecordType {
  id: string;
  key: string;
  name: string;
  namePlural: string;
  icon: string | null;
  description: string | null;
  statuses: StatusDefinition[];
  defaultStatus: string | null;
  customerVisibleDefault: boolean;
  templateKey: string | null;
  fields: FieldDefinition[];
  archivedAt: string | null;
  count: number;
}

export interface RecordRow {
  id: string;
  title: string;
  statusKey: string | null;
  values: Record<string, FieldValue>;
  projectId: string | null;
  projectName: string | null;
  contactId: string | null;
  contactName: string | null;
  vendorId: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  customerVisible: boolean;
  archivedAt: string | null;
  updatedAt: string;
}

export interface RecordDetail extends RecordRow {
  createdAt: string;
  createdByName: string | null;
  tasks: { id: string; title: string; state: TaskState; assigneeName: string }[];
}

export const PAGE_SIZE = 25;

type FieldRow = {
  key: string; label: string; field_type: string; options: unknown; required: boolean; position: number;
  show_in_list: boolean; customer_visible: boolean; unit: string | null;
};

function toField(row: FieldRow): FieldDefinition {
  return {
    key: row.key,
    label: row.label,
    fieldType: row.field_type as FieldDefinition["fieldType"],
    required: row.required,
    position: row.position,
    showInList: row.show_in_list,
    customerVisible: row.customer_visible,
    unit: row.unit,
    options: (row.options ?? {}) as FieldDefinition["options"],
  };
}

/** Every type the business has defined, with live counts. */
export const listRecordTypes = cache(async (orgId: string, includeArchived = false): Promise<RecordType[]> => {
  const supabase = await createClient();
  let query = supabase.from("record_types").select("*").eq("org_id", orgId).order("created_at", { ascending: true });
  if (!includeArchived) query = query.is("archived_at", null);
  const { data: types } = await query;
  if (!types?.length) return [];
  const ids = types.map((t) => t.id);
  const [{ data: fields }, counts] = await Promise.all([
    supabase.from("record_fields").select("*").in("record_type_id", ids).is("archived_at", null).order("position", { ascending: true }),
    Promise.all(
      ids.map((id) => supabase.from("records").select("id", { count: "exact", head: true }).eq("record_type_id", id).is("archived_at", null)),
    ),
  ]);
  return types.map((t, i) => ({
    id: t.id,
    key: t.key,
    name: t.name,
    namePlural: t.name_plural,
    icon: t.icon,
    description: t.description,
    statuses: ((t.statuses as unknown) as StatusDefinition[] | null) ?? [],
    defaultStatus: t.default_status,
    customerVisibleDefault: t.customer_visible_default,
    templateKey: t.template_key,
    fields: (fields ?? []).filter((f) => f.record_type_id === t.id).map(toField),
    archivedAt: t.archived_at,
    count: counts[i].count ?? 0,
  }));
});

export const getRecordType = cache(async (orgId: string, key: string): Promise<RecordType | null> => {
  const types = await listRecordTypes(orgId, true);
  return types.find((t) => t.key === key) ?? null;
});

export async function listRecords(
  orgId: string,
  type: RecordType,
  options: { q?: string; status?: string; projectId?: string; page?: number; archived?: boolean },
): Promise<{ items: RecordRow[]; total: number; page: number; pageSize: number }> {
  const supabase = await createClient();
  const page = Math.max(1, options.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;
  let query = supabase
    .from("records")
    .select("id, title, status_key, values, project_id, contact_id, vendor_id, assignee_id, customer_visible, archived_at, updated_at, projects(name), crm_contacts(full_name)", { count: "exact" })
    .eq("org_id", orgId)
    .eq("record_type_id", type.id);
  query = options.archived ? query.not("archived_at", "is", null) : query.is("archived_at", null);
  if (options.status) query = query.eq("status_key", options.status);
  if (options.projectId) query = query.eq("project_id", options.projectId);
  const q = options.q?.trim();
  if (q) query = query.ilike("title", `%${q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`);
  const { data, count } = await query.order("updated_at", { ascending: false }).range(from, from + PAGE_SIZE - 1);
  const names = await getMemberNames(orgId);
  return {
    items: (data ?? []).map((r) => toRow(r as RawRow, names)),
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
  };
}

type RawRow = {
  id: string; title: string; status_key: string | null; values: unknown; project_id: string | null; contact_id: string | null;
  vendor_id: string | null; assignee_id: string | null; customer_visible: boolean; archived_at: string | null; updated_at: string;
  projects: { name: string } | null; crm_contacts: { full_name: string } | null;
};

function toRow(r: RawRow, names: Map<string, string>): RecordRow {
  return {
    id: r.id,
    title: r.title,
    statusKey: r.status_key,
    values: (r.values ?? {}) as Record<string, FieldValue>,
    projectId: r.project_id,
    projectName: r.projects?.name ?? null,
    contactId: r.contact_id,
    contactName: r.crm_contacts?.full_name ?? null,
    vendorId: r.vendor_id,
    assigneeId: r.assignee_id,
    assigneeName: r.assignee_id ? (names.get(r.assignee_id) ?? null) : null,
    customerVisible: r.customer_visible,
    archivedAt: r.archived_at,
    updatedAt: r.updated_at,
  };
}

export const getRecord = cache(async (orgId: string, id: string): Promise<RecordDetail | null> => {
  const supabase = await createClient();
  const { data: r } = await supabase
    .from("records")
    .select("id, title, status_key, values, project_id, contact_id, vendor_id, assignee_id, customer_visible, archived_at, updated_at, created_at, created_by, projects(name), crm_contacts(full_name)")
    .eq("org_id", orgId)
    .eq("id", id)
    .maybeSingle();
  if (!r) return null;
  const names = await getMemberNames(orgId);
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, state, assigned_to")
    .eq("record_id", id)
    .order("created_at", { ascending: false })
    .limit(20);
  return {
    ...toRow(r as RawRow, names),
    createdAt: r.created_at,
    createdByName: r.created_by ? (names.get(r.created_by) ?? null) : null,
    tasks: (tasks ?? []).map((t) => ({ id: t.id, title: t.title, state: t.state, assigneeName: t.assigned_to ? (names.get(t.assigned_to) ?? "—") : "—" })),
  };
});

/** Names for relation fields on one screen: members, projects, contacts, other records. */
export async function relationNames(orgId: string, fields: FieldDefinition[], values: Record<string, FieldValue>): Promise<Map<string, string>> {
  const supabase = await createClient();
  const names = new Map(await getMemberNames(orgId));
  const ids = (type: FieldDefinition["fieldType"]) =>
    fields.filter((f) => f.fieldType === type).map((f) => values[f.key]).filter((v): v is string => typeof v === "string");
  const [projects, contacts, records] = await Promise.all([
    ids("project").length ? supabase.from("projects").select("id, name").in("id", ids("project")) : Promise.resolve({ data: [] }),
    ids("contact").length ? supabase.from("crm_contacts").select("id, full_name").in("id", ids("contact")) : Promise.resolve({ data: [] }),
    ids("record").length ? supabase.from("records").select("id, title").in("id", ids("record")) : Promise.resolve({ data: [] }),
  ]);
  for (const p of (projects.data ?? []) as { id: string; name: string }[]) names.set(p.id, p.name);
  for (const c of (contacts.data ?? []) as { id: string; full_name: string }[]) names.set(c.id, c.full_name);
  for (const r of (records.data ?? []) as { id: string; title: string }[]) names.set(r.id, r.title);
  return names;
}

/** Options for the relation pickers on a form. */
export async function relationChoices(orgId: string): Promise<{
  projects: { id: string; name: string }[];
  contacts: { id: string; name: string }[];
}> {
  const supabase = await createClient();
  const [{ data: projects }, { data: contacts }] = await Promise.all([
    supabase.from("projects").select("id, name").eq("org_id", orgId).order("updated_at", { ascending: false }).limit(200),
    supabase.from("crm_contacts").select("id, full_name").eq("org_id", orgId).is("archived_at", null).order("updated_at", { ascending: false }).limit(200),
  ]);
  return {
    projects: projects ?? [],
    contacts: (contacts ?? []).map((c) => ({ id: c.id, name: c.full_name })),
  };
}
