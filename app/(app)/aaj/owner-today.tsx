import Link from "next/link";
import { Plus } from "lucide-react";

import { TaskRow } from "@/components/waakya/task-row";
import { buttonVariants } from "@/components/ui/button";
import { getDictionary, type Locale } from "@/lib/i18n";
import { groupBySection } from "@/lib/tasks/sections";
import { countDay, needsYou } from "@/lib/tasks/counters";
import type { TaskListItem } from "@/lib/tasks/queries";
import { OwnerHeader } from "./owner-header";
import { NeedsYouList } from "./needs-you-list";

/**
 * The owner's day (screens/Dashboard.png).
 *
 * The screen leads with what needs a decision, not with charts: the Neel
 * header for one glance, then *Aapke liye* with the actions inline on each
 * card, then the day's list. The primary way in sits in the bottom third,
 * thumb-height, holding the mic's place until voice capture ships (D-10).
 */
export function OwnerToday({
  tasks,
  locale,
  orgName,
  ownerName,
  nowIso,
  unread,
  phones,
}: {
  tasks: TaskListItem[];
  locale: Locale;
  orgName: string;
  ownerName: string | null;
  nowIso: string;
  unread: number;
  /** Assignee phone numbers, so Call on a card really dials. */
  phones: Record<string, string | null>;
}) {
  const t = getDictionary(locale);
  const now = new Date(nowIso);
  const counters = countDay(tasks, now);
  const attention = needsYou(tasks, now);
  const groups = groupBySection(tasks, now);
  const live = [...groups.late, ...groups.naya, ...groups.aaj, ...groups.later];

  return (
    <div className="flex min-h-dvh flex-col lg:hidden">
      <OwnerHeader
        locale={locale}
        orgName={orgName}
        ownerName={ownerName}
        counters={counters}
        unread={unread}
        now={now}
      />

      <main className="flex-1 p-4 pb-6">
        {attention.length > 0 ? (
          <section>
            <h2 className="mb-2 text-[15px] leading-[20px] font-bold text-ink-700">
              {t.lists.aapkeLiye}{" "}
              <span className="num font-normal text-ink-400">
                {attention.length}
              </span>
            </h2>
            <NeedsYouList
              locale={locale}
              attention={attention}
              phones={phones}
              nowIso={nowIso}
            />
          </section>
        ) : null}

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
          <section className={attention.length > 0 ? "mt-6" : ""}>
            <h2 className="mb-2 text-[15px] leading-[20px] font-bold text-ink-700">
              {t.lists.aajHeading}{" "}
              <span className="num font-normal text-ink-400">{live.length}</span>
            </h2>
            <ul aria-label={t.lists.aajHeading} className="flex flex-col gap-2">
              {live.map((task) => (
                <li key={task.id}>
                  <TaskRow task={task} locale={locale} viewer="owner" now={now} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {groups.done.length > 0 ? (
          <section className="mt-6">
            <h2 className="mb-2 text-[13px] leading-[18px] font-semibold text-ink-700">
              {t.lists.hoGayaSection}{" "}
              <span className="num font-normal text-ink-400">
                {groups.done.length}
              </span>
            </h2>
            <ul
              aria-label={t.lists.hoGayaSection}
              className="flex flex-col gap-2"
            >
              {groups.done.map((task) => (
                <li key={task.id}>
                  <TaskRow task={task} locale={locale} viewer="owner" now={now} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>

      {/* The primary floats above a fade, as the mic does (D-10), so the row
          beneath it reads as continuing rather than as cut off. */}
      <div className="sticky bottom-16 z-20 px-4 pb-3">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-8 h-8 bg-gradient-to-b from-transparent to-paper-50"
        />
        <Link
          href="/naya"
          className={buttonVariants({
            size: "block",
            className: "relative shadow-mic",
          })}
        >
          <Plus />
          {t.create.newTask}
        </Link>
      </div>

    </div>
  );
}
