import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import { getMemberNames } from "@/lib/org/members";

export interface ApprovalItem {
  id: string;
  title: string;
  details: string | null;
  status: "pending" | "approved" | "rejected";
  requestedBy: string;
  requesterName: string;
  approverId: string | null;
  approverName: string | null;
  decidedByName: string | null;
  decidedAt: string | null;
  decisionNote: string | null;
  taskId: string | null;
  taskTitle: string | null;
  projectId: string | null;
  projectName: string | null;
  documentId: string | null;
  documentName: string | null;
  createdAt: string;
}

/** Everything this person may see: their own requests, and what they may decide. */
export const listApprovals = cache(async (orgId: string): Promise<ApprovalItem[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("approvals")
    .select(
      "id, title, details, status, requested_by, approver_id, decided_by, decided_at, decision_note, task_id, project_id, document_id, created_at",
    )
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = data ?? [];
  if (!rows.length) return [];

  const ids = <K extends "task_id" | "project_id" | "document_id">(key: K) =>
    [...new Set(rows.map((row) => row[key]).filter(Boolean))] as string[];

  const [names, tasks, projects, documents] = await Promise.all([
    getMemberNames(orgId),
    ids("task_id").length
      ? supabase.from("tasks").select("id, title").in("id", ids("task_id"))
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    ids("project_id").length
      ? supabase.from("projects").select("id, name").in("id", ids("project_id"))
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    ids("document_id").length
      ? supabase.from("documents").select("id, name").in("id", ids("document_id"))
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);

  const taskTitle = new Map((tasks.data ?? []).map((t) => [t.id, t.title]));
  const projectName = new Map((projects.data ?? []).map((p) => [p.id, p.name]));
  const documentName = new Map((documents.data ?? []).map((d) => [d.id, d.name]));

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    details: row.details,
    status: row.status as ApprovalItem["status"],
    requestedBy: row.requested_by,
    requesterName: names.get(row.requested_by) ?? "Someone",
    approverId: row.approver_id,
    approverName: row.approver_id ? (names.get(row.approver_id) ?? "Someone") : null,
    decidedByName: row.decided_by ? (names.get(row.decided_by) ?? "Someone") : null,
    decidedAt: row.decided_at,
    decisionNote: row.decision_note,
    taskId: row.task_id,
    taskTitle: row.task_id ? (taskTitle.get(row.task_id) ?? null) : null,
    projectId: row.project_id,
    projectName: row.project_id ? (projectName.get(row.project_id) ?? null) : null,
    documentId: row.document_id,
    documentName: row.document_id ? (documentName.get(row.document_id) ?? null) : null,
    createdAt: row.created_at,
  }));
});

/** Pending approvals this person can act on. */
export function waitingOn(
  approvals: ApprovalItem[],
  viewerId: string,
  manages: boolean,
): ApprovalItem[] {
  return approvals.filter(
    (approval) =>
      approval.status === "pending" &&
      approval.requestedBy !== viewerId &&
      (approval.approverId === viewerId || (approval.approverId === null && manages)),
  );
}
