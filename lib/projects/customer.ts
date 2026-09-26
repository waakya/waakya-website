import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getMemberNames } from "@/lib/org/members";

/**
 * The customer side of a project as the business sees it: who the customer
 * is, whether they can see their page, the milestones and updates, what is
 * waiting on them, and what they wrote.
 */
export interface ProjectCustomerView {
  contact: { id: string; name: string; email: string | null; phone: string | null } | null;
  access: { id: string; status: string; inviteToken: string; email: string | null; acceptedAt: string | null; lastSeenAt: string | null } | null;
  milestones: { id: string; name: string; status: string; dueDate: string | null; doneAt: string | null; customerVisible: boolean; position: number }[];
  updates: { id: string; body: string; kind: string; customerVisible: boolean; at: string; byName: string | null; actorKind: string }[];
  decisions: {
    id: string;
    title: string;
    description: string | null;
    options: { key: string; label: string }[];
    status: string;
    decidedOptionKey: string | null;
    decidedAt: string | null;
    blocksTaskId: string | null;
    blocksTaskTitle: string | null;
    blocksRecordId: string | null;
    createdAt: string;
  }[];
  messages: { id: string; body: string; authorKind: string; byName: string | null; at: string; unread: boolean }[];
  unreadMessages: number;
  summary: string | null;
  progress: number;
}

