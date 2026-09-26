import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { parseStoredRule, type Action, type Conditions } from "./engine";

export interface RuleRow {
  id: string;
  name: string;
  triggerEvent: string;
  conditions: Conditions;
  actions: Action[];
  enabled: boolean;
  valid: boolean;
  runCount: number;
  failCount: number;
  lastRunAt: string | null;
}

export interface RunRow {
  id: string;
  status: string;
  attempts: number;
  error: string | null;
  log: unknown[];
  startedAt: string | null;
  finishedAt: string | null;
  eventType: string;
  eventTitle: string | null;
}

export const listRules = cache(async (orgId: string): Promise<RuleRow[]> => {
  const supabase = await createClient();
  const { data } = await supabase.from("automation_rules").select("*").eq("org_id", orgId).order("created_at", { ascending: true });
  return (data ?? []).map((r) => {
    const parsed = parseStoredRule(r);
    return {
      id: r.id,
      name: r.name,
      triggerEvent: r.trigger_event,
      conditions: parsed.conditions,
      actions: parsed.actions,
      enabled: r.enabled,
      valid: parsed.valid,
      runCount: r.run_count,
      failCount: r.fail_count,
      lastRunAt: r.last_run_at,
    };
  });
});

export const getRule = cache(async (orgId: string, id: string): Promise<{ rule: RuleRow; runs: RunRow[] } | null> => {
  const rules = await listRules(orgId);
  const rule = rules.find((r) => r.id === id);
  if (!rule) return null;
  const supabase = await createClient();
  const { data: runs } = await supabase
    .from("automation_runs")
    .select("id, status, attempts, error, log, started_at, finished_at, domain_events(event_type, payload)")
    .eq("rule_id", id)
    .order("created_at", { ascending: false })
    .limit(30);
  return {
    rule,
    runs: (runs ?? []).map((r) => {
      const ev = r.domain_events as { event_type: string; payload: Record<string, unknown> | null } | null;
      return {
        id: r.id,
        status: r.status,
        attempts: r.attempts,
        error: r.error,
        log: (r.log as unknown[]) ?? [],
        startedAt: r.started_at,
        finishedAt: r.finished_at,
        eventType: ev?.event_type ?? "",
        eventTitle: typeof ev?.payload?.title === "string" ? (ev.payload.title as string) : null,
      };
    }),
  };
});

/** Ready-made rules a business can install as a starting point. */
export const RULE_EXAMPLES: Record<string, { triggerEvent: string; conditions: Conditions; actions: Action[] }> = {
  websiteLead: {
    triggerEvent: "lead.created",
    conditions: { all: [{ field: "source", op: "eq", value: "website" }] },
    actions: [
      { type: "assign_contact", member_id: "" },
      { type: "create_task", title: "Call {{title}}", due_in_minutes: 120, priority: "high" },
    ],
  },
  vendorVerify: {
    triggerEvent: "vendor_work.submitted",
    conditions: { all: [] },
    actions: [{ type: "request_verification", title: "" }],
  },
  decision: {
    triggerEvent: "customer_decision.recorded",
    conditions: { all: [] },
    actions: [{ type: "notify_member", role: "manager", body: "{{project}}: {{title}}", href: "/projects" }],
  },
};
