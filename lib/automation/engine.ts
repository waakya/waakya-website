import { z } from "zod";

import { DOMAIN_EVENT_TYPES } from "@/lib/events/types";

/**
 * WHEN → IF → DO, as data. Pure: conditions are evaluated here, actions are
 * validated here, and nothing here touches a database, so every rule of the
 * engine is a unit test.
 */

export const CONDITION_OPS = ["eq", "neq", "in", "contains", "gt", "lt", "is_set", "not_set"] as const;
export type ConditionOp = (typeof CONDITION_OPS)[number];

export const conditionSchema = z.object({
  field: z.string().regex(/^[a-z_][a-z0-9_.]{0,80}$/),
  op: z.enum(CONDITION_OPS),
  value: z.union([z.string().max(200), z.number(), z.boolean(), z.array(z.string().max(200)).max(50)]).optional(),
});
export type Condition = z.infer<typeof conditionSchema>;

export const conditionsSchema = z.object({ all: z.array(conditionSchema).max(20).default([]) });
export type Conditions = z.infer<typeof conditionsSchema>;

export const ACTION_TYPES = [
  "assign_contact",
  "create_task",
  "notify_member",
  "move_opportunity",
  "set_record_status",
  "publish_customer_update",
  "request_verification",
  "send_email",
  "send_whatsapp_template",
] as const;
export type ActionType = (typeof ACTION_TYPES)[number];

const uuid = z.string().uuid();
const optionalUuid = uuid.optional().or(z.literal(""));

export const actionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("assign_contact"), member_id: optionalUuid }),
  z.object({
    type: z.literal("create_task"),
    title: z.string().trim().min(1).max(140),
    details: z.string().trim().max(1000).optional().or(z.literal("")),
    assignee_id: optionalUuid,
    due_in_minutes: z.number().int().min(5).max(60 * 24 * 60).optional(),
    priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  }),
  z.object({
    type: z.literal("notify_member"),
    member_id: optionalUuid,
    role: z.enum(["owner", "admin", "manager", "member"]).optional(),
    body: z.string().trim().min(1).max(280),
    href: z.string().regex(/^\/[^/].*$/).max(200).optional().or(z.literal("")),
  }),
  z.object({ type: z.literal("move_opportunity"), stage_id: uuid }),
  z.object({ type: z.literal("set_record_status"), status: z.string().min(1).max(40), record_id: optionalUuid }),
  z.object({ type: z.literal("publish_customer_update"), body: z.string().trim().min(1).max(2000), customer_visible: z.boolean().optional() }),
  z.object({ type: z.literal("request_verification"), title: z.string().trim().max(140).optional().or(z.literal("")) }),
  z.object({
    type: z.literal("send_email"),
    subject: z.string().trim().min(1).max(140),
    body: z.string().trim().min(1).max(4000),
    to: z.enum(["contact", "member"]).default("contact"),
    member_id: optionalUuid,
  }),
  z.object({ type: z.literal("send_whatsapp_template"), template_id: uuid, to: z.enum(["contact"]).default("contact") }),
]);
export type Action = z.infer<typeof actionSchema>;

export const ruleSchema = z.object({
  name: z.string().trim().min(1).max(120),
  triggerEvent: z.enum(DOMAIN_EVENT_TYPES),
  conditions: conditionsSchema,
  actions: z.array(actionSchema).min(1).max(10),
  enabled: z.boolean().default(true),
});
export type RuleInput = z.infer<typeof ruleSchema>;

/** Events a rule may listen for — those a business can act on, not the engine's own. */
export const TRIGGERABLE_EVENTS = DOMAIN_EVENT_TYPES.filter((e) => !e.startsWith("automation.") && !e.startsWith("module.") && !e.startsWith("membership."));

/** The deepest chain of automation-caused events a rule will still fire on. */
export const MAX_DEPTH = 3;

export interface EventLike {
  type: string;
  actorKind: string;
  depth: number;
  payload: Record<string, unknown>;
}