export const getProjectCustomerView = cache(async (orgId: string, projectId: string): Promise<ProjectCustomerView> => {
  const supabase = await createClient();
  const names = await getMemberNames(orgId);
  const { data: project } = await supabase
    .from("projects")
    .select("contact_id, customer_summary, progress_percent, crm_contacts!projects_contact_id_fkey(id, full_name, email, phone_e164)")
    .eq("id", projectId)
    .eq("org_id", orgId)
    .maybeSingle();
  const contact = (project?.crm_contacts as { id: string; full_name: string; email: string | null; phone_e164: string | null } | null) ?? null;
  const [{ data: access }, { data: milestones }, { data: updates }, { data: decisions }, { data: messages }] = await Promise.all([
    contact
      ? supabase.from("customer_access").select("id, status, invite_token, email, accepted_at, last_seen_at").eq("org_id", orgId).eq("contact_id", contact.id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("project_milestones").select("id, name, status, due_date, done_at, customer_visible, position").eq("project_id", projectId).order("position", { ascending: true }),
    supabase.from("project_updates").select("id, body, kind, customer_visible, created_at, created_by, actor_kind").eq("project_id", projectId).order("created_at", { ascending: false }).limit(50),
    supabase.from("customer_decisions").select("id, title, description, options, status, decided_option_key, decided_at, blocks_task_id, blocks_record_id, created_at, tasks!customer_decisions_blocks_task_id_fkey(title)").eq("project_id", projectId).order("created_at", { ascending: false }).limit(50),
    supabase.from("customer_messages").select("id, body, author_kind, author_user_id, created_at, read_by_business_at").eq("project_id", projectId).order("created_at", { ascending: true }).limit(200),
  ]);
  const projectAccess = access
    ? await supabase.from("customer_project_access").select("id").eq("customer_access_id", access.id).eq("project_id", projectId).maybeSingle()
    : { data: null };
  return {
    contact: contact ? { id: contact.id, name: contact.full_name, email: contact.email, phone: contact.phone_e164 } : null,
    access:
      access && projectAccess.data
        ? { id: access.id, status: access.status, inviteToken: access.invite_token, email: access.email, acceptedAt: access.accepted_at, lastSeenAt: access.last_seen_at }
        : null,
    milestones: (milestones ?? []).map((m) => ({ id: m.id, name: m.name, status: m.status, dueDate: m.due_date, doneAt: m.done_at, customerVisible: m.customer_visible, position: m.position })),
    updates: (updates ?? []).map((u) => ({ id: u.id, body: u.body, kind: u.kind, customerVisible: u.customer_visible, at: u.created_at, byName: u.created_by ? (names.get(u.created_by) ?? null) : null, actorKind: u.actor_kind })),
    decisions: (decisions ?? []).map((d) => ({
      id: d.id,
      title: d.title,
      description: d.description,
      options: (d.options as { key: string; label: string }[]) ?? [],
      status: d.status,
      decidedOptionKey: d.decided_option_key,
      decidedAt: d.decided_at,
      blocksTaskId: d.blocks_task_id,
      blocksTaskTitle: (d.tasks as { title: string } | null)?.title ?? null,
      blocksRecordId: d.blocks_record_id,
      createdAt: d.created_at,
    })),
    messages: (messages ?? []).map((m) => ({
      id: m.id,
      body: m.body,
      authorKind: m.author_kind,
      byName: m.author_user_id && m.author_kind === "business" ? (names.get(m.author_user_id) ?? null) : null,
      at: m.created_at,
      unread: m.author_kind === "customer" && !m.read_by_business_at,
    })),
    unreadMessages: (messages ?? []).filter((m) => m.author_kind === "customer" && !m.read_by_business_at).length,
    summary: project?.customer_summary ?? null,
    progress: project?.progress_percent ?? 0,
  };
});

/** What Today reads: exact counts of what waits on or came from customers. */
export async function customerAttention(orgId: string): Promise<{
  unreadMessages: { projectId: string; projectName: string; count: number }[];
  openDecisions: { id: string; title: string; projectId: string; projectName: string; createdAt: string }[];
  unreadTotal: number;
  openTotal: number;
}> {
  const supabase = await createClient();
  const [{ data: msgs, count: unreadTotal }, { data: decisions, count: openTotal }] = await Promise.all([
    supabase
      .from("customer_messages")
      .select("project_id, projects(name)", { count: "exact" })
      .eq("org_id", orgId)
      .eq("author_kind", "customer")
      .is("read_by_business_at", null)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("customer_decisions")
      .select("id, title, project_id, created_at, projects(name)", { count: "exact" })
      .eq("org_id", orgId)
      .eq("status", "open")
      .order("created_at", { ascending: true })
      .limit(10),
  ]);
  const byProject = new Map<string, { projectId: string; projectName: string; count: number }>();
  for (const m of msgs ?? []) {
    const entry = byProject.get(m.project_id) ?? { projectId: m.project_id, projectName: (m.projects as { name: string } | null)?.name ?? "", count: 0 };
    entry.count += 1;
    byProject.set(m.project_id, entry);
  }
  return {
    unreadMessages: [...byProject.values()],
    openDecisions: (decisions ?? []).map((d) => ({ id: d.id, title: d.title, projectId: d.project_id, projectName: (d.projects as { name: string } | null)?.name ?? "", createdAt: d.created_at })),
    unreadTotal: unreadTotal ?? 0,
    openTotal: openTotal ?? 0,
  };
}

/** The files on a project and whether the customer sees each one. */
export async function visibilityItems(orgId: string, projectId: string): Promise<{
  documents: { id: string; name: string; visible: boolean }[];
  proofs: { id: string; taskTitle: string; kind: string; visible: boolean }[];
}> {
  const supabase = await createClient();
  const [{ data: documents }, { data: proofs }] = await Promise.all([
    supabase.from("documents").select("id, name, customer_visible").eq("org_id", orgId).eq("project_id", projectId).order("created_at", { ascending: false }).limit(50),
    supabase.from("proofs").select("id, kind, customer_visible, tasks!inner(title, project_id)").eq("org_id", orgId).eq("tasks.project_id", projectId).order("created_at", { ascending: false }).limit(50),
  ]);
  return {
    documents: (documents ?? []).map((d) => ({ id: d.id, name: d.name, visible: d.customer_visible })),
    proofs: (proofs ?? []).map((p) => ({ id: p.id, taskTitle: (p.tasks as unknown as { title: string } | null)?.title ?? "", kind: p.kind, visible: p.customer_visible })),
  };
}
