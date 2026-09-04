import type { TaskState } from "@/lib/supabase/types";

/**
 * The task state machine. Pure — no database, no clock, no i18n — so it can be
 * reasoned about and tested on its own.
 *
 * The happy path is the six-step stepper (Design Direction §5.3):
 *
 *   created → delivered → acknowledged → accepted → in_progress → done → verified
 *   (Bheja)   (Dekha)      (Maana)        (Chal raha)  (Ho gaya)     (Verified)
 *
 * Three enum values are *not* steps. They are exceptions, and they render as
 * chips rather than as places on the ladder (Character document §2.1, D-11):
 *
 *   escalated   an SLA was breached, or the assignee said "nahi ho payega".
 *               It is reachable from any active state before `done`, and the
 *               task can still resume — nothing is a dead end, and "Late" is
 *               explicitly never one (§2.4).
 *   reassigned  the owner moved the work to somebody else. It is recorded as
 *               an event, but the task does not *rest* there: it settles back
 *               to `delivered` for the new person, with the clocks restarted.
 *   cancelled   the owner stopped the work. Terminal.
 */

export const TASK_STATES = [
  "created",
  "delivered",
  "acknowledged",
  "accepted",
  "in_progress",
  "done",
  "verified",
  "escalated",
  "reassigned",
  "cancelled",
] as const satisfies readonly TaskState[];

/** The six steps the stepper draws, in order. */
export const STEPPER_STATES = [
  "delivered",
  "acknowledged",
  "accepted",
  "in_progress",
  "done",
  "verified",
] as const;

export type StepperState = (typeof STEPPER_STATES)[number];

/** States that are neither finished nor abandoned. */
const ACTIVE: readonly TaskState[] = [
  "created",
  "delivered",
  "acknowledged",
  "accepted",
  "in_progress",
  "escalated",
];

/** Exceptions that any live task can fall into. */
const FROM_ANY_ACTIVE: readonly TaskState[] = [
  "escalated",
  "reassigned",
  "cancelled",
];

export const TRANSITIONS: Readonly<Record<TaskState, readonly TaskState[]>> = {
  created: ["delivered", "cancelled"],
  delivered: ["acknowledged", ...FROM_ANY_ACTIVE],
  acknowledged: ["accepted", ...FROM_ANY_ACTIVE],
  accepted: ["in_progress", "done", ...FROM_ANY_ACTIVE],
  in_progress: ["done", ...FROM_ANY_ACTIVE],
  // The owner can send a finished task back for a better proof, and can still
  // cancel or reassign it; they cannot escalate work that is already done.
  done: ["verified", "in_progress", "reassigned", "cancelled"],
  // An escalated task resumes wherever it actually is.
  escalated: [
    "acknowledged",
    "accepted",
    "in_progress",
    "done",
    "reassigned",
    "cancelled",
  ],
  // Transient: it settles to `delivered` for the new assignee.
  reassigned: ["delivered"],
  verified: [],
  cancelled: [],
};

export function isActive(state: TaskState): boolean {
  return ACTIVE.includes(state);
}

export function isTerminal(state: TaskState): boolean {
  return TRANSITIONS[state].length === 0;
}

export function canTransition(from: TaskState, to: TaskState): boolean {
  return TRANSITIONS[from].includes(to);
}

/**
 * Where a task rests after a transition.
 *
 * `reassigned` is an event, not a resting place: the work is now somebody
 * else's and it has been delivered to them, with both clocks restarted.
 */
export function settleState(to: TaskState): TaskState {
  return to === "reassigned" ? "delivered" : to;
}

export type TransitionResult =
  | { ok: true; state: TaskState; recorded: TaskState }
  | { ok: false; reason: "illegal" | "terminal" };

/**
 * The one place a transition is decided. `state` is what the row becomes;
 * `recorded` is what the audit trail says happened, which differ only for
 * `reassigned`.
 */
export function transition(from: TaskState, to: TaskState): TransitionResult {
  if (isTerminal(from)) return { ok: false, reason: "terminal" };
  if (!canTransition(from, to)) return { ok: false, reason: "illegal" };
  return { ok: true, state: settleState(to), recorded: to };
}

/**
 * How far along the stepper a task is: the index of the last completed step,
 * or -1 before delivery. Exceptions do not move the stepper — an escalated
 * task is still wherever it got to, which is why `task_events` is the source
 * for drawing it rather than the current state alone.
 */
export function stepIndex(state: TaskState): number {
  const index = (STEPPER_STATES as readonly TaskState[]).indexOf(state);
  return index;
}

/** True when the ticks glyph should be shown rather than an exception chip. */
export function showsTicks(state: TaskState): boolean {
  return !["escalated", "reassigned", "cancelled"].includes(state);
}

/** The ticks glyph state for a task, or null when a chip takes its place. */
export function ticksFor(
  state: TaskState,
): "sent" | "seen" | "accepted" | "done" | "verified" | null {
  switch (state) {
    case "created":
    case "delivered":
      return "sent";
    case "acknowledged":
      return "seen";
    case "accepted":
    case "in_progress":
      return "accepted";
    case "done":
      return "done";
    case "verified":
      return "verified";
    default:
      return null;
  }
}
