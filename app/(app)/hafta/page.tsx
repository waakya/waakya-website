import type { Metadata } from "next";
import { requireOrg, canManage } from "@/lib/auth/session";
import { getMyTasks, getOrgTasks } from "@/lib/tasks/queries";
import { getDictionary } from "@/lib/i18n";
import { AppShell } from "@/components/vaakya/app-shell";
import { TaskRow } from "@/components/vaakya/task-row";
import { dayKey } from "@/lib/tasks/time";
import { formatIndianDate } from "@/lib/tasks/format-date";
import { getLocale } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Hafta" };

/**
 * The week, grouped by the day the work is due — the same rows as Aaj, read
 * forwards instead of now. Anything already late stays on Aaj where it can be
 * acted on; this screen is for planning, not for chasing.
 */
export default async function HaftaPage() {
  const viewer = await requireOrg();
  const owner = canManage(viewer.role);
  const locale = await getLocale();
  const t = getDictionary(locale);
  const now = new Date();

  const tasks = owner
    ? await getOrgTasks(viewer.org.id, viewer.org.ackMinutes)
    : await getMyTasks(viewer.org.id, viewer.userId, viewer.org.ackMinutes);

  const weekEnd = new Date(now.getTime() + 7 * 86_400_000);
  const upcoming = tasks
    .filter(
      (task) =>
        task.dueAt !== null &&
        !["verified", "cancelled"].includes(task.state) &&
        Date.parse(task.dueAt) >= now.getTime() &&
        Date.parse(task.dueAt) <= weekEnd.getTime(),
    )
    .sort((a, b) => Date.parse(a.dueAt!) - Date.parse(b.dueAt!));

  const days = new Map<string, typeof upcoming>();
  for (const task of upcoming) {
    const key = dayKey(task.dueAt!);
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
          {t.lists.weekTitle}
        </h1>

        {days.size === 0 ? (
          <p className="mt-10 text-center text-[17px] text-ink-500">
            {t.lists.weekEmpty}
          </p>
        ) : null}

        {[...days.entries()].map(([key, dayTasks]) => (
          <section key={key} className="mt-5">
            <h2 className="num mb-2 text-[13px] leading-[18px] font-semibold text-ink-700">
              {formatIndianDate(dayTasks[0].dueAt!, locale)}{" "}
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
