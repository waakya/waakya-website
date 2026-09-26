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

/**
 * How much of a business's work the lists load. Open work is loaded whole
 * (up to a safety cap no 2–30 person business reaches), so nothing late,
 * unseen or waiting for verification can fall off a list because newer work
 * arrived; finished work is history, so only the most recent is loaded.
 *
 * Found with a realistic busy business (Design V3): a plain "newest 200"
 * dropped 58 of 60 late tasks from Today and Work once the business had
 * more than 200 tasks.
 */
const OPEN_CAP = 2000;
const FINISHED_RECENT = 150;
const FINISHED = "(verified,cancelled)";

/** Everything open in the org plus recent history, newest first. RLS keeps it to this org. */
export const getOrgTasks = cache(
  async (orgId: string, orgAckMinutes: number): Promise<TaskListItem[]> => {
    const supabase = await createClient();
    const [open, finished, names] = await Promise.all([
      supabase
        .from("tasks")
        .select(COLUMNS)
        .eq("org_id", orgId)
        .not("state", "in", FINISHED)
        .order("created_at", { ascending: false })
        .limit(OPEN_CAP),
      supabase
        .from("tasks")
        .select(COLUMNS)
        .eq("org_id", orgId)
        .in("state", ["verified", "cancelled"])
        .order("created_at", { ascending: false })
        .limit(FINISHED_RECENT),
      getMemberNames(orgId),
    ]);
    return [...(open.data ?? []), ...(finished.data ?? [])]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((row) => shape(row, names, orgAckMinutes));
  },
);

/** One person's work: everything open plus recent history, by deadline. */
export const getMyTasks = cache(
  async (
    orgId: string,
    userId: string,
    orgAckMinutes: number,
  ): Promise<TaskListItem[]> => {
    const supabase = await createClient();
    const [open, finished, names] = await Promise.all([
      supabase
        .from("tasks")
        .select(COLUMNS)
        .eq("org_id", orgId)
        .eq("assigned_to", userId)
        .not("state", "in", FINISHED)
        .order("due_at", { ascending: true, nullsFirst: false })
        .limit(OPEN_CAP),
      supabase
        .from("tasks")
        .select(COLUMNS)
        .eq("org_id", orgId)
        .eq("assigned_to", userId)
        .in("state", ["verified", "cancelled"])
        .order("created_at", { ascending: false })
        .limit(FINISHED_RECENT),
      getMemberNames(orgId),
    ]);
    const byDue = (a: { due_at: string | null }, b: { due_at: string | null }) =>
      (a.due_at ?? "9999").localeCompare(b.due_at ?? "9999");
    return [...(open.data ?? []), ...(finished.data ?? [])].sort(byDue).map((row) => shape(row, names, orgAckMinutes));
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
