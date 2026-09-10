import type { TaskState } from "@/lib/supabase/types";
import { REMINDER_FRACTIONS, ackDeadline, reminderTimes } from "@/lib/tasks/sla";
import { atIstTime } from "@/lib/tasks/time";

/**
 * The SLA engine: given what the database holds and what time it is, decide
 * what should be sent. Pure — no database, no network, no `Date.now()` — so
 * every rule below is a test rather than a thing you find out in production.
 *
 * The differentiator lives here (CLAUDE.md §2.4): reminders to staff at 50%
 * and 90% of the time budget, and escalation to the owner when a clock runs
 * out. What the owner sees on the clock bars is what the staff member was
 * reminded about, because both read these same numbers.
 */

export interface SlaOrg {
  id: string;
  name: string;
  /** The default acknowledge SLA, in minutes. */
  ackMinutes: number;
  /** "21:00" — no reminders after this... */
  quietStart: string;
  /** ..."08:00" — until this. Local to Asia/Kolkata. */
  quietEnd: string;
}

export interface SlaTask {
  id: string;
  orgId: string;
  title: string;
  state: TaskState;
  assignedTo: string | null;
  createdBy: string;
  deliveredAt: string | null;
  dueAt: string | null;
  acknowledgedAt: string | null;
  doneAt: string | null;
  /** The task's own SLA if it has one, else the org's. */
  ackMinutes: number;
  /** Escalations already on record for this task, and when they were raised. */
  escalated: readonly { reason: EscalationReason; at: string }[];
}

export type EscalationReason = "ack_sla" | "completion_sla";

export type SlaAction =
  | {
      kind: "reminder";
      /** Which clock is running out. */
      clock: "ack" | "completion";
      fraction: number;
      taskId: string;
      orgId: string;
      /** Always the assignee: reminders go to the person doing the work. */
      userId: string;
      /** Stable for all time, so this reminder is sent exactly once. */
      dedupeKey: string;
    }
  | {
      kind: "escalation";
      reason: EscalationReason;
      taskId: string;
      orgId: string;
      /** Always the owner who sent it: escalation is the owner's problem. */
      userId: string;
      dedupeKey: string;
      /**
       * True when the row is already in `escalations` and this action is only
       * chasing the message. The runner uses it to skip an insert it knows
       * would conflict.
       */
      alreadyRecorded: boolean;
    };

/** States where no clock is running any more. */
const FINISHED: readonly TaskState[] = ["done", "verified", "cancelled"];

/**
 * How long a recorded escalation keeps trying to reach the owner.
 *
 * An escalation raised during quiet hours has its row written immediately and
 * its message sent on the first tick after 8am, so the retry window has to
 * outlast a night. It must also *end*: without this, every task that ever went
 * late would be re-attempted on every tick for the life of the business, and
 * the job would get slower every week.
 */
const ESCALATION_RETRY_MS = 24 * 60 * 60 * 1000;

/**
 * Whether this escalation still needs attempting: either it is new, or it was
 * raised recently enough that its message may still be owed.
 *
 * A row whose timestamp cannot be read counts as settled, not as new: the
 * escalation is on record either way, and guessing "new" would retry it on
 * every tick for ever.
 */
function escalationDue(
  task: SlaTask,
  reason: EscalationReason,
  now: Date,
): "new" | "retry" | "settled" {
  const found = task.escalated.find((e) => e.reason === reason);
  if (!found) return "new";
  const at = Date.parse(found.at);
  if (Number.isNaN(at)) return "settled";
  return now.getTime() - at < ESCALATION_RETRY_MS ? "retry" : "settled";
}

export interface PlanResult {
  /** What to send now. */
  send: SlaAction[];
  /**
   * Escalations that are due but whose message is held back by quiet hours.
   * The row is still written — the record must be true even at 11pm — and the
   * message goes out on the first tick after quiet hours, once, because the
   * dedupe key never changes.
   */
  recordOnly: SlaAction[];
}

/**
 * Everything owed for one org at this instant.
 *
 * Reminders are compared against absolute instants rather than a recomputed
 * percentage, so a job that runs late still owes the earlier reminder instead
 * of silently skipping it.
 */
