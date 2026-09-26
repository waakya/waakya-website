import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getMemberNames } from "@/lib/org/members";
import type { TaskState } from "@/lib/supabase/types";
import { followUpState, type FollowUpState } from "./model";

export type ContactKind = "lead" | "customer";
export type ContactFilter = "all" | "leads" | "customers" | "mine" | "unassigned" | "followUp" | "archived";

export interface ContactRow {
  id: string;
  kind: ContactKind;
  fullName: string;
  phone: string | null;
  email: string | null;
  companyName: string | null;
  source: string | null;
  tags: string[];
  ownerId: string | null;
  ownerName: string | null;
  projectId: string | null;
  nextActionAt: string | null;
  nextActionNote: string | null;
  followUp: FollowUpState;
  lastActivityAt: string | null;
  archivedAt: string | null;
  updatedAt: string;
}

export interface Stage {
  id: string;
  key: string;
  name: string;
  position: number;
  kind: "open" | "won" | "lost";
}

export interface Pipeline {
  id: string;
  name: string;
  stages: Stage[];
}

export interface Opportunity {
  id: string;
  contactId: string;
  pipelineId: string;
  stageId: string;
  stageName: string;
  title: string;
  value: number | null;
  ownerId: string | null;
  projectId: string | null;
  recordId: string | null;
  status: "open" | "won" | "lost";
  expectedClose: string | null;
  closedAt: string | null;
  createdAt: string;
}

export interface Activity {
  id: string;
  kind: string;
  body: string | null;
  actorKind: string;
  actorName: string | null;
  taskId: string | null;
  metadata: Record<string, unknown>;
  occurredAt: string;
}

export interface ContactDetail extends ContactRow {
  notes: string | null;
  createdAt: string;
  createdByName: string | null;
  emailOptOut: boolean;
  whatsappOptOut: boolean;
  projectName: string | null;
  opportunities: Opportunity[];
  activities: Activity[];
  tasks: { id: string; title: string; state: TaskState; dueAt: string | null; assigneeName: string }[];
  portal: { accessId: string; status: string } | null;
}

export const PAGE_SIZE = 25;

/**
 * A page of contacts with an exact total, so the count on screen never comes
 * from a capped list (the Phase-1 200-row class of bug).
 */
export async function listContacts(
  orgId: string,
  options: { q?: string; filter?: ContactFilter; page?: number; viewerId: string; now?: Date },
): Promise<{ items: ContactRow[]; total: number; page: number; pageSize: number }> {
  const supabase = await createClient();
  const page = Math.max(1, options.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;
  const filter = options.filter ?? "all";
  const now = options.now ?? new Date();

  let query = supabase
    .from("crm_contacts")
    .select(
      "id, kind, full_name, phone_e164, email, company_name, source, tags, owner_id, project_id, next_action_at, next_action_note, last_activity_at, archived_at, updated_at",
      { count: "exact" },
    )
    .eq("org_id", orgId);

  if (filter === "archived") query = query.not("archived_at", "is", null);
  else query = query.is("archived_at", null);
  if (filter === "leads") query = query.eq("kind", "lead");
  if (filter === "customers") query = query.eq("kind", "customer");
  if (filter === "mine") query = query.eq("owner_id", options.viewerId);
  if (filter === "unassigned") query = query.is("owner_id", null).eq("kind", "lead");
  if (filter === "followUp") query = query.lte("next_action_at", endOfDayIso(now));

  const q = options.q?.trim();
  if (q) {
    const safe = q.replace(/[%_\\]/g, (c) => `\\${c}`);
    const digits = q.replace(/\D/g, "");
    const parts = [`full_name.ilike.%${safe}%`, `email.ilike.%${safe}%`, `company_name.ilike.%${safe}%`];
    if (digits.length >= 4) parts.push(`phone_e164.ilike.%${digits}%`);
    query = query.or(parts.join(","));
  }

  const ordered =
    filter === "followUp"
      ? query.order("next_action_at", { ascending: true })
      : query.order("updated_at", { ascending: false });
  const { data, count } = await ordered.range(from, from + PAGE_SIZE - 1);
  const names = await getMemberNames(orgId);
  const items = (data ?? []).map((row) => toRow(row, names, now));
  return { items, total: count ?? 0, page, pageSize: PAGE_SIZE };
}

function endOfDayIso(now: Date): string {
  const ist = new Date(now.getTime() + 5.5 * 3600 * 1000);
  return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate(), 23, 59, 59) - 5.5 * 3600 * 1000).toISOString();
}

