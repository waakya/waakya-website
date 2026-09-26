import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/types";
import { emailProvider, whatsappProvider } from "@/lib/messaging";
import { parseStoredRule, render, shouldFire, type Action, type EventLike } from "./engine";

/**
 * The engine's loop, run with the service role: unprocessed events → rules
 * that fire → one run per (rule, event) → actions, one transaction each,
 * through automation_apply → the run's log. Nothing here is silent: every
 * skip, success and failure is a row, and a failure tells the owners once.
 */
export interface AutomationSummary {
  events: number;
  runs: number;
  succeeded: number;
  failed: number;
  skipped: number;
  errors: string[];
}

const MAX_ATTEMPTS = 3;

export async function processAutomation(
  client: SupabaseClient<Database>,
  options: { orgId?: string; limit?: number } = {},
): Promise<AutomationSummary> {
  const summary: AutomationSummary = { events: 0, runs: 0, succeeded: 0, failed: 0, skipped: 0, errors: [] };
  const limit = options.limit ?? 200;

  let eventQuery = client
    .from("domain_events")
    .select("id, org_id, event_type, entity_type, entity_id, actor_kind, payload, depth, processing_attempts")
    .is("processed_at", null)
    .lt("processing_attempts", MAX_ATTEMPTS)
    .order("occurred_at", { ascending: true })
    .limit(limit);
  if (options.orgId) eventQuery = eventQuery.eq("org_id", options.orgId);
  const { data: events, error } = await eventQuery;
  if (error) {
    summary.errors.push(`events: ${error.message}`);
    return summary;
  }
  if (!events?.length) return summary;

  const orgIds = [...new Set(events.map((e) => e.org_id))];
  const [{ data: rules }, { data: moduleRows }] = await Promise.all([
    client.from("automation_rules").select("id, org_id, name, trigger_event, conditions, actions, enabled").in("org_id", orgIds).eq("enabled", true),
    client.from("organization_modules").select("org_id, module_key, enabled").in("org_id", orgIds).eq("module_key", "automation"),
  ]);
  const automationOn = new Set((moduleRows ?? []).filter((m) => m.enabled).map((m) => m.org_id));

  for (const event of events) {
    summary.events += 1;
    const eventLike: EventLike = {
      type: event.event_type,
      actorKind: event.actor_kind,
      depth: event.depth,
      payload: (event.payload ?? {}) as Record<string, unknown>,
    };
    const candidates = automationOn.has(event.org_id) ? (rules ?? []).filter((r) => r.org_id === event.org_id && r.trigger_event === event.event_type) : [];
    let allDone = true;
    for (const row of candidates) {
      const rule = parseStoredRule(row);
      const decision = shouldFire(rule, eventLike);
      if (!decision.fire) continue;
      const { data: run, error: runError } = await client
        .from("automation_runs")
        .insert({ org_id: event.org_id, rule_id: row.id, event_id: event.id, status: "running", attempts: 1, started_at: new Date().toISOString() })
        .select("id")
        .single();
      if (runError) {
        // 23505: this (rule, event) already ran — a retry after a crash. Never repeat it.
        if (runError.code !== "23505") {
          allDone = false;
          summary.errors.push(`run: ${runError.message}`);
        }
        continue;
      }
      summary.runs += 1;
      const outcome = await executeRun(client, { id: run.id, orgId: event.org_id, ruleName: row.name, actions: rule.actions, depth: event.depth + 1 }, eventLike, event);
      if (outcome.ok) summary.succeeded += 1;
      else summary.failed += 1;
      await client
        .from("automation_rules")
        .update({ run_count: (await countRuns(client, row.id)).total, fail_count: (await countRuns(client, row.id)).failed, last_run_at: new Date().toISOString() })
        .eq("id", row.id);
    }
    if (allDone) {
      await client.from("domain_events").update({ processed_at: new Date().toISOString() }).eq("id", event.id);
    } else {
      await client.from("domain_events").update({ processing_attempts: event.processing_attempts + 1, last_error: summary.errors.at(-1) ?? null }).eq("id", event.id);
    }
  }

  // Failed runs get another go, up to the cap; the business action inside
  // automation_apply is idempotent per (rule, event) so nothing doubles.
  const { data: retries } = await client
    .from("automation_runs")
    .select("id, org_id, rule_id, event_id, attempts, automation_rules(name, actions, enabled), domain_events(event_type, actor_kind, depth, payload, entity_type, entity_id)")
    .eq("status", "failed")
    .lt("attempts", MAX_ATTEMPTS)
    .limit(50);
  for (const r of retries ?? []) {
    const rule = r.automation_rules as { name: string; actions: unknown; enabled: boolean } | null;
    const ev = r.domain_events as { event_type: string; actor_kind: string; depth: number; payload: unknown; entity_type: string; entity_id: string | null } | null;
    if (!rule || !ev || !rule.enabled) continue;
    const parsed = parseStoredRule({ trigger_event: ev.event_type, conditions: { all: [] }, actions: rule.actions, enabled: true });
    await client.from("automation_runs").update({ status: "running", attempts: r.attempts + 1, started_at: new Date().toISOString() }).eq("id", r.id);
    const outcome = await executeRun(
      client,
      { id: r.id, orgId: r.org_id, ruleName: rule.name, actions: parsed.actions, depth: ev.depth + 1 },
      { type: ev.event_type, actorKind: ev.actor_kind, depth: ev.depth, payload: (ev.payload ?? {}) as Record<string, unknown> },
      { id: r.event_id, entity_type: ev.entity_type, entity_id: ev.entity_id, payload: ev.payload, org_id: r.org_id },
    );
    if (outcome.ok) summary.succeeded += 1;
    else summary.failed += 1;
  }
  return summary;
}