export function planSlaActions(
  tasks: readonly SlaTask[],
  org: SlaOrg,
  now: Date,
): PlanResult {
  const quiet = isQuietHour(org, now);
  const send: SlaAction[] = [];
  const recordOnly: SlaAction[] = [];

  for (const task of tasks) {
    if (FINISHED.includes(task.state)) continue;
    // "Cannot do" hands the task to the owner; reminding or alarming about
    // the assignee would chase the wrong person.
    if (task.state === "escalated") continue;
    if (!task.deliveredAt) continue;

    const assignee = task.assignedTo;
    const ackEndsAt = ackDeadline(task.deliveredAt, task.ackMinutes);

    // --- The acknowledge clock.
    if (!task.acknowledgedAt && ackEndsAt) {
      if (ackEndsAt.getTime() <= now.getTime()) {
        const due = escalationDue(task, "ack_sla", now);
        const action: SlaAction = {
          kind: "escalation",
          reason: "ack_sla",
          taskId: task.id,
          orgId: task.orgId,
          userId: task.createdBy,
          dedupeKey: `${task.id}:escalated:ack_sla`,
          alreadyRecorded: due !== "new",
        };
        if (due === "new") (quiet ? recordOnly : send).push(action);
        // The row exists but the message may have been held back earlier;
        // the notification's dedupe key makes a retry harmless.
        else if (due === "retry" && !quiet) send.push(action);
      } else if (assignee) {
        for (const [fraction, at] of zip(
          REMINDER_FRACTIONS,
          reminderTimes(task.deliveredAt, ackEndsAt),
        )) {
          if (at.getTime() <= now.getTime() && !quiet) {
            send.push({
              kind: "reminder",
              clock: "ack",
              fraction,
              taskId: task.id,
              orgId: task.orgId,
              userId: assignee,
              dedupeKey: `${task.id}:ack_reminder:${fraction}`,
            });
          }
        }
      }
    }

    // --- The completion clock.
    if (!task.dueAt) continue;
    const due = Date.parse(task.dueAt);

    if (due <= now.getTime()) {
      const due = escalationDue(task, "completion_sla", now);
      const action: SlaAction = {
        kind: "escalation",
        reason: "completion_sla",
        taskId: task.id,
        orgId: task.orgId,
        userId: task.createdBy,
        dedupeKey: `${task.id}:escalated:completion_sla`,
        alreadyRecorded: due !== "new",
      };
      if (due === "new") (quiet ? recordOnly : send).push(action);
      else if (due === "retry" && !quiet) send.push(action);
      continue;
    }

    if (!assignee || quiet) continue;

    // Reminders are only worth sending while the deadline is still ahead;
    // past it the task is late and the owner has been told instead.
    for (const [fraction, at] of zip(
      REMINDER_FRACTIONS,
      reminderTimes(task.deliveredAt, task.dueAt),
    )) {
      if (at.getTime() <= now.getTime()) {
        send.push({
          kind: "reminder",
          clock: "completion",
          fraction,
          taskId: task.id,
          orgId: task.orgId,
          userId: assignee,
          dedupeKey: `${task.id}:completion_reminder:${fraction}`,
        });
      }
    }
  }

  return { send, recordOnly };
}

/**
 * Quiet hours, in Asia/Kolkata, and they wrap midnight: 21:00 to 08:00 is the
 * night, not a nineteen-hour window.
 */
export function isQuietHour(org: SlaOrg, now: Date): boolean {
  const minutes = istMinutesOfDay(now);
  const start = parseClock(org.quietStart);
  const end = parseClock(org.quietEnd);
  if (start === null || end === null) return false;
  if (start === end) return false;
  return start < end
    ? minutes >= start && minutes < end
    : minutes >= start || minutes < end;
}

/**
 * When a message due at `at` will really be delivered: unchanged outside
 * quiet hours, else the end of the quiet window (next morning). The screen
 * uses it so "reminder 5:20 am" reads "reminder 8:00 am" instead.
 */
export function deliveredAfterQuiet(
  org: Pick<SlaOrg, "quietStart" | "quietEnd">,
  at: Date,
): Date {
  if (!isQuietHour(org as SlaOrg, at)) return at;
  const end = parseClock(org.quietEnd);
  const start = parseClock(org.quietStart);
  if (end === null || start === null) return at;
  const minutes = istMinutesOfDay(at);
  // Wrapping window (21:00–08:00): before midnight the end is tomorrow's.
  const dayOffset = start > end && minutes >= start ? 1 : 0;
  return atIstTime(at, Math.floor(end / 60), end % 60, dayOffset);
}

function parseClock(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const mins = Number(match[2]);
  if (hours > 23 || mins > 59) return null;
  return hours * 60 + mins;
}

function istMinutesOfDay(at: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(at);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");
  return (get("hour") % 24) * 60 + get("minute");
}

function zip<A, B>(a: readonly A[], b: readonly B[]): [A, B][] {
  return a.map((value, index) => [value, b[index]] as [A, B]).filter(([, y]) => y !== undefined);
}
