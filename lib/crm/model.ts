/**
 * The CRM's pure rules: identities, stages, follow-ups. No database, no
 * clock, so every rule is a unit test.
 */

/** India first: ten digits become +91; anything already international stays. */
export function normalizePhone(input: string | null | undefined): string | null {
  if (!input) return null;
  const digits = input.replace(/[^\d+]/g, "");
  if (!digits) return null;
  if (digits.startsWith("+")) {
    const rest = digits.slice(1).replace(/\D/g, "");
    return /^[1-9]\d{6,14}$/.test(rest) ? `+${rest}` : null;
  }
  const bare = digits.replace(/\D/g, "");
  if (/^[6-9]\d{9}$/.test(bare)) return `+91${bare}`;
  if (/^0[6-9]\d{9}$/.test(bare)) return `+91${bare.slice(1)}`;
  if (/^91[6-9]\d{9}$/.test(bare)) return `+${bare}`;
  if (/^[1-9]\d{6,14}$/.test(bare) && bare.length > 10) return `+${bare}`;
  return null;
}

export function normalizeEmail(input: string | null | undefined): string | null {
  if (!input) return null;
  const value = input.trim().toLowerCase();
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value) ? value : null;
}

export interface StageLike {
  id: string;
  pipelineId: string;
  kind: "open" | "won" | "lost";
  position: number;
}

/** A deal moves only inside its own pipeline; a closed deal moves only if reopened by a manager. */
export function canMoveStage(
  opportunity: { pipelineId: string; status: "open" | "won" | "lost" },
  to: StageLike,
  actor: { manages: boolean },
): { ok: true } | { ok: false; reason: "other_pipeline" | "closed" } {
  if (to.pipelineId !== opportunity.pipelineId) return { ok: false, reason: "other_pipeline" };
  if (opportunity.status !== "open" && !actor.manages) return { ok: false, reason: "closed" };
  return { ok: true };
}

export type FollowUpState = "due" | "overdue" | "scheduled" | "none";

/** What Today says about a contact's next action. */
export function followUpState(nextActionAt: string | null, now: Date): FollowUpState {
  if (!nextActionAt) return "none";
  const at = new Date(nextActionAt).getTime();
  const dayEnd = endOfIstDay(now).getTime();
  if (at < now.getTime()) return "overdue";
  if (at <= dayEnd) return "due";
  return "scheduled";
}

/** 23:59:59 in Asia/Kolkata for the calendar day that contains `now`. */
export function endOfIstDay(now: Date): Date {
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  const y = ist.getUTCFullYear();
  const m = ist.getUTCMonth();
  const d = ist.getUTCDate();
  return new Date(Date.UTC(y, m, d, 23, 59, 59) - 5.5 * 60 * 60 * 1000);
}

/** A lead with an open deal and nobody's name on it is the CRM's loudest state. */
export function isUnassignedLead(contact: { kind: "lead" | "customer"; ownerId: string | null; archivedAt: string | null }): boolean {
  return contact.kind === "lead" && !contact.ownerId && !contact.archivedAt;
}

export const CONTACT_SOURCES = ["website", "referral", "walk_in", "call", "whatsapp", "campaign", "social", "other"] as const;
export type ContactSource = (typeof CONTACT_SOURCES)[number];

export const ACTIVITY_KINDS = ["note", "call", "meeting", "message", "email", "whatsapp"] as const;
export type LoggableActivity = (typeof ACTIVITY_KINDS)[number];
