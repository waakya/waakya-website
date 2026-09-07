import type { Metadata } from "next";
import { requireOrg, canManage } from "@/lib/auth/session";
import { getMyTasks, getOrgTasks } from "@/lib/tasks/queries";
import { getDictionary } from "@/lib/i18n";
import { AppShell } from "@/components/waakya/app-shell";
import { TaskRow } from "@/components/waakya/task-row";
import { dayKey } from "@/lib/tasks/time";
import { formatIndianDate } from "@/lib/tasks/format-date";
import { getLocale } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Pehle ke kaam" };

/**
 * The staff member's record of what they have already done — the thing that
 * makes the app worth keeping rather than only worth obeying. Finished work,
 * newest day first.
 */
export default async function PehlePage() {
  const viewer = await requireOrg();
  const owner = canManage(viewer.role);
  const locale = await getLocale();
  const t = getDictionary(locale);
  const now = new Date();

  const tasks = owner
    ? await getOrgTasks(viewer.org.id, viewer.org.ackMinutes)
    : await getMyTasks(viewer.org.id, viewer.userId, viewer.org.ackMinutes);

  const finished = tasks
    .filter((task) => ["done", "verified"].includes(task.state))
    .sort(
      (a, b) =>
        Date.parse(b.doneAt ?? b.createdAt) - Date.parse(a.doneAt ?? a.createdAt),
    );

  const days = new Map<string, typeof finished>();
  for (const task of finished) {
    const key = dayKey(task.doneAt ?? task.createdAt);
    days.set(key, [...(days.get(key) ?? []), task]);
  }

  return (
    <AppShell
      locale={locale}
      variant={owner ? "owner" : "staff"}
      orgName={viewer.org.name}
      personName={viewer.fullName ?? "—"}
      roleLabel={viewer.role ? getDictionary(locale).org.roles[viewer.role] : ""}
      unread={0}
    >
      <main className="flex-1 p-4 pb-6">
        <h1 className="text-[24px] leading-[30px] font-bold text-ink-900">
          {t.nav.pehle}
        </h1>

        {days.size === 0 ? (
          <p className="mt-10 text-center text-[17px] text-ink-500">
            {t.common.nothingHere}
          </p>
        ) : null}

        {[...days.entries()].map(([key, dayTasks]) => (
          <section key={key} className="mt-5">
            <h2 className="num mb-2 text-[13px] leading-[18px] font-semibold text-ink-700">
              {formatIndianDate(dayTasks[0].doneAt ?? dayTasks[0].createdAt, locale)}{" "}
              <span className="font-normal text-ink-400">{dayTasks.length}</span>
            </h2>
            <ul className="flex flex-col gap-2">
              {dayTasks.map((task) => (
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
          </section>
        ))}
      </main>

    </AppShell>
  );
}
