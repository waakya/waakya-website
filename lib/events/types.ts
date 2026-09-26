/**
 * Everything that can happen in a business, named once. Modules talk to each
 * other through these, never through each other's screens.
 */
export const DOMAIN_EVENT_TYPES = [
  "lead.created",
  "contact.updated",
  "contact.assigned",
  "contact.converted",
  "opportunity.created",
  "opportunity.stage_changed",
  "task.created",
  "task.state_changed",
  "task.accepted",
  "task.submitted",
  "task.verified",
  "task.reassigned",
  "task.deadline_changed",
  "approval.requested",
  "approval.decided",
  "leave.decided",
  "membership.created",
  "membership.role_changed",
  "membership.removed",
  "module.changed",
  "record.created",
  "record.status_changed",
  "record.updated",
  "project.progress_changed",
  "project.update_published",
  "project.milestone_done",
  "proof.submitted",
  "proof.verified",
  "customer_message.received",
  "customer_message.sent",
  "customer_decision.requested",
  "customer_decision.recorded",
  "customer_access.granted",
  "customer_access.revoked",
  "vendor_work.assigned",
  "vendor_work.submitted",
  "vendor_work.verified",
  "vendor_payment.recorded",
  "campaign.sent",
  "campaign.recipient_replied",
  "integration.lead_received",
  "automation.run_failed",
  "domain.verified",
] as const;

export type DomainEventType = (typeof DOMAIN_EVENT_TYPES)[number];

export type ActorKind = "user" | "customer" | "system" | "automation" | "integration";

export interface DomainEvent {
  id: string;
  orgId: string;
  type: DomainEventType;
  entityType: string;
  entityId: string | null;
  actorKind: ActorKind;
  actorId: string | null;
  payload: Record<string, unknown>;
  depth: number;
  occurredAt: string;
}

export function isDomainEventType(value: string): value is DomainEventType {
  return (DOMAIN_EVENT_TYPES as readonly string[]).includes(value);
}