/** Read a dotted path from the event: `payload.source`, `type`, `actor_kind`. */
export function readField(event: EventLike, field: string): unknown {
  if (field === "type") return event.type;
  if (field === "actor_kind") return event.actorKind;
  if (field === "depth") return event.depth;
  const path = field.startsWith("payload.") ? field.slice("payload.".length) : field;
  let value: unknown = event.payload;
  for (const key of path.split(".")) {
    if (value === null || typeof value !== "object") return undefined;
    value = (value as Record<string, unknown>)[key];
  }
  return value;
}

function same(a: unknown, b: unknown): boolean {
  if (typeof a === "number" || typeof b === "number") return Number(a) === Number(b);
  if (typeof a === "boolean" || typeof b === "boolean") return String(a) === String(b);
  return String(a ?? "").toLowerCase() === String(b ?? "").toLowerCase();
}

export function evaluateCondition(condition: Condition, event: EventLike): boolean {
  const actual = readField(event, condition.field);
  const expected = condition.value;
  switch (condition.op) {
    case "is_set":
      return actual !== undefined && actual !== null && actual !== "";
    case "not_set":
      return actual === undefined || actual === null || actual === "";
    case "eq":
      return same(actual, expected);
    case "neq":
      return !same(actual, expected);
    case "in": {
      const list = Array.isArray(expected) ? expected : String(expected ?? "").split(",").map((s) => s.trim());
      return list.some((v) => same(actual, v));
    }
    case "contains": {
      if (Array.isArray(actual)) return actual.some((v) => same(v, expected));
      return String(actual ?? "").toLowerCase().includes(String(expected ?? "").toLowerCase());
    }
    case "gt":
      return Number(actual) > Number(expected);
    case "lt":
      return Number(actual) < Number(expected);
  }
}

/** All conditions must hold; an empty list always matches. */
export function matches(conditions: Conditions, event: EventLike): boolean {
  return conditions.all.every((c) => evaluateCondition(c, event));
}

/** Should this rule fire on this event at all? */
export function shouldFire(rule: { triggerEvent: string; enabled: boolean; conditions: Conditions }, event: EventLike): { fire: boolean; reason?: "disabled" | "other_event" | "too_deep" | "conditions" } {
  if (!rule.enabled) return { fire: false, reason: "disabled" };
  if (rule.triggerEvent !== event.type) return { fire: false, reason: "other_event" };
  if (event.depth >= MAX_DEPTH) return { fire: false, reason: "too_deep" };
  if (!matches(rule.conditions, event)) return { fire: false, reason: "conditions" };
  return { fire: true };
}

/** `{{title}}`, `{{project}}`, `{{payload.x}}` substitution for messages; unknown keys become empty. */
export function render(template: string, event: EventLike): string {
  return template.replace(/\{\{\s*([a-z_][a-z0-9_.]*)\s*\}\}/gi, (_, key: string) => {
    const short: Record<string, string> = { title: "payload.title", project: "payload.project_name", name: "payload.title", source: "payload.source" };
    const value = readField(event, short[key] ?? key);
    return value === undefined || value === null ? "" : String(value);
  });
}

/** Parse stored JSON into typed rule parts; invalid stored data becomes an inert rule rather than a crash. */
export function parseStoredRule(row: { trigger_event: string; conditions: unknown; actions: unknown; enabled: boolean }): { triggerEvent: string; enabled: boolean; conditions: Conditions; actions: Action[]; valid: boolean } {
  const conditions = conditionsSchema.safeParse(row.conditions);
  const actions = z.array(actionSchema).safeParse(row.actions);
  return {
    triggerEvent: row.trigger_event,
    enabled: row.enabled && conditions.success && actions.success,
    conditions: conditions.success ? conditions.data : { all: [] },
    actions: actions.success ? actions.data : [],
    valid: conditions.success && actions.success,
  };
}
