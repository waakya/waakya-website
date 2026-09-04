import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getMemberNames } from "@/lib/org/members";
import type { TaskState } from "@/lib/supabase/types";
import type { StepperState } from "./state-machine";
import { STEPPER_STATES } from "./state-machine";
import { reminderTimes } from "./sla";

export interface TimelineEntry {
  id: string;
  from: TaskState | null;
  to: TaskState;
  actorId: string | null;
  actorName: string;
  note: string | null;
  at: string;
}

export interface ThreadMessage {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  at: string;
}

/**
 * The audit trail, in order. The stepper is drawn from this rather than from
 * the task's current state, so a task that was escalated and resumed still
 * shows every step it actually passed through, with the time it happened.
 */
export async function getTaskTimeline(
  taskId: string,
  orgId: string,
): Promise<TimelineEntry[]> {
  const supabase = await createClient();
  const [{ data }, names] = await Promise.all([
    supabase
      .from("task_events")
      .select("id, from_state, to_state, actor_id, note, created_at")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true }),
    getMemberNames(orgId),
  ]);

  return (data ?? [])
    // `created` and `delivered` are written together and both read "Bheja".
    // The reader only cares that it was sent, so the row that says so once is
    // `delivered`; `created` stays in the table as the audit record.
    .filter((row) => row.to_state !== "created")
    .map((row) => ({
      id: row.id,
      from: row.from_state,
      to: row.to_state,
      actorId: row.actor_id,
      actorName: row.actor_id ? (names.get(row.actor_id) ?? "—") : "—",
      note: row.note,
      at: row.created_at,
    }));
}

export async function getTaskThread(
  taskId: string,
  orgId: string,
): Promise<ThreadMessage[]> {
  const supabase = await createClient();
  const [{ data }, names] = await Promise.all([
    supabase
      .from("task_messages")
      .select("id, author_id, body, created_at")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true }),
    getMemberNames(orgId),
  ]);

  return (data ?? []).map((row) => ({
    id: row.id,
    authorId: row.author_id,
    authorName: names.get(row.author_id) ?? "—",
    body: row.body,
    at: row.created_at,
  }));
}

/** When each stepper step was first reached, from the audit trail. */
export function reachedFrom(
  timeline: TimelineEntry[],
): Partial<Record<StepperState, string>> {
  const reached: Partial<Record<StepperState, string>> = {};
  for (const entry of timeline) {
    const step = entry.to as StepperState;
    if (STEPPER_STATES.includes(step) && !reached[step]) {
      reached[step] = entry.at;
    }
  }
  return reached;
}

/**
 * The step the task is showing now.
 *
 * An exception — escalated, reassigned, cancelled — does not move the stepper
 * (D-11), so for those the task is still wherever it actually got to, which
 * the audit trail knows and the current state does not.
 */
export function currentStep(
  state: TaskState,
  timeline: TimelineEntry[],
): StepperState | null {
  if (STEPPER_STATES.includes(state as StepperState)) {
    return state as StepperState;
  }
  for (let i = timeline.length - 1; i >= 0; i -= 1) {
    const step = timeline[i].to as StepperState;
    if (STEPPER_STATES.includes(step)) return step;
  }
  return null;
}

/** The next reminder still to come, for the clock bar's label. */
export function nextReminder(
  deliveredAt: string | null,
  dueAt: string | null,
  now: Date,
): string | null {
  const upcoming = reminderTimes(deliveredAt, dueAt).find(
    (time) => time.getTime() > now.getTime(),
  );
  return upcoming ? upcoming.toISOString() : null;
}
