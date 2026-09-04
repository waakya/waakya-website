"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  moveTask,
  reassignTask,
  changeDeadline,
} from "@/lib/tasks/transition";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth/session";
import { notifyWith, writeMessage, writeSubject } from "@/lib/notify";
import { getDictionary } from "@/lib/i18n";
import { fail, ok, uuidSchema, type ActionResult } from "@/lib/validation";
import type { TaskState } from "@/lib/supabase/types";

const moveSchema = z.object({
  taskId: uuidSchema,
  to: z.enum([
    "acknowledged",
    "accepted",
    "in_progress",
    "done",
    "verified",
    "escalated",
    "cancelled",
  ]),
  note: z.string().trim().max(500).optional(),
});

/** Every button on a task detail screen comes through here. */
export async function moveTaskAction(
  input: unknown,
): Promise<ActionResult<{ state: TaskState }>> {
  const parsed = moveSchema.safeParse(input);
  if (!parsed.success) {
    const viewer = await requireOrg();
    return fail(getDictionary(viewer.org.language).common.somethingWentWrong);
  }

  const result = await moveTask(parsed.data);
  if (result.ok) refresh(parsed.data.taskId);
  return result;
}

/**
 * "Dekh liya, ho jayega" is one tap and two facts: seen, and committed to.
 * screens/TaskOwner.png shows Dekha and Maana at the same timestamp, which is
 * exactly this — so the audit trail records both, and the staff member presses
 * one button.
 */
export async function acknowledgeAndAcceptAction(
  input: unknown,
): Promise<ActionResult<{ state: TaskState }>> {
  const parsed = uuidSchema.safeParse(input);
  if (!parsed.success) {
    const viewer = await requireOrg();
    return fail(getDictionary(viewer.org.language).common.somethingWentWrong);
  }

  const seen = await moveTask({ taskId: parsed.data, to: "acknowledged" });
  if (!seen.ok) return seen;

  const committed = await moveTask({ taskId: parsed.data, to: "accepted" });
  refresh(parsed.data);
  // Acknowledging succeeded even if committing did not; the first fact stands.
  return committed.ok ? committed : seen;
}

const reassignSchema = z.object({ taskId: uuidSchema, toUserId: uuidSchema });

export async function reassignTaskAction(
  input: unknown,
): Promise<ActionResult<{ state: TaskState }>> {
  const parsed = reassignSchema.safeParse(input);
  if (!parsed.success) {
    const viewer = await requireOrg();
    return fail(getDictionary(viewer.org.language).common.somethingWentWrong);
  }
  const result = await reassignTask(parsed.data.taskId, parsed.data.toUserId);
  if (result.ok) refresh(parsed.data.taskId);
  return result;
}

const deadlineSchema = z.object({
  taskId: uuidSchema,
  dueAt: z.string().datetime(),
});

export async function changeDeadlineAction(
  input: unknown,
): Promise<ActionResult> {
  const parsed = deadlineSchema.safeParse(input);
  if (!parsed.success) {
    const viewer = await requireOrg();
    return fail(getDictionary(viewer.org.language).common.somethingWentWrong);
  }
  const result = await changeDeadline(
    parsed.data.taskId,
    new Date(parsed.data.dueAt),
  );
  if (result.ok) refresh(parsed.data.taskId);
  return result;
}

const messageSchema = z.object({
  taskId: uuidSchema,
  body: z.string().trim().min(1).max(1000),
});

/** The reply thread — the assignee "reverts" on the message. */
export async function addMessageAction(input: unknown): Promise<ActionResult> {
  const viewer = await requireOrg();
  const locale = viewer.org.language;
  const t = getDictionary(locale);

  const parsed = messageSchema.safeParse(input);
  if (!parsed.success) return fail(t.common.somethingWentWrong);

  const supabase = await createClient();
  const { data: task } = await supabase
    .from("tasks")
    .select("id, org_id, title, assigned_to, created_by")
    .eq("id", parsed.data.taskId)
    .maybeSingle();
  if (!task) return fail(t.common.somethingWentWrong);

  const { error } = await supabase.from("task_messages").insert({
    task_id: task.id,
    org_id: task.org_id,
    author_id: viewer.userId,
    body: parsed.data.body,
  });
  if (error) return fail(t.common.somethingWentWrong);

  // Tell the other side, whichever side that is.
  const other =
    viewer.userId === task.created_by ? task.assigned_to : task.created_by;
  if (other && other !== viewer.userId) {
    const body = `${viewer.fullName?.trim() || t.org.roles.member}: ${parsed.data.body}`;
    const { data: email } = await supabase.rpc("org_member_email", {
      p_user: other,
    });
    await notifyWith(supabase, {
      orgId: task.org_id,
      userId: other,
      event: "task_assigned",
      taskId: task.id,
      locale,
      body,
      subject: writeSubject(viewer.org.name, writeMessage("task_assigned", locale, {
        actor: viewer.fullName?.trim() || t.org.roles.member,
        task: task.title,
      })),
      email,
      url: `${siteUrl()}/kaam/${task.id}`,
    });
  }

  refresh(task.id);
  return ok();
}

/**
 * A nudge. Deliberately not a transition: reminding somebody must never move
 * the task or restart a clock, or the record stops meaning anything.
 */
export async function remindAction(input: unknown): Promise<ActionResult> {
  const viewer = await requireOrg();
  const locale = viewer.org.language;
  const t = getDictionary(locale);

  const parsed = uuidSchema.safeParse(input);
  if (!parsed.success) return fail(t.common.somethingWentWrong);

  const supabase = await createClient();
  const { data: task } = await supabase
    .from("tasks")
    .select("id, org_id, title, assigned_to, due_at, state")
    .eq("id", parsed.data)
    .maybeSingle();
  if (!task?.assigned_to) return fail(t.common.somethingWentWrong);
  if (["done", "verified", "cancelled"].includes(task.state)) {
    return fail(t.common.somethingWentWrong);
  }

  const body = writeMessage("ack_reminder", locale, {
    actor: viewer.fullName?.trim() || t.org.roles.owner,
    task: task.title,
  });
  const { data: email } = await supabase.rpc("org_member_email", {
    p_user: task.assigned_to,
  });

  // Keyed to the minute, so a double tap sends one reminder, not two.
  await notifyWith(supabase, {
    orgId: task.org_id,
    userId: task.assigned_to,
    event: "ack_reminder",
    taskId: task.id,
    locale,
    body,
    subject: writeSubject(viewer.org.name, body),
    email,
    url: `${siteUrl()}/kaam/${task.id}`,
    dedupeKey: `${task.id}:manual_reminder:${new Date().toISOString().slice(0, 16)}`,
  });

  return ok();
}

function refresh(taskId: string): void {
  revalidatePath(`/kaam/${taskId}`);
  revalidatePath("/aaj");
  revalidatePath("/hafta");
}

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}
