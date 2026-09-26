import type { MemberRole } from "@/lib/supabase/types";

/**
 * Who may do what. One matrix, read by the UI (to render), by every server
 * action (to refuse) and mirrored by row level security (to enforce).
 *
 * Roles are the Phase-1 four plus `customer`, which is not a membership but a
 * separate principal with its own doors (lib/portal).
 */
export type Principal = MemberRole | "customer";

export type Capability =
  | "modules.manage"
  | "audit.read"
  | "team.invite"
  | "team.role.change"
  | "tasks.create"
  | "tasks.verify"
  | "tasks.reassign"
  | "projects.manage"
  | "projects.updates.publish"
  | "crm.read"
  | "crm.write"
  | "crm.assign"
  | "crm.pipeline.manage"
  | "records.read"
  | "records.write"
  | "records.status.change"
  | "records.types.manage"
  | "vendors.read"
  | "vendors.write"
  | "vendors.verify"
  | "vendors.payment.record"
  | "portal.access.manage"
  | "portal.decision.request"
  | "portal.decision.decide"
  | "portal.project.read"
  | "automation.manage"
  | "integrations.manage"
  | "campaigns.manage"
  | "campaigns.send"
  | "domains.manage";

const OWNER_ADMIN: Principal[] = ["owner", "admin"];
const MANAGERS: Principal[] = ["owner", "admin", "manager"];
const STAFF: Principal[] = ["owner", "admin", "manager", "member"];

const MATRIX: Record<Capability, readonly Principal[]> = {
  "modules.manage": OWNER_ADMIN,
  "audit.read": MANAGERS,
  "team.invite": MANAGERS,
  "team.role.change": OWNER_ADMIN,
  "tasks.create": STAFF,
  "tasks.verify": MANAGERS,
  "tasks.reassign": MANAGERS,
  "projects.manage": MANAGERS,
  "projects.updates.publish": MANAGERS,
  "crm.read": STAFF,
  "crm.write": STAFF,
  "crm.assign": MANAGERS,
  "crm.pipeline.manage": OWNER_ADMIN,
  "records.read": STAFF,
  "records.write": STAFF,
  "records.status.change": STAFF,
  "records.types.manage": OWNER_ADMIN,
  "vendors.read": STAFF,
  "vendors.write": MANAGERS,
  "vendors.verify": MANAGERS,
  "vendors.payment.record": OWNER_ADMIN,
  "portal.access.manage": MANAGERS,
  "portal.decision.request": MANAGERS,
  "portal.decision.decide": ["customer"],
  "portal.project.read": ["customer"],
  "automation.manage": OWNER_ADMIN,
  "integrations.manage": OWNER_ADMIN,
  "campaigns.manage": MANAGERS,
  "campaigns.send": OWNER_ADMIN,
  "domains.manage": OWNER_ADMIN,
};

export function can(role: Principal | null | undefined, capability: Capability): boolean {
  if (!role) return false;
  return MATRIX[capability].includes(role);
}

export const CAPABILITIES = Object.keys(MATRIX) as Capability[];
