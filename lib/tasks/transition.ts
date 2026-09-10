import "server-only";

import type { TablesUpdate, TaskState } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth/session";
import { notifyWith, writeMessage, writeSubject, type NotifyEvent } from "@/lib/notify";
import { getDictionary, type Locale } from "@/lib/i18n";
import { fail, ok, type ActionResult } from "@/lib/validation";
import { transition } from "./state-machine";
import { canActorTransition, manages } from "./authz";
import { formatTime } from "./time";

type TaskUpdate = TablesUpdate<"tasks">;
type TimestampColumn = Extract<
  keyof TaskUpdate,
  | "delivered_at"
  | "acknowledged_at"
  | "accepted_at"
  | "started_at"
  | "done_at"
  | "verified_at"
  | "cancelled_at"
>;

/** The column that records when each state was reached. */
const TIMESTAMP_COLUMN: Partial<Record<TaskState, TimestampColumn>> = {
  delivered: "delivered_at",
  acknowledged: "acknowledged_at",
  accepted: "accepted_at",
  in_progress: "started_at",
  done: "done_at",
  verified: "verified_at",
  cancelled: "cancelled_at",
};

/** Who hears about a transition, and what it is called in their inbox. */
const NOTIFY_AS: Partial<Record<TaskState, { event: NotifyEvent; to: "owner" | "assignee" }>> = {
  acknowledged: { event: "task_seen", to: "owner" },
  done: { event: "task_done", to: "owner" },
  verified: { event: "task_verified", to: "assignee" },
  escalated: { event: "escalated", to: "owner" },
  cancelled: { event: "cancelled", to: "assignee" },
  in_progress: { event: "sent_back", to: "assignee" },
};

export interface MoveTaskInput {
  taskId: string;
  to: TaskState;
  /** A reason, for the timeline — "nahi ho payega, gaadi kharab hai". */
  note?: string;
}

/**
 * Move a task, once.
 *
 * Three things have to hold, and each is checked in its own place: the
 * transition must be legal for the task (the state machine), it must be this
 * person's to make (the authz rules), and the row must still be in the state
 * the caller thought it was (`.eq("state", from)`, so two taps or two devices
 * cannot apply the same move twice).
 */
export async function moveTask(
  input: MoveTaskInput,
  now: Date = new Date(),
): Promise<ActionResult<{ state: TaskState }>> {
  const viewer = await requireOrg();
  const locale = viewer.org.language;
  const supabase = await createClient();

  const { data: task } = await supabase
    .from("tasks")
    .select("id, org_id, title, state, assigned_to, created_by, due_at")
    .eq("id", input.taskId)
    .maybeSingle();

  if (!task) return fail(errors(locale).notFound);

  const actor = {
    role: viewer.role,
    isAssignee: task.assigned_to === viewer.userId,
  };

  if (!canActorTransition(actor, task.state, input.to)) {
    return fail(errors(locale).notAllowed);
  }

  const result = transition(task.state, input.to);
  if (!result.ok) return fail(errors(locale).notAllowed);

  const patch: TaskUpdate = { state: result.state };
  const column = TIMESTAMP_COLUMN[input.to];
  if (column) patch[column] = now.toISOString();
  // A reassignment restarts both clocks for the new person.
  if (input.to === "reassigned") patch.delivered_at = now.toISOString();

  const { data: updated, error } = await supabase
    .from("tasks")
    .update(patch)
    .eq("id", task.id)
    // Optimistic concurrency: if somebody already moved it, this matches
    // nothing and we say so rather than writing over their change.
    .eq("state", task.state)
    .select("id")
    .maybeSingle();

  if (error) return fail(errors(locale).generic);
  if (!updated) return fail(errors(locale).alreadyMoved);

  await supabase.from("task_events").insert({
    task_id: task.id,
    org_id: task.org_id,
    from_state: task.state,
    to_state: result.recorded,
    actor_id: viewer.userId,
    note: input.note?.trim() || null,
  });

  await announce({
    supabase,
    viewer,
    task,
    to: input.to,
    locale,
    now,
  });

  return ok({ state: result.state });
}

async function announce({
  supabase,
  viewer,
  task,
  to,
  locale,
  now,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  viewer: Awaited<ReturnType<typeof requireOrg>>;
  task: {
    id: string;
    org_id: string;
    title: string;
    assigned_to: string | null;
    created_by: string;
    due_at: string | null;
  };
  to: TaskState;
  locale: Locale;
  now: Date;
}): Promise<void> {
  const plan = NOTIFY_AS[to];
  if (!plan) return;

  const recipient =
    plan.to === "owner" ? task.created_by : (task.assigned_to ?? task.created_by);
  // Nobody needs telling about their own tap.
  if (!recipient || recipient === viewer.userId) return;

  const t = getDictionary(locale);
  const actorName = viewer.fullName?.trim() || t.org.roles.member;
  const body = writeMessage(plan.event, locale, {
    actor: actorName,
    task: task.title,
    when: task.due_at ? formatTime(task.due_at) : undefined,
  });

  const { data: email } = await supabase.rpc("org_member_email", {
    p_user: recipient,
  });

  await notifyWith(supabase, {
    orgId: task.org_id,
    userId: recipient,
    event: plan.event,
    taskId: task.id,
    locale,
    body,
    subject: writeSubject(viewer.org.name, body),
    email,
    url: `${siteUrl()}/kaam/${task.id}`,
    // One notification per task per state, however many times a retry runs.
    dedupeKey: `${task.id}:${to}:${now.toISOString().slice(0, 16)}`,
  });
}

