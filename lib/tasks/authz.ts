import type { MemberRole, TaskState } from "@/lib/supabase/types";
import { canTransition } from "./state-machine";

/**
 * Who may move a task, and where.
 *
 * Pure, and separate from the state machine: a transition can be legal for the
 * task and still not be this person's to make. RLS stops a *different org*
 * writing at all; this stops the wrong person inside the same org.
 */
export type Actor = {
  role: MemberRole | null;
  /** True when this person is the one the work is assigned to. */
  isAssignee: boolean;
};

/** Owner, admin and manager run the business; a member does their own work. */
export function manages(role: MemberRole | null): boolean {
  return role === "owner" || role === "admin" || role === "manager";
}

/** What the person the work belongs to may do with it. */
const ASSIGNEE_MAY: readonly TaskState[] = [
  "acknowledged",
  "accepted",
  "in_progress",
  "done",
  // "Nahi ho payega" — declining is not a dead end; it goes to the owner.
  "escalated",
];

/** What running the business allows. */
const MANAGER_MAY: readonly TaskState[] = [
  "verified",
  "cancelled",
  "reassigned",
  "escalated",
  // Sending a finished task back for a better proof.
  "in_progress",
];

export function canActorTransition(
  actor: Actor,
  from: TaskState,
  to: TaskState,
): boolean {
  if (!canTransition(from, to)) return false;

  if (actor.isAssignee && ASSIGNEE_MAY.includes(to)) return true;
  if (manages(actor.role) && MANAGER_MAY.includes(to)) return true;

  return false;
}

/**
 * The actions a screen should offer, so the buttons and the server agree
 * rather than drifting apart.
 */
export function availableTransitions(
  actor: Actor,
  from: TaskState,
): TaskState[] {
  const candidates: TaskState[] = [
    "acknowledged",
    "accepted",
    "in_progress",
    "done",
    "verified",
    "escalated",
    "reassigned",
    "cancelled",
  ];
  return candidates.filter((to) => canActorTransition(actor, from, to));
}
