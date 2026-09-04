import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireOrg, canManage } from "@/lib/auth/session";
import { getOrgTasks, getMyTasks } from "@/lib/tasks/queries";
import { getChecklists } from "@/lib/checklists/queries";
import { getDictionary } from "@/lib/i18n";
import { TaskRow } from "@/components/vaakya/task-row";
import { dayKey } from "@/lib/tasks/time";
import { getLocale } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Checklist" };

/** Today's instance of one routine, as the list of real tasks it produced. */
export default async function ChecklistPage({
  params,
}: PageProps<"/checklist/[id]">) {
  const { id } = await params;
  const viewer = await requireOrg();
  const owner = canManage(viewer.role);
  const locale = await getLocale();
  const t = getDictionary(locale);
  const now = new Date();

  const [checklists, tasks] = await Promise.all([
    getChecklists(viewer.org.id),
    owner
      ? getOrgTasks(viewer.org.id, viewer.org.ackMinutes)
      : getMyTasks(viewer.org.id, viewer.userId, viewer.org.ackMinutes),
  ]);

  const checklist = checklists.find((c) => c.id === id);
  if (!checklist) notFound();

  const itemIds = new Set(checklist.items.map((item) => item.id));
  const today = dayKey(now);
  const todays = tasks.filter(
    (task) =>
      task.checklistItemId !== null &&
      itemIds.has(task.checklistItemId) &&
      task.checklistDate === today,
  );

  return (
    <div className="flex min-h-dvh flex-col p-4">
      <header className="flex items-center gap-2">
        <Link
          href="/aaj"
          aria-label={t.actions.back}
          className="flex size-tap items-center justify-center rounded-full text-ink-900"
        >
          <ArrowLeft className="size-6" />
        </Link>
        <h1 className="flex-1 text-[20px] leading-[26px] font-bold text-ink-900">
          {checklist.name}
        </h1>
      </header>

      <ul aria-label={checklist.name} className="mt-5 flex flex-col gap-2">
        {todays.map((task) => (
          <li key={task.id}>
            <TaskRow
              task={task}
              locale={locale}
              viewer={owner ? "owner" : "staff"}
              now={now}
              showAssignee={owner}
            />
          </li>
        ))}
      </ul>

      {todays.length === 0 ? (
        <p className="mt-8 text-center text-[15px] text-ink-500">
          {t.common.nothingHere}
        </p>
      ) : null}
    </div>
  );
}
