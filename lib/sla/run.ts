import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { notifyWith, writeMessage, writeSubject, type NotifyEvent } from "@/lib/notify";
import { getDictionary, toLocale } from "@/lib/i18n";
import { formatDuration } from "@/lib/tasks/sla";
import { planSlaActions, type SlaAction, type SlaOrg, type SlaTask } from "./engine";
import { generateChecklistTasks } from "@/lib/checklists/run";

export interface SlaRunSummary {
  orgs: number;
  tasksScanned: number;
  /** Newly delivered this tick. */
  remindersSent: number;
  escalationsRaised: number;
  /**
   * Owed and already delivered by an earlier tick. Counted separately on
   * purpose: a summary that reported these as sends would make a job that
   * did nothing look busy, and this number is how you see idempotency working.
   */
  alreadySent: number;
  /** Escalations recorded but whose message is held back by quiet hours. */
  escalationsHeld: number;
  /** Daily routine tasks brought into being by this tick. */
  checklistTasksCreated: number;
  errors: string[];
}

const OPEN_STATES = [
  "created",
  "delivered",
  "acknowledged",
  "accepted",
  "in_progress",
  "escalated",
] as const;

/**
 * One tick of the SLA job.
 *
 * Idempotent throughout: the escalation row has a unique key on
 * (task_id, reason), and every notification carries a dedupe key that never
 * changes, so running this twice — or retrying a half-finished run — sends
 * nothing twice.
 */
export async function runSlaTick(
  client: SupabaseClient<Database>,
  now: Date = new Date(),
  onlyOrgId?: string,
): Promise<SlaRunSummary> {
  const summary: SlaRunSummary = {
    orgs: 0,
    tasksScanned: 0,
    remindersSent: 0,
    escalationsRaised: 0,
    alreadySent: 0,
    escalationsHeld: 0,
    checklistTasksCreated: 0,
    errors: [],
  };

  let orgQuery = client
    .from("orgs")
    .select("id, name, language, ack_minutes, quiet_start, quiet_end, created_by");
  if (onlyOrgId) orgQuery = orgQuery.eq("id", onlyOrgId);

  const { data: orgs, error: orgError } = await orgQuery;
  if (orgError) {
    summary.errors.push(`orgs: ${orgError.message}`);
    return summary;
  }

  /*
   * Businesses are independent, so they are ticked a few at a time rather
   * than one after another. Each org costs several round trips to a database
   * on another continent; in series that ran past the scheduler's timeout as
   * soon as there were a handful of orgs, although the work still completed.
   */
  await inBatches(orgs ?? [], ORG_CONCURRENCY, async (row) => {
    const org: SlaOrg = {
      id: row.id,
      name: row.name,
      ackMinutes: row.ack_minutes,
      quietStart: row.quiet_start,
      quietEnd: row.quiet_end,
    };
    const locale = toLocale(row.language);
    summary.orgs += 1;

    // Today's routines first, so a checklist task created this minute is
    // scanned by the same tick that made it.
    const routines = await generateChecklistTasks(client, org.id, row.created_by, now);
    summary.checklistTasksCreated += routines.created;
    summary.errors.push(...routines.errors);

    const { data: taskRows, error: taskError } = await client
      .from("tasks")
      .select(
        "id, org_id, title, state, assigned_to, created_by, delivered_at, due_at, acknowledged_at, done_at, ack_minutes",
      )
      .eq("org_id", org.id)
      .in("state", OPEN_STATES);

    if (taskError) {
      summary.errors.push(`tasks(${org.id}): ${taskError.message}`);
      return;
    }
    if (!taskRows?.length) return;
    summary.tasksScanned += taskRows.length;

    // Which escalations are already on record, so the plan does not re-raise
    // them and the row count stays honest.
    const { data: existing } = await client
      .from("escalations")
      .select("task_id, reason, triggered_at")
      .in(
        "task_id",
        taskRows.map((t) => t.id),
      );
    const byTask = new Map<string, SlaTask["escalated"][number][]>();
    for (const e of existing ?? []) {
      if (e.reason !== "ack_sla" && e.reason !== "completion_sla") continue;
      const list = byTask.get(e.task_id) ?? [];
      list.push({ reason: e.reason, at: e.triggered_at });
      byTask.set(e.task_id, list);
    }

    const tasks: SlaTask[] = taskRows.map((t) => ({
      id: t.id,
      orgId: t.org_id,
      title: t.title,
      state: t.state,
      assignedTo: t.assigned_to,
      createdBy: t.created_by,
      deliveredAt: t.delivered_at,
      dueAt: t.due_at,
      acknowledgedAt: t.acknowledged_at,
      doneAt: t.done_at,
      ackMinutes: t.ack_minutes ?? org.ackMinutes,
      escalated: byTask.get(t.id) ?? [],
    }));

    const titles = new Map(tasks.map((t) => [t.id, t.title]));
    const dueAt = new Map(tasks.map((t) => [t.id, t.dueAt]));
    const plan = planSlaActions(tasks, org, now);

    // An escalation tells the owner *who* has not seen or finished the work,
    // so it needs the assignee's name, not the business's. One lookup per org.
    const assigneeIds = [...new Set(tasks.map((t) => t.assignedTo).filter((id): id is string => !!id))];
    const { data: profiles } = assigneeIds.length
      ? await client.from("profiles").select("id, full_name").in("id", assigneeIds)
      : { data: [] as { id: string; full_name: string | null }[] };
    const nameOf = new Map((profiles ?? []).map((p) => [p.id, p.full_name?.trim() || null]));
    const assigneeNameFor = (taskId: string): string | null => {
      const assignedTo = tasks.find((t) => t.id === taskId)?.assignedTo;
      return assignedTo ? (nameOf.get(assignedTo) ?? null) : null;
    };

    // One address lookup per person per tick, not one per message: a busy
    // morning can owe a dozen messages to the same phone.
    const emails = new Map<string, string | null>();
    const emailFor = async (userId: string): Promise<string | null> => {
      if (emails.has(userId)) return emails.get(userId) ?? null;
      const { data } = await client.rpc("org_member_email", { p_user: userId });
      emails.set(userId, data ?? null);
      return data ?? null;
    };

    /*
     * Ask once which of these messages already went out, rather than finding
     * out one failed insert at a time. Without this, every escalation inside
     * its retry window costs a round trip on every tick, and a business with a
     * bad week makes the job slower for everyone.
     *
     * Under the service role this sees every row. Under an owner's own session
     * RLS hides messages addressed to their staff, so a few reminders are
     * re-attempted and refused by the unique index — correct either way, just
     * less quick on the manual path.
     */
    const keys = plan.send.map((action) => action.dedupeKey);
    const alreadySent = new Set<string>();
    for (let i = 0; i < keys.length; i += 200) {
      const { data: sent } = await client
        .from("notifications")
        .select("dedupe_key")
        .in("dedupe_key", keys.slice(i, i + 200));
      for (const row of sent ?? []) {
        if (row.dedupe_key) alreadySent.add(row.dedupe_key);
      }
    }

    // Escalation rows are written whether or not the message goes out: the
    // record has to be true even at 11pm.
    for (const action of [...plan.send, ...plan.recordOnly]) {
      if (action.kind !== "escalation") continue;
      // The planner already knows this row exists; an insert here would only
      // be a round trip that conflicts.
      if (action.alreadyRecorded) continue;
      const { error } = await client.from("escalations").insert({
        task_id: action.taskId,
        org_id: action.orgId,
        reason: action.reason,
        notified_user: action.userId,
        triggered_at: now.toISOString(),
      });
      // 23505 is the unique index: already raised, which is the point.
      if (error && error.code !== "23505") {
        summary.errors.push(`escalation(${action.taskId}): ${error.code}`);
      }
    }
    summary.escalationsHeld += plan.recordOnly.length;

    for (const action of plan.send) {
      if (alreadySent.has(action.dedupeKey)) {
        summary.alreadySent += 1;
        continue;
      }

      const outcome = await deliver(client, action, {
        locale,
        orgName: org.name,
        assigneeName: assigneeNameFor(action.taskId),
        title: titles.get(action.taskId) ?? "",
        dueAt: dueAt.get(action.taskId) ?? null,
        now,
        email: await emailFor(action.userId),
      });

      if (outcome === "failed") {
        summary.errors.push(`notify(${action.taskId})`);
      } else if (outcome === "duplicate") {
        summary.alreadySent += 1;
      } else if (action.kind === "reminder") {
        summary.remindersSent += 1;
      } else {
        summary.escalationsRaised += 1;
      }
    }
    });

  return summary;
}

