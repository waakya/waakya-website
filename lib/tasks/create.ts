import "server-only";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth/session";
import { getOrgMembers } from "@/lib/org/members";
import { notifyWith, writeMessage, writeSubject } from "@/lib/notify";
import { getDictionary, toLocale } from "@/lib/i18n";
import { fail, ok, type ActionResult } from "@/lib/validation";
import { resolvePreset, DEADLINE_PRESETS } from "./deadlines";
import { formatTime } from "./time";

/**
 * The one way a task is created.
 *
 * v1 fills this from the Confirm card by touch. When voice lands, the
 * transcript becomes a `NewTask` and calls the same function — nothing after
 * the Confirm card knows or cares which way the words arrived (CLAUDE.md §1).
 * That is the whole reason this is a plain function over a plain object rather
 * than something wired into a form.
 */
export const newTaskSchema = z
  .object({
    /** Who it is for. Must be a member of the caller's org. */
    assigneeId: z.string().uuid(),
    title: z.string().trim().min(2).max(140),
    details: z.string().trim().max(1000).optional().or(z.literal("")),
    priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
    proofRequired: z.boolean().default(false),
    /** The time budget: either one of the three chips, or an explicit instant. */
    deadline: z.union([
      z.object({ kind: z.literal("preset"), preset: z.enum(DEADLINE_PRESETS as unknown as [string, ...string[]]) }),
      z.object({ kind: z.literal("at"), at: z.string().datetime() }),
    ]),
    /** Overrides the org's acknowledge SLA for this one task. */
    ackMinutes: z.number().int().min(1).max(24 * 60).optional(),
  })
  .strict();

export type NewTask = z.input<typeof newTaskSchema>;

export async function createTask(
  input: unknown,
  now: Date = new Date(),
): Promise<ActionResult<{ taskId: string }>> {
  const viewer = await requireOrg();
  const locale = viewer.org.language;
  const t = getDictionary(locale);

  const parsed = newTaskSchema.safeParse(input);
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? "");
    return fail(errors(locale)[field === "title" ? "badTitle" : "badInput"], field);
  }
  const task = parsed.data;

  // The assignee must be somebody in this org. RLS would stop a cross-org
  // write anyway, but a foreign uuid should read as "pick a person", not as a
  // database error.
  const members = await getOrgMembers(viewer.org.id);
  const assignee = members.find((m) => m.userId === task.assigneeId);
  if (!assignee) return fail(errors(locale).noSuchAssignee, "assigneeId");

  const dueAt =
    task.deadline.kind === "preset"
      ? resolvePreset(task.deadline.preset as never, now)
      : new Date(task.deadline.at);

  if (dueAt.getTime() <= now.getTime()) {
    return fail(errors(locale).deadlinePast, "deadline");
  }

  const supabase = await createClient();

  // Created and delivered in one write: in a message-based product there is no
  // gap between the two, and the audit trail records both.
  const { data: row, error } = await supabase
    .from("tasks")
    .insert({
      org_id: viewer.org.id,
      title: task.title,
      details: task.details || null,
      created_by: viewer.userId,
      assigned_to: task.assigneeId,
      state: "delivered",
      priority: task.priority,
      proof_required: task.proofRequired,
      ack_minutes: task.ackMinutes ?? null,
      due_at: dueAt.toISOString(),
      delivered_at: now.toISOString(),
    })
    .select("id")
    .single();

  if (error || !row) return fail(errors(locale).generic);

  const { error: eventError } = await supabase.from("task_events").insert([
    {
      task_id: row.id,
      org_id: viewer.org.id,
      from_state: null,
      to_state: "created",
      actor_id: viewer.userId,
    },
    {
      task_id: row.id,
      org_id: viewer.org.id,
      from_state: "created",
      to_state: "delivered",
      actor_id: viewer.userId,
    },
  ]);
  if (eventError) return fail(errors(locale).generic);

  // The owner is the sender, so the message carries their name, not Vaakya's.
  const assigneeLocale = toLocale(locale);
  const body = writeMessage("task_assigned", assigneeLocale, {
    actor: viewer.fullName?.trim() || t.org.roles.owner,
    task: task.title,
    when: formatTime(dueAt),
  });

  const { data: email } = await supabase.rpc("org_member_email", {
    p_user: task.assigneeId,
  });

  await notifyWith(supabase, {
    orgId: viewer.org.id,
    userId: task.assigneeId,
    event: "task_assigned",
    taskId: row.id,
    locale: assigneeLocale,
    body,
    subject: writeSubject(viewer.org.name, body),
    email,
    url: `${siteUrl()}/kaam/${row.id}`,
    dedupeKey: `${row.id}:task_assigned`,
  });

  return ok({ taskId: row.id });
}

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}

function errors(locale: ReturnType<typeof toLocale>) {
  const table = {
    hi: {
      badTitle: "काम क्या है, वह लिखिए।",
      badInput: "कुछ छूट गया। फिर से देखिए।",
      noSuchAssignee: "किसको भेजना है, वह चुनिए।",
      deadlinePast: "समय अभी से आगे का चुनिए।",
      generic: "नहीं भेजा गया। फिर से कोशिश करें।",
    },
    "hi-Latn": {
      badTitle: "Kaam kya hai, woh likhiye.",
      badInput: "Kuch chhut gaya. Phir se dekhiye.",
      noSuchAssignee: "Kisko bhejna hai, woh chuniye.",
      deadlinePast: "Samay abhi se aage ka chuniye.",
      generic: "Nahi bheja gaya. Phir se koshish karein.",
    },
    en: {
      badTitle: "Write what the work is.",
      badInput: "Something is missing. Please check again.",
      noSuchAssignee: "Choose who this is for.",
      deadlinePast: "Choose a time in the future.",
      generic: "That did not send. Try again.",
    },
  } as const;
  return table[locale];
}
