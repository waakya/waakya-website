import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import { getMemberNames } from "@/lib/org/members";
import type { DocumentCategory } from "./rules";

/**
 * Reads for the document library.
 *
 * Row level security already limits these to the reader's org, and hides a
 * file shared inside a conversation from anyone who is not in it. The org
 * filter here is belt and braces, and keeps the index in use.
 */

export interface DocumentItem {
  id: string;
  name: string;
  category: DocumentCategory;
  mimeType: string | null;
  sizeBytes: number | null;
  uploadedBy: string;
  uploaderName: string;
  taskId: string | null;
  taskTitle: string | null;
  projectId: string | null;
  projectName: string | null;
  messageId: string | null;
  source: "upload" | "template";
  templateKey: string | null;
  createdAt: string;
}

const COLUMNS =
  "id, name, category, mime_type, size_bytes, uploaded_by, task_id, project_id, message_id, source, template_key, created_at";

type Row = {
  id: string;
  name: string;
  category: string;
  mime_type: string | null;
  size_bytes: number | null;
  uploaded_by: string;
  task_id: string | null;
  project_id: string | null;
  message_id: string | null;
  source: string;
  template_key: string | null;
  created_at: string;
};

async function shape(orgId: string, rows: Row[]): Promise<DocumentItem[]> {
  if (!rows.length) return [];
  const supabase = await createClient();
  const taskIds = [...new Set(rows.map((r) => r.task_id).filter(Boolean))] as string[];
  const projectIds = [...new Set(rows.map((r) => r.project_id).filter(Boolean))] as string[];

  const [names, { data: tasks }, { data: projects }] = await Promise.all([
    getMemberNames(orgId),
    taskIds.length
      ? supabase.from("tasks").select("id, title").in("id", taskIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    projectIds.length
      ? supabase.from("projects").select("id, name").in("id", projectIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);

  const taskTitle = new Map((tasks ?? []).map((t) => [t.id, t.title]));
  const projectName = new Map((projects ?? []).map((p) => [p.id, p.name]));

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category as DocumentCategory,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    uploadedBy: row.uploaded_by,
    uploaderName: names.get(row.uploaded_by) ?? "Someone",
    taskId: row.task_id,
    taskTitle: row.task_id ? (taskTitle.get(row.task_id) ?? null) : null,
    projectId: row.project_id,
    projectName: row.project_id ? (projectName.get(row.project_id) ?? null) : null,
    messageId: row.message_id,
    source: row.source === "template" ? "template" : "upload",
    templateKey: row.template_key,
    createdAt: row.created_at,
  }));
}

/** The library: everything not private to a conversation, newest first. */
export const listDocuments = cache(async (orgId: string): Promise<DocumentItem[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("documents")
    .select(COLUMNS)
    .eq("org_id", orgId)
    .is("message_id", null)
    .order("created_at", { ascending: false })
    .limit(500);
  return shape(orgId, (data ?? []) as Row[]);
});

export const listTaskDocuments = cache(
  async (orgId: string, taskId: string): Promise<DocumentItem[]> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("documents")
      .select(COLUMNS)
      .eq("org_id", orgId)
      .eq("task_id", taskId)
      .order("created_at", { ascending: false });
    return shape(orgId, (data ?? []) as Row[]);
  },
);

export const listProjectDocuments = cache(
  async (orgId: string, projectId: string): Promise<DocumentItem[]> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("documents")
      .select(COLUMNS)
      .eq("org_id", orgId)
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    return shape(orgId, (data ?? []) as Row[]);
  },
);

/** Attachments on a conversation's messages, keyed by message. */
export const listMessageDocuments = cache(
  async (orgId: string, messageIds: string[]): Promise<Map<string, DocumentItem[]>> => {
    const out = new Map<string, DocumentItem[]>();
    if (!messageIds.length) return out;
    const supabase = await createClient();
    const { data } = await supabase
      .from("documents")
      .select(COLUMNS)
      .eq("org_id", orgId)
      .in("message_id", messageIds);
    for (const doc of await shape(orgId, (data ?? []) as Row[])) {
      if (!doc.messageId) continue;
      out.set(doc.messageId, [...(out.get(doc.messageId) ?? []), doc]);
    }
    return out;
  },
);

export interface DocumentDetail extends DocumentItem {
  storageKey: string;
  templateData: Record<string, string> | null;
}

export const getDocument = cache(
  async (orgId: string, id: string): Promise<DocumentDetail | null> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("documents")
      .select(`${COLUMNS}, storage_key, template_data`)
      .eq("id", id)
      .eq("org_id", orgId)
      .maybeSingle();
    if (!data) return null;
    const [item] = await shape(orgId, [data as Row]);
    return {
      ...item,
      storageKey: (data as { storage_key: string }).storage_key,
      templateData:
        ((data as { template_data: unknown }).template_data as Record<string, string> | null) ??
        null,
    };
  },
);