const EVENT_FOR: Record<string, NotifyEvent> = {
  "reminder:ack": "ack_reminder",
  "reminder:completion": "completion_reminder",
  "escalation:ack_sla": "not_seen",
  "escalation:completion_sla": "overdue",
};

type DeliverOutcome = "sent" | "duplicate" | "failed";

async function deliver(
  client: SupabaseClient<Database>,
  action: SlaAction,
  context: {
    locale: ReturnType<typeof toLocale>;
    orgName: string;
    /** The person doing the work; named in escalations to the owner. */
    assigneeName: string | null;
    title: string;
    dueAt: string | null;
    now: Date;
    email: string | null;
  },
): Promise<DeliverOutcome> {
  const t = getDictionary(context.locale);
  const key =
    action.kind === "reminder"
      ? `reminder:${action.clock}`
      : `escalation:${action.reason}`;
  const event = EVENT_FOR[key];
  if (!event) return "failed";

  const remaining =
    context.dueAt !== null
      ? formatDuration(Date.parse(context.dueAt) - context.now.getTime(), t.time)
      : undefined;

  const body = writeMessage(event, context.locale, {
    // A reminder goes to staff: the product never speaks as "Waakya" to them,
    // so the business is the sender. An escalation goes to the owner and is
    // about a person: "Bittu has not seen …", never "Patel Hardware has not".
    actor:
      action.kind === "escalation"
        ? (context.assigneeName ?? context.orgName)
        : context.orgName,
    task: context.title,
    when: remaining,
  });

  const result = await notifyWith(client, {
    orgId: action.orgId,
    userId: action.userId,
    event,
    taskId: action.taskId,
    locale: context.locale,
    body,
    subject: writeSubject(context.orgName, body),
    email: context.email,
    url: `${siteUrl()}/kaam/${action.taskId}`,
    dedupeKey: action.dedupeKey,
  });

  if (!result.delivered) return "failed";
  // The inbox row is the record, so it is the channel that decides whether
  // this was a real send or a repeat of one.
  const inApp = result.outcomes.in_app;
  return inApp?.ok && inApp.skipped === "duplicate" ? "duplicate" : "sent";
}

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}

/** How many orgs are ticked at once. Small: the database is shared. */
const ORG_CONCURRENCY = 5;

async function inBatches<T>(
  items: readonly T[],
  size: number,
  each: (item: T) => Promise<void>,
): Promise<void> {
  for (let i = 0; i < items.length; i += size) {
    await Promise.all(items.slice(i, i + size).map(each));
  }
}
