import { isLate, isUnseen } from "./present";
import { dayKey } from "./time";
import type { TaskListItem } from "./queries";

/**
 * The four numbers in the owner's header, and the two chips beside them
 * (screens/Dashboard.png, D-09).
 *
 * They count *today's* work — what the owner sent today — because that is what
 * the header is for: one glance at the day. A cumulative all-time count would
 * only ever go up and would stop meaning anything by the second week.
 *
 * The counts are cumulative along the ladder: a verified task was also done,
 * also seen, also sent. That is what makes the four numbers read as a funnel
 * rather than as four unrelated tallies.
 */
export interface DayCounters {
  bheje: number;
  dekhe: number;
  hoGaye: number;
  verified: number;
  late: number;
  dekhaNahi: number;
  /** Verified out of sent, as a percentage, or null before anything was sent. */
  completionRate: number | null;
}

const SEEN_OR_LATER = [
  "acknowledged",
  "accepted",
  "in_progress",
  "done",
  "verified",
] as const;

const DONE_OR_LATER = ["done", "verified"] as const;

export function countDay(tasks: TaskListItem[], now: Date): DayCounters {
  const today = dayKey(now);
  const sentToday = tasks.filter(
    (task) =>
      task.deliveredAt !== null &&
      dayKey(task.deliveredAt) === today &&
      task.state !== "cancelled",
  );

  const bheje = sentToday.length;
  const dekhe = sentToday.filter((t) =>
    (SEEN_OR_LATER as readonly string[]).includes(t.state),
  ).length;
  const hoGaye = sentToday.filter((t) =>
    (DONE_OR_LATER as readonly string[]).includes(t.state),
  ).length;
  const verified = sentToday.filter((t) => t.state === "verified").length;

  // The two chips look at *all* open work, not just today's: a task that went
  // late yesterday is still late, and pretending otherwise would be the one
  // thing the owner cannot afford to miss.
  const late = tasks.filter((task) => isLate(task, now)).length;
  const dekhaNahi = tasks.filter((task) => isUnseen(task, now)).length;

  return {
    bheje,
    dekhe,
    hoGaye,
    verified,
    late,
    dekhaNahi,
    completionRate: bheje === 0 ? null : Math.round((verified / bheje) * 100),
  };
}

/**
 * The "Aapke liye" list: work that needs a decision from the owner, most
 * pressing first. Everything else is just the day's list.
 */
export type NeedsYouReason = "late" | "unseen" | "verify" | "escalated";

export interface NeedsYou {
  task: TaskListItem;
  reason: NeedsYouReason;
}

export function needsYou(tasks: TaskListItem[], now: Date): NeedsYou[] {
  const out: NeedsYou[] = [];

  for (const task of tasks) {
    if (task.state === "cancelled") continue;
    if (isLate(task, now)) out.push({ task, reason: "late" });
    else if (task.state === "escalated") out.push({ task, reason: "escalated" });
    else if (isUnseen(task, now)) out.push({ task, reason: "unseen" });
    else if (task.state === "done") out.push({ task, reason: "verify" });
  }

  const order: Record<NeedsYouReason, number> = {
    late: 0,
    escalated: 1,
    unseen: 2,
    verify: 3,
  };
  return out.sort((a, b) => order[a.reason] - order[b.reason]);
}

/**
 * Open work that does not need this person right now — what they are
 * waiting on their team for. Today lists the nearest of these; Work's
 * `?need=waiting` lists all of them, by the same rule.
 */
export function waitingOnTeam(tasks: TaskListItem[], now: Date): TaskListItem[] {
  const needs = new Set(needsYou(tasks, now).map((item) => item.task.id));
  return tasks
    .filter((task) => !["done", "verified", "cancelled"].includes(task.state) && !needs.has(task.id))
    .sort((a, b) => (a.dueAt ? Date.parse(a.dueAt) : Infinity) - (b.dueAt ? Date.parse(b.dueAt) : Infinity));
}

/**
 * What this person sent in the last few minutes leads the waiting list, so
 * the work they just gave lands in front of them — then the nearest
 * deadlines. The set is unchanged (the count still matches Work).
 */
export function justSentFirst(tasks: TaskListItem[], userId: string, now: Date, withinMs = 15 * 60_000): TaskListItem[] {
  const fresh = (task: TaskListItem) => task.createdById === userId && now.getTime() - Date.parse(task.createdAt) < withinMs;
  const newestFirst = tasks.filter(fresh).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return [...newestFirst, ...tasks.filter((task) => !fresh(task))];
}

/**
 * The header's numbers from the database, exact whatever the size of the
 * business; the list-based count remains the fallback when the call fails.
 */
export function countersFromDb(
  row: { sent_today: number; seen_today: number; done_today: number; verified_today: number; late: number; unseen: number } | null | undefined,
  fallback: DayCounters,
): DayCounters {
  if (!row) return fallback;
  return {
    bheje: row.sent_today,
    dekhe: row.seen_today,
    hoGaye: row.done_today,
    verified: row.verified_today,
    late: row.late,
    dekhaNahi: row.unseen,
    completionRate: row.sent_today > 0 ? Math.round((row.verified_today / row.sent_today) * 100) : null,
  };
}
