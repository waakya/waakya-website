import Link from "next/link";
import { Plus } from "lucide-react";

import { BottomNav } from "@/components/vaakya/bottom-nav";
import { Mark } from "@/components/vaakya/mark";
import { TaskRow } from "@/components/vaakya/task-row";
import { buttonVariants } from "@/components/ui/button";
import { getDictionary, type Locale } from "@/lib/i18n";
import { groupBySection } from "@/lib/tasks/sections";
import type { TaskListItem } from "@/lib/tasks/queries";
import { formatIndianDate } from "@/lib/tasks/format-date";

/**
 * The owner's day (screens/Dashboard.png). Slice 3 builds the list; Slice 7
 * adds the Neel header with the four counters, the "Aapke liye" cards with
 * inline actions, and the completion rate.
 */
export function OwnerToday({
  tasks,
  locale,
  orgName,
  ownerName,
  nowIso,
}: {
  tasks: TaskListItem[];
  locale: Locale;
  orgName: string;
  ownerName: string | null;
  nowIso: string;
}) {
  const t = getDictionary(locale);
  const now = new Date(nowIso);
  const groups = groupBySection(tasks, now);
  const live = [...groups.late, ...groups.naya, ...groups.aaj, ...groups.later];

  return (
    <div className="flex min-h-dvh flex-col">
      <main className="flex-1 p-4 pb-6">
        <header className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-[24px] leading-[30px] font-bold text-ink-900">
              {t.lists.aajHeading}
            </h1>
            <p className="num mt-0.5 text-[15px] leading-[20px] text-ink-500">
              {orgName} · {formatIndianDate(now, locale)}
              {ownerName ? ` · ${ownerName}` : ""}
            </p>
          </div>
          <Mark size={26} />
        </header>

        {live.length === 0 && groups.done.length === 0 ? (
          <div className="mt-10 flex flex-col items-center gap-2 text-center">
            <p className="font-display text-[24px] font-extrabold text-ink-900">
              {t.lists.noTasks}
            </p>
            <p className="text-[15px] leading-[20px] text-ink-500">
              {t.lists.noTasksHelp}
            </p>
          </div>
        ) : null}

        {live.length > 0 ? (
          <ul className="mt-5 flex flex-col gap-2">
            {live.map((task) => (
              <li key={task.id}>
                <TaskRow task={task} locale={locale} viewer="owner" now={now} />
              </li>
            ))}
          </ul>
        ) : null}

        {groups.done.length > 0 ? (
          <section className="mt-6">
            <h2 className="mb-2 text-[13px] leading-[18px] font-semibold text-ink-700">
              {t.lists.hoGayaSection}{" "}
              <span className="num font-normal text-ink-400">
                {groups.done.length}
              </span>
            </h2>
            <ul className="flex flex-col gap-2">
              {groups.done.map((task) => (
                <li key={task.id}>
                  <TaskRow task={task} locale={locale} viewer="owner" now={now} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>

      {/*
        The primary way in, in the bottom third and thumb-height. It takes the
        mic's place and its prominence until voice capture ships (D-10).
      */}
      <div className="sticky bottom-16 z-20 px-4 pb-3">
        <Link
          href="/naya"
          className={buttonVariants({ size: "block", className: "shadow-mic" })}
        >
          <Plus />
          {t.create.newTask}
        </Link>
      </div>

      <BottomNav locale={locale} variant="owner" />
    </div>
  );
}
