import { describe, expect, it } from "vitest";
import { actionSchema, evaluateCondition, matches, parseStoredRule, readField, render, ruleSchema, shouldFire, type EventLike } from "./engine";

const lead: EventLike = {
  type: "lead.created",
  actorKind: "integration",
  depth: 0,
  payload: { title: "Meera Joshi", source: "website", tags: ["estimator", "office"], value: 2400, project_name: null, nested: { city: "Pune" } },
};

describe("reading an event", () => {
  it("reads top-level facts and dotted payload paths", () => {
    expect(readField(lead, "type")).toBe("lead.created");
    expect(readField(lead, "payload.source")).toBe("website");
    expect(readField(lead, "source")).toBe("website");
    expect(readField(lead, "nested.city")).toBe("Pune");
    expect(readField(lead, "nested.missing.deeper")).toBeUndefined();
  });
});

describe("conditions", () => {
  it("compare without caring about case or type noise", () => {
    expect(evaluateCondition({ field: "source", op: "eq", value: "Website" }, lead)).toBe(true);
    expect(evaluateCondition({ field: "value", op: "gt", value: "2000" }, lead)).toBe(true);
    expect(evaluateCondition({ field: "value", op: "lt", value: 2000 }, lead)).toBe(false);
    expect(evaluateCondition({ field: "source", op: "in", value: "referral, website" }, lead)).toBe(true);
    expect(evaluateCondition({ field: "tags", op: "contains", value: "estimator" }, lead)).toBe(true);
    expect(evaluateCondition({ field: "title", op: "contains", value: "joshi" }, lead)).toBe(true);
    expect(evaluateCondition({ field: "project_name", op: "is_set" }, lead)).toBe(false);
    expect(evaluateCondition({ field: "project_name", op: "not_set" }, lead)).toBe(true);
    expect(evaluateCondition({ field: "source", op: "neq", value: "website" }, lead)).toBe(false);
  });
  it("all must hold; none always holds", () => {
    expect(matches({ all: [] }, lead)).toBe(true);
    expect(matches({ all: [{ field: "source", op: "eq", value: "website" }, { field: "value", op: "gt", value: 5000 }] }, lead)).toBe(false);
  });
});

describe("firing", () => {
  const rule = { triggerEvent: "lead.created", enabled: true, conditions: { all: [{ field: "source", op: "eq" as const, value: "website" }] } };
  it("fires on the right event with matching conditions", () => {
    expect(shouldFire(rule, lead)).toEqual({ fire: true });
  });
  it("never fires when disabled, on another event, or too deep in a chain", () => {
    expect(shouldFire({ ...rule, enabled: false }, lead)).toEqual({ fire: false, reason: "disabled" });
    expect(shouldFire(rule, { ...lead, type: "task.created" })).toEqual({ fire: false, reason: "other_event" });
    expect(shouldFire(rule, { ...lead, depth: 3 })).toEqual({ fire: false, reason: "too_deep" });
    expect(shouldFire(rule, { ...lead, payload: { source: "call" } })).toEqual({ fire: false, reason: "conditions" });
  });
});

describe("templates", () => {
  it("fill known keys and blank unknown ones", () => {
    expect(render("Call {{title}} from {{source}} about {{payload.nested.city}} {{nope}}", lead)).toBe("Call Meera Joshi from website about Pune ");
  });
});

describe("rule shape", () => {
  it("validates actions strictly and keeps bad stored rules inert", () => {
    expect(actionSchema.safeParse({ type: "create_task", title: "Follow up", due_in_minutes: 60 }).success).toBe(true);
    expect(actionSchema.safeParse({ type: "create_task" }).success).toBe(false);
    expect(actionSchema.safeParse({ type: "notify_member", body: "x", href: "https://evil.example" }).success).toBe(false);
    expect(actionSchema.safeParse({ type: "delete_everything" }).success).toBe(false);
    const stored = parseStoredRule({ trigger_event: "lead.created", conditions: { all: [] }, actions: [{ type: "nonsense" }], enabled: true });
    expect(stored.enabled).toBe(false);
    expect(stored.valid).toBe(false);
  });
  it("accepts a whole rule", () => {
    expect(
      ruleSchema.safeParse({
        name: "Website leads",
        triggerEvent: "lead.created",
        conditions: { all: [{ field: "source", op: "eq", value: "website" }] },
        actions: [{ type: "assign_contact" }, { type: "create_task", title: "Call {{title}}" }],
      }).success,
    ).toBe(true);
  });
});