type RawRow = {
  id: string; kind: string; full_name: string; phone_e164: string | null; email: string | null; company_name: string | null;
  source: string | null; tags: string[]; owner_id: string | null; project_id: string | null; next_action_at: string | null;
  next_action_note: string | null; last_activity_at: string | null; archived_at: string | null; updated_at: string;
};

function toRow(row: RawRow, names: Map<string, string>, now: Date): ContactRow {
  return {
    id: row.id,
    kind: row.kind as ContactKind,
    fullName: row.full_name,
    phone: row.phone_e164,
    email: row.email,
    companyName: row.company_name,
    source: row.source,
    tags: row.tags ?? [],
    ownerId: row.owner_id,
    ownerName: row.owner_id ? (names.get(row.owner_id) ?? null) : null,
    projectId: row.project_id,
    nextActionAt: row.next_action_at,
    nextActionNote: row.next_action_note,
    followUp: followUpState(row.next_action_at, now),
    lastActivityAt: row.last_activity_at,
    archivedAt: row.archived_at,
    updatedAt: row.updated_at,
  };
}

/** The business's default pipeline with its stages, installing it on first use. */
export const getPipeline = cache(async (orgId: string): Promise<Pipeline> => {
  const supabase = await createClient();
  let { data: pipeline } = await supabase.from("crm_pipelines").select("id, name").eq("org_id", orgId).eq("is_default", true).maybeSingle();
  if (!pipeline) {
    const { data: id } = await supabase.rpc("crm_install_default_pipeline", { p_org: orgId });
    pipeline = id ? { id, name: "Sales" } : null;
  }
  if (!pipeline) return { id: "", name: "", stages: [] };
  const { data: stages } = await supabase
    .from("crm_pipeline_stages")
    .select("id, key, name, position, kind")
    .eq("pipeline_id", pipeline.id)
    .order("position", { ascending: true });
  return {
    id: pipeline.id,
    name: pipeline.name,
    stages: (stages ?? []).map((s) => ({ ...s, kind: s.kind as Stage["kind"] })),
  };
});