/** Give the work to somebody else and restart both clocks. */
export async function reassignTask(
  taskId: string,
  toUserId: string,
  now: Date = new Date(),
): Promise<ActionResult<{ state: TaskState }>> {
  const viewer = await requireOrg();
  const locale = viewer.org.language;
  if (!manages(viewer.role)) return fail(errors(locale).notAllowed);

  const supabase = await createClient();
  const { data: member } = await supabase
    .from("memberships")
    .select("user_id")
    .eq("org_id", viewer.org.id)
    .eq("user_id", toUserId)
    .maybeSingle();
  if (!member) return fail(errors(locale).noSuchPerson);

  const moved = await moveTask({ taskId, to: "reassigned" }, now);
  if (!moved.ok) return moved;

  const { error } = await supabase
    .from("tasks")
    .update({
      assigned_to: toUserId,
      // The new person has not seen it, so nothing about the old person's
      // progress carries over.
      acknowledged_at: null,
      accepted_at: null,
      started_at: null,
    })
    .eq("id", taskId);
  if (error) return fail(errors(locale).generic);

  const { data: task } = await supabase
    .from("tasks")
    .select("id, org_id, title, due_at")
    .eq("id", taskId)
    .maybeSingle();

  if (task) {
    const body = writeMessage("reassigned", locale, {
      actor: viewer.fullName?.trim() || getDictionary(locale).org.roles.owner,
      task: task.title,
      when: task.due_at ? formatTime(task.due_at) : undefined,
    });
    const { data: email } = await supabase.rpc("org_member_email", {
      p_user: toUserId,
    });
    await notifyWith(supabase, {
      orgId: task.org_id,
      userId: toUserId,
      event: "reassigned",
      taskId: task.id,
      locale,
      body,
      subject: writeSubject(viewer.org.name, body),
      email,
      url: `${siteUrl()}/kaam/${task.id}`,
      dedupeKey: `${task.id}:reassigned:${now.toISOString().slice(0, 16)}`,
    });
  }

  return moved;
}

/** Move the deadline. The completion clock is redrawn from the new one. */
export async function changeDeadline(
  taskId: string,
  dueAt: Date,
  now: Date = new Date(),
): Promise<ActionResult> {
  const viewer = await requireOrg();
  const locale = viewer.org.language;
  if (!manages(viewer.role)) return fail(errors(locale).notAllowed);
  if (dueAt.getTime() <= now.getTime()) return fail(errors(locale).deadlinePast);

  const supabase = await createClient();
  const { data: task } = await supabase
    .from("tasks")
    .select("id, org_id, state")
    .eq("id", taskId)
    .maybeSingle();
  if (!task) return fail(errors(locale).notFound);

  const { error } = await supabase
    .from("tasks")
    .update({ due_at: dueAt.toISOString() })
    .eq("id", taskId);
  if (error) return fail(errors(locale).generic);

  // Not a state change, but it belongs in the record: the clock moved.
  await supabase.from("task_events").insert({
    task_id: task.id,
    org_id: task.org_id,
    from_state: task.state,
    to_state: task.state,
    actor_id: viewer.userId,
    note: `due_at=${dueAt.toISOString()}`,
  });

  return ok();
}

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}

function errors(locale: Locale) {
  const table = {
    hi: {
      notFound: "यह काम नहीं मिला।",
      notAllowed: "यह आप नहीं कर सकते।",
      alreadyMoved: "यह काम अभी-अभी बदला है। स्क्रीन फिर से खोलिए।",
      noSuchPerson: "यह व्यक्ति आपकी टीम में नहीं है।",
      deadlinePast: "समय अभी से आगे का चुनिए।",
      generic: "नहीं हो पाया। फिर से कोशिश करें।",
    },
    "hi-Latn": {
      notFound: "Yeh kaam nahi mila.",
      notAllowed: "Yeh aap nahi kar sakte.",
      alreadyMoved: "Yeh kaam abhi-abhi badla hai. Screen phir se kholiye.",
      noSuchPerson: "Yeh vyakti aapki team mein nahi hai.",
      deadlinePast: "Samay abhi se aage ka chuniye.",
      generic: "Nahi ho paya. Phir se koshish karein.",
    },
    en: {
      notFound: "That task was not found.",
      notAllowed: "You cannot do that.",
      alreadyMoved: "This task just changed. Open the screen again.",
      noSuchPerson: "That person is not in your team.",
      deadlinePast: "Choose a time in the future.",
      generic: "That did not go through. Try again.",
    },
  } as const;
  return table[locale];
}
