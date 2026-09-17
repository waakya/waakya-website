import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireOrg, canManage } from "@/lib/auth/session";
import { getLocale } from "@/lib/i18n/server";
import { getTask } from "@/lib/tasks/queries";
import { getOrgMembers } from "@/lib/org/members";
import {
  currentStep,
  getTaskThread,
  getTaskTimeline,
  nextReminder,
  reachedFrom,
} from "@/lib/tasks/detail";
import { taskClocks } from "@/lib/tasks/present";
import { getTaskProofs } from "@/lib/tasks/proofs";
import { AppShell } from "@/components/waakya/app-shell";
import { getUnreadCount } from "@/lib/notify/inbox";
import { getDictionary } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { OwnerTaskDetail } from "./owner-detail";
import { TaskContext } from "./task-context";
import { StaffTaskDetail } from "./staff-detail";

export const metadata: Metadata = { title: "Kaam" };

/**
 * One task, two screens. The stepper and the clock bars are the *same*
 * component on both, so what the owner sees is what the staff member was
 * reminded about (D-06). Only the actions underneath differ.
 */
export default async function TaskPage({ params }: PageProps<"/kaam/[id]">) {
  const { id } = await params;
  const viewer = await requireOrg();
  const task = await getTask(id, viewer.org.id, viewer.org.ackMinutes);
  if (!task) notFound();

  const locale = await getLocale();
  const now = new Date();
  const [timeline, thread, proofs, source] = await Promise.all([
    getTaskTimeline(task.id, viewer.org.id),
    getTaskThread(task.id, viewer.org.id),
    getTaskProofs(task.id, viewer.org.id),
    taskSource(task.id, viewer.org.id),
  ]);
  const closed = ["done", "verified", "cancelled"].includes(task.state);

  const shared = {
    task,
    timeline,
    thread,
    proofs,
    locale,
    nowIso: now.toISOString(),
    stepper: {
      reached: reachedFrom(timeline),
      current: currentStep(task.state, timeline),
      ...taskClocks(task, now),
      ackMinutes: task.ackMinutes,
      // A closed task has no reminder coming, whatever the clock says.
      nextReminderAt: closed ? null : nextReminder(task.deliveredAt, task.dueAt, now, viewer.org),
    },
    viewerId: viewer.userId,
    source,
  };

  const unread = await getUnreadCount();
  const t = getDictionary(locale);
  const shell = {
    locale,
    orgName: viewer.org.name,
    personName: viewer.fullName ?? "—",
    roleLabel: viewer.role ? t.org.roles[viewer.role] : "",
    unread,
  } as const;

  if (canManage(viewer.role)) {
    const members = await getOrgMembers(viewer.org.id);
    return (
      <AppShell {...shell} variant="owner">
      <OwnerTaskDetail
        {...shared}
        role={viewer.role}
        // Call is the primary action, so the number the owner invited them
        // with is what it dials.
        assigneePhone={
          members.find((m) => m.userId === task.assigneeId)?.phone ?? null
        }
        members={members
          .filter((m) => m.userId !== task.assigneeId)
          .map((m) => ({ id: m.userId, name: m.name }))}
      />
      <TaskContext locale={locale} orgId={viewer.org.id} taskId={task.id} viewerId={viewer.userId} manages />
      </AppShell>
    );
  }

  return (
    <AppShell {...shell} variant="staff">
      <StaffTaskDetail {...shared} role={viewer.role} />
      <TaskContext locale={locale} orgId={viewer.org.id} taskId={task.id} viewerId={viewer.userId} manages={false} />
    </AppShell>
  );
}

/**
 * The message a task was made from. Read as the viewer, so row level security
 * decides: someone outside that conversation simply sees no source.
 */
async function taskSource(
  taskId: string,
  orgId: string,
): Promise<{ conversationId: string; body: string } | null> {
  const supabase = await createClient();
  const { data: task } = await supabase
    .from("tasks")
    .select("source_message_id")
    .eq("id", taskId)
    .eq("org_id", orgId)
    .maybeSingle();
  if (!task?.source_message_id) return null;
  const { data: message } = await supabase
    .from("messages")
    .select("conversation_id, body")
    .eq("id", task.source_message_id)
    .maybeSingle();
  return message ? { conversationId: message.conversation_id, body: message.body } : null;
}