async function countRuns(client: SupabaseClient<Database>, ruleId: string): Promise<{ total: number; failed: number }> {
  const [{ count: total }, { count: failed }] = await Promise.all([
    client.from("automation_runs").select("id", { count: "exact", head: true }).eq("rule_id", ruleId),
    client.from("automation_runs").select("id", { count: "exact", head: true }).eq("rule_id", ruleId).eq("status", "failed"),
  ]);
  return { total: total ?? 0, failed: failed ?? 0 };
}

async function executeRun(
  client: SupabaseClient<Database>,
  run: { id: string; orgId: string; ruleName: string; actions: Action[]; depth: number },
  event: EventLike,
  raw: { id: string; entity_type: string; entity_id: string | null; payload: unknown; org_id: string },
): Promise<{ ok: boolean }> {
  const log: Json[] = [];
  let failure: string | null = null;
  for (const [index, action] of run.actions.entries()) {
    try {
      const { data, error } = await client.rpc("automation_apply", {
        p_org: run.orgId,
        p_run: run.id,
        p_depth: run.depth,
        p_action: action as unknown as Json,
        p_event: { id: raw.id, entity_type: raw.entity_type, entity_id: raw.entity_id, payload: raw.payload as Json, type: event.type } as unknown as Json,
      });
      if (error) throw new Error(error.message);
      let result: Json = (data as Json) ?? {};
      if (action.type === "send_email" || action.type === "send_whatsapp_template") {
        result = await deliver(client, run, action, event, raw);
      }
      log.push({ index, type: action.type, result });
    } catch (error) {
      failure = error instanceof Error ? error.message : String(error);
      log.push({ index, type: action.type, error: failure });
      break;
    }
  }
  await client
    .from("automation_runs")
    .update({ status: failure ? "failed" : "succeeded", error: failure, log, finished_at: new Date().toISOString() })
    .eq("id", run.id);
  if (failure) await client.rpc("notify_automation_failure", { p_run: run.id });
  return { ok: !failure };
}

/** The two actions the database defers to the application: messages to people outside it. */
async function deliver(
  client: SupabaseClient<Database>,
  run: { id: string; orgId: string },
  action: Extract<Action, { type: "send_email" | "send_whatsapp_template" }>,
  event: EventLike,
  raw: { entity_type: string; entity_id: string | null; payload: unknown },
): Promise<Json> {
  const payload = (raw.payload ?? {}) as Record<string, unknown>;
  const contactId = (typeof payload.contact_id === "string" ? payload.contact_id : null) ?? (raw.entity_type === "contact" ? raw.entity_id : null);
  const { data: contact } = contactId
    ? await client.from("crm_contacts").select("id, full_name, email, phone_e164, email_opt_out, whatsapp_opt_out").eq("id", contactId).eq("org_id", run.orgId).maybeSingle()
    : { data: null };

  if (action.type === "send_email") {
    let to: string | null = null;
    if (action.to === "member" && action.member_id) {
      const { data } = await client.rpc("org_member_email", { p_user: action.member_id });
      to = data ?? null;
    } else if (contact && !contact.email_opt_out) {
      to = contact.email;
    }
    if (!to) return { skipped: contact?.email_opt_out ? "opted_out" : "no_address" };
    const outcome = await emailProvider().send({
      to,
      subject: render(action.subject, event),
      text: render(action.body, event),
      idempotencyKey: `auto:${run.id}:email`,
    });
    if (!outcome.ok) throw new Error(`email ${outcome.error}`);
    await recordActivity(client, run.orgId, contact?.id ?? null, "email", render(action.subject, event));
    return { sent: to, provider: outcome.provider, mocked: outcome.mocked ?? false };
  }

  if (!contact?.phone_e164) return { skipped: "no_phone" };
  if (contact.whatsapp_opt_out) return { skipped: "opted_out" };
  const { data: template } = await client.from("message_templates").select("id, name, provider_template_name, provider_language, body, status").eq("id", action.template_id).eq("org_id", run.orgId).maybeSingle();
  if (!template || template.status !== "approved") throw new Error("template not approved");
  const outcome = await whatsappProvider().send({
    to: contact.phone_e164.replace("+", ""),
    templateName: template.provider_template_name ?? template.name,
    language: template.provider_language ?? "en",
    parameters: [contact.full_name],
    idempotencyKey: `auto:${run.id}:wa`,
  });
  if (!outcome.ok) throw new Error(`whatsapp ${outcome.error}`);
  await recordActivity(client, run.orgId, contact.id, "whatsapp", render(template.body, event));
  return { sent: contact.phone_e164, provider: outcome.provider, mocked: outcome.mocked ?? false };
}

async function recordActivity(client: SupabaseClient<Database>, orgId: string, contactId: string | null, kind: "email" | "whatsapp", body: string) {
  if (!contactId) return;
  await client.from("crm_activities").insert({ org_id: orgId, contact_id: contactId, kind, body: body.slice(0, 4000), actor_kind: "automation" });
}
