import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getMemberNames } from "@/lib/org/members";
import type { TaskPriority, TaskState } from "@/lib/supabase/types";
import type { TaskForDisplay } from "./present";

export interface TaskListItem extends TaskForDisplay {
  id: string;
  title: string;
  details: string | null;
  assigneeId: string | null;
  assigneeName: string;
  createdById: string;
  createdByName: string;
  createdAt: string;
  state: TaskState;
  priority: TaskPriority;
  /** Set when this task is one day's instance of a daily routine. */
  checklistItemId: string | null;
  checklistDate: string | null;
}

const COLUMNS =
  "id, title, details, state, priority, proof_required, assigned_to, created_by, ack_minutes, due_at, delivered_at, acknowledged_at, accepted_at, started_at, done_at, verified_at, cancelled_at, created_at, checklist_item_id, checklist_date";

/** Everything in the org, newest first. RLS keeps it to this org. */
export const getOrgTasks = cache(
  async (orgId: string, orgAckMinutes: number): Promise<TaskListItem[]> => {
    const supabase = await createClient();
    const [{ data }, names] = await Promise.all([
      supabase
        .from("tasks")
        .select(COLUMNS)
        .eq("org_id", orgId)
        .order("created_at", { ascending: false })
        .limit(200),
      getMemberNames(orgId),
    ]);
    return (data ?? []).map((row) => shape(row, names, orgAckMinutes));
  },
);

/** One person's work. */
export const getMyTasks = cache(
  async (
    orgId: string,
    userId: string,
    orgAckMinutes: number,
  ): Promise<TaskListItem[]> => {
    const supabase = await createClient();
    const [{ data }, names] = await Promise.all([
      supabase
        .from("tasks")
        .select(COLUMNS)
        .eq("org_id", orgId)
        .eq("assigned_to", userId)
        .order("due_at", { ascending: true, nullsFirst: false })
        .limit(200),
      getMemberNames(orgId),
    ]);
    return (data ?? []).map((row) => shape(row, names, orgAckMinutes));
  },
);

export const getTask = cache(
  async (
    taskId: string,
    orgId: string,
    orgAckMinutes: number,
  ): Promise<TaskListItem | null> => {
    const supabase = await createClient();
    const [{ data }, names] = await Promise.all([
      supabase.from("tasks").select(COLUMNS).eq("id", taskId).maybeSingle(),
      getMemberNames(orgId),
    ]);
    return data ? shape(data, names, orgAckMinutes) : null;
  },
);

type Row = {
  id: string;
  title: string;
  details: string | null;
  state: TaskState;
  priority: TaskPriority;
  proof_required: boolean;
  assigned_to: string | null;
  created_by: string;
  ack_minutes: number | null;
  due_at: string | null;
  delivered_at: string | null;
  acknowledged_at: string | null;
  done_at: string | null;
  created_at: string;
  checklist_item_id: string | null;
  checklist_date: string | null;
};

function shape(
  row: Row,
  names: Map<string, string>,
  orgAckMinutes: number,
): TaskListItem {
  return {
    id: row.id,
    title: row.title,
    details: row.details,
    state: row.state,
    priority: row.priority,
    proofRequired: row.proof_required,
    assigneeId: row.assigned_to,
    assigneeName: row.assigned_to ? (names.get(row.assigned_to) ?? "—") : "—",
    createdById: row.created_by,
    createdByName: names.get(row.created_by) ?? "—",
    dueAt: row.due_at,
    deliveredAt: row.delivered_at,
    acknowledgedAt: row.acknowledged_at,
    doneAt: row.done_at,
    // A task can override the org's acknowledge SLA; most do not.
    ackMinutes: row.ack_minutes ?? orgAckMinutes,
    createdAt: row.created_at,
    checklistItemId: row.checklist_item_id,
    checklistDate: row.checklist_date,
  };
}
