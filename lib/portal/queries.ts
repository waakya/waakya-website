import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProofStorage } from "@/lib/storage";
import type { FieldDefinition, FieldValue, StatusDefinition } from "@/lib/records/schema";

/**
 * What the customer's page is made of. Every query runs as the customer,
 * under the customer policies of 0034: a row that is not on their project or
 * not marked visible does not exist for them. Files are signed with the
 * service role only after the row has passed that gate.
 */
export interface PortalProject {
  id: string;
  name: string;
  status: string;
  progress: number;
  summary: string | null;
  orgName: string;
  latestUpdate: { body: string; kind: string; at: string } | null;
  nextMilestone: { name: string; dueDate: string | null } | null;
  milestones: { id: string; name: string; status: string; dueDate: string | null; doneAt: string | null }[];
  updates: { id: string; body: string; kind: string; at: string; actorKind: string }[];
  decisions: {
    id: string;
    title: string;
    description: string | null;
    options: { key: string; label: string; detail?: string }[];
    status: string;
    decidedOptionKey: string | null;
    decidedAt: string | null;
  }[];
  photos: { id: string; url: string | null; at: string; taskTitle: string | null }[];
  documents: { id: string; name: string; url: string | null; at: string }[];
  records: { typeName: string; typePlural: string; items: { id: string; title: string; status: string | null; fields: { label: string; value: string }[] }[] }[];
  messages: { id: string; body: string; authorKind: string; at: string }[];
}

export async function getPortalProject(projectId: string, words: { yes: string; no: string; none: string }): Promise<PortalProject | null> {
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, name, status, progress_percent, customer_summary, org_id, orgs(name)")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) return null;

  const [{ data: milestones }, { data: updates }, { data: decisions }, { data: proofs }, { data: documents }, { data: records }, { data: types }, { data: fields }, { data: messages }] =
    await Promise.all([
      supabase.from("project_milestones").select("id, name, status, due_date, done_at, position").eq("project_id", projectId).order("position", { ascending: true }),
      supabase.from("project_updates").select("id, body, kind, created_at, actor_kind").eq("project_id", projectId).order("created_at", { ascending: false }).limit(30),
      supabase.from("customer_decisions").select("id, title, description, options, status, decided_option_key, decided_at").eq("project_id", projectId).order("created_at", { ascending: false }).limit(20),
      supabase.from("proofs").select("id, url, kind, created_at, tasks(title)").eq("customer_visible", true).order("created_at", { ascending: false }).limit(24),
      supabase.from("documents").select("id, name, storage_key, created_at, source").eq("project_id", projectId).eq("customer_visible", true).order("created_at", { ascending: false }).limit(30),
      supabase.from("records").select("id, title, status_key, values, record_type_id").eq("project_id", projectId).order("created_at", { ascending: true }).limit(200),
      supabase.from("record_types").select("id, name, name_plural, statuses").eq("org_id", project.org_id),
      supabase.from("record_fields").select("record_type_id, key, label, field_type, options, position, unit").eq("org_id", project.org_id).is("archived_at", null).order("position", { ascending: true }),
      supabase.from("customer_messages").select("id, body, author_kind, created_at").eq("project_id", projectId).order("created_at", { ascending: true }).limit(200),
    ]);

  // Files: the rows above passed RLS as the customer; only now is a link made.
  const admin = createAdminClient();
  const storage = admin ? getProofStorage(admin) : null;
  const photos = await Promise.all(
    (proofs ?? [])
      .filter((p) => p.kind === "photo" && p.url)
      .map(async (p) => ({
        id: p.id,
        url: storage ? await storage.presignDownload(p.url!).catch(() => null) : null,
        at: p.created_at,
        taskTitle: (p.tasks as { title: string } | null)?.title ?? null,
      })),
  );
  const docs = await Promise.all(
    (documents ?? []).map(async (d) => ({
      id: d.id,
      name: d.name,
      url: admin ? (await admin.storage.from("documents").createSignedUrl(d.storage_key, 300)).data?.signedUrl ?? null : null,
      at: d.created_at,
    })),
  );

  const { formatValue } = await import("@/lib/records/schema");
  const groups = (types ?? [])
    .map((type) => {
      const items = (records ?? []).filter((r) => r.record_type_id === type.id);
      if (!items.length) return null;
      const typeFields = (fields ?? [])
        .filter((f) => f.record_type_id === type.id)
        .map((f) => ({
          key: f.key,
          label: f.label,
          fieldType: f.field_type as FieldDefinition["fieldType"],
          required: false,
          position: f.position,
          showInList: true,
          customerVisible: true,
          unit: f.unit,
          options: (f.options ?? {}) as FieldDefinition["options"],
        }));
      const statuses = ((type.statuses as unknown) as StatusDefinition[] | null) ?? [];
      return {
        typeName: type.name,
        typePlural: type.name_plural,
        items: items.map((r) => ({
          id: r.id,
          title: r.title,
          status: statuses.find((s) => s.key === r.status_key)?.label ?? r.status_key,
          fields: typeFields
            .map((f) => ({ label: f.label, value: formatValue(f, (r.values as Record<string, FieldValue>)[f.key], words) }))
            .filter((f) => f.value !== words.none),
        })),
      };
    })
    .filter((g): g is NonNullable<typeof g> => g !== null);

  const orderedMilestones = milestones ?? [];
  return {
    id: project.id,
    name: project.name,
    status: project.status,
    progress: project.progress_percent,
    summary: project.customer_summary,
    orgName: (project.orgs as { name: string } | null)?.name ?? "",
    latestUpdate: updates?.[0] ? { body: updates[0].body, kind: updates[0].kind, at: updates[0].created_at } : null,
    nextMilestone: (() => {
      const next = orderedMilestones.find((m) => m.status !== "done");
      return next ? { name: next.name, dueDate: next.due_date } : null;
    })(),
    milestones: orderedMilestones.map((m) => ({ id: m.id, name: m.name, status: m.status, dueDate: m.due_date, doneAt: m.done_at })),
    updates: (updates ?? []).map((u) => ({ id: u.id, body: u.body, kind: u.kind, at: u.created_at, actorKind: u.actor_kind })),
    decisions: (decisions ?? []).map((d) => ({
      id: d.id,
      title: d.title,
      description: d.description,
      options: (d.options as { key: string; label: string; detail?: string }[]) ?? [],
      status: d.status,
      decidedOptionKey: d.decided_option_key,
      decidedAt: d.decided_at,
    })),
    photos,
    documents: docs,
    records: groups,
    messages: (messages ?? []).map((m) => ({ id: m.id, body: m.body, authorKind: m.author_kind, at: m.created_at })),
  };
}