export const getContact = cache(async (orgId: string, id: string, now: Date = new Date()): Promise<ContactDetail | null> => {
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("crm_contacts")
    .select("*")
    .eq("org_id", orgId)
    .eq("id", id)
    .maybeSingle();
  if (!row) return null;
  const names = await getMemberNames(orgId);
  const [{ data: opps }, { data: acts }, { data: tasks }, project] = await Promise.all([
    supabase
      .from("crm_opportunities")
      .select("id, contact_id, pipeline_id, stage_id, title, value, owner_id, project_id, record_id, status, expected_close, closed_at, created_at, crm_pipeline_stages(name)")
      .eq("contact_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("crm_activities")
      .select("id, kind, body, actor_kind, actor_id, task_id, metadata, occurred_at")
      .eq("contact_id", id)
      .order("occurred_at", { ascending: false })
      .limit(60),
    supabase
      .from("tasks")
      .select("id, title, state, due_at, assigned_to")
      .eq("contact_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
    row.project_id ? supabase.from("projects").select("name").eq("id", row.project_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const base = toRow(row as RawRow, names, now);
  return {
    ...base,
    notes: row.notes,
    createdAt: row.created_at,
    createdByName: row.created_by ? (names.get(row.created_by) ?? null) : null,
    emailOptOut: row.email_opt_out,
    whatsappOptOut: row.whatsapp_opt_out,
    projectName: (project as { data: { name: string } | null }).data?.name ?? null,
    opportunities: (opps ?? []).map((o) => ({
      id: o.id,
      contactId: o.contact_id,
      pipelineId: o.pipeline_id,
      stageId: o.stage_id,
      stageName: (o.crm_pipeline_stages as { name: string } | null)?.name ?? "",
      title: o.title,
      value: o.value === null ? null : Number(o.value),
      ownerId: o.owner_id,
      projectId: o.project_id,
      recordId: o.record_id,
      status: o.status as Opportunity["status"],
      expectedClose: o.expected_close,
      closedAt: o.closed_at,
      createdAt: o.created_at,
    })),
    activities: (acts ?? []).map((a) => ({
      id: a.id,
      kind: a.kind,
      body: a.body,
      actorKind: a.actor_kind,
      actorName: a.actor_id ? (names.get(a.actor_id) ?? null) : null,
      taskId: a.task_id,
      metadata: (a.metadata ?? {}) as Record<string, unknown>,
      occurredAt: a.occurred_at,
    })),
    tasks: (tasks ?? []).map((t) => ({
      id: t.id,
      title: t.title,
      state: t.state,
      dueAt: t.due_at,
      assigneeName: t.assigned_to ? (names.get(t.assigned_to) ?? "—") : "—",
    })),
    // Portal access arrives with the customer experience slice (0034).
    portal: null,
  };
});

export interface PipelineColumn extends Stage {
  count: number;
  value: number;
  deals: { id: string; title: string; contactId: string; contactName: string; value: number | null; ownerName: string | null; updatedAt: string }[];
}

/** Every open deal by stage; closed stages show their last few. */
export async function getPipelineBoard(orgId: string): Promise<{ pipeline: Pipeline; columns: PipelineColumn[]; totalOpen: number }> {
  const supabase = await createClient();
  const pipeline = await getPipeline(orgId);
  const names = await getMemberNames(orgId);
  const { data: deals, count } = await supabase
    .from("crm_opportunities")
    .select("id, title, contact_id, stage_id, value, owner_id, updated_at, status, crm_contacts(full_name)", { count: "exact" })
    .eq("org_id", orgId)
    .eq("pipeline_id", pipeline.id)
    .order("updated_at", { ascending: false })
    .limit(500);
  const columns = pipeline.stages.map((stage) => {
    const mine = (deals ?? []).filter((d) => d.stage_id === stage.id);
    const shown = stage.kind === "open" ? mine : mine.slice(0, 10);
    return {
      ...stage,
      count: mine.length,
      value: mine.reduce((sum, d) => sum + Number(d.value ?? 0), 0),
      deals: shown.map((d) => ({
        id: d.id,
        title: d.title,
        contactId: d.contact_id,
        contactName: (d.crm_contacts as { full_name: string } | null)?.full_name ?? "",
        value: d.value === null ? null : Number(d.value),
        ownerName: d.owner_id ? (names.get(d.owner_id) ?? null) : null,
        updatedAt: d.updated_at,
      })),
    };
  });
  return { pipeline, columns, totalOpen: (deals ?? []).filter((d) => d.status === "open").length || (count ?? 0) };
}

/** What Today says about customers: exact counts, top rows. */
export async function crmAttention(
  orgId: string,
  viewerId: string,
  manages: boolean,
  now: Date = new Date(),
): Promise<{ followUps: ContactRow[]; followUpCount: number; unassigned: ContactRow[]; unassignedCount: number }> {
  const supabase = await createClient();
  const names = await getMemberNames(orgId);
  const cols = "id, kind, full_name, phone_e164, email, company_name, source, tags, owner_id, project_id, next_action_at, next_action_note, last_activity_at, archived_at, updated_at";
  let due = supabase
    .from("crm_contacts")
    .select(cols, { count: "exact" })
    .eq("org_id", orgId)
    .is("archived_at", null)
    .lte("next_action_at", endOfDayIso(now))
    .order("next_action_at", { ascending: true })
    .limit(5);
  if (!manages) due = due.eq("owner_id", viewerId);
  const unassignedQuery = manages
    ? supabase
        .from("crm_contacts")
        .select(cols, { count: "exact" })
        .eq("org_id", orgId)
        .is("archived_at", null)
        .eq("kind", "lead")
        .is("owner_id", null)
        .order("created_at", { ascending: false })
        .limit(5)
    : null;
  const [d, u] = await Promise.all([due, unassignedQuery ?? Promise.resolve({ data: [], count: 0 })]);
  return {
    followUps: (d.data ?? []).map((r) => toRow(r as RawRow, names, now)),
    followUpCount: d.count ?? 0,
    unassigned: ((u as { data: RawRow[] | null }).data ?? []).map((r) => toRow(r, names, now)),
    unassignedCount: (u as { count: number | null }).count ?? 0,
  };
}
