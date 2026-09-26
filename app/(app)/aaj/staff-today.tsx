import type * as React from "react";
import { ChevronDown, ListChecks } from "lucide-react";

import { Mark } from "@/components/waakya/mark";
import { Bell } from "@/components/waakya/bell";
import { Avatar } from "@/components/ui/avatar";
import { TaskRow } from "@/components/waakya/task-row";
import { getDictionary, type Locale } from "@/lib/i18n";
import { getDesign } from "@/lib/i18n/design";
import { groupBySection, type SectionKey } from "@/lib/tasks/sections";
import type { TaskListItem } from "@/lib/tasks/queries";
import type { ChecklistSummary } from "@/lib/checklists/queries";
import { ChecklistCard } from "@/components/waakya/checklist-card";
import { formatIndianDate } from "@/lib/tasks/format-date";

/**
 * My Tasks (screens/MyTasks.png). No coloured header, sections in the order
 * नया · लेट · आज · बाद में · हो गया, and new work carries the pulsing dot.
 *
 * V3: the one task to do now is singled out first — late work, then new work
 * waiting for a yes, then today's — so "what do I do next?" needs no reading.
 * It leaves its section below, so nothing shows twice.
 */
export function StaffToday({
  tasks,
  locale,
  orgName,
  staffName,
  nowIso,
  unread,
  checklists,
  extra,
}: {
  tasks: TaskListItem[];
  locale: Locale;
  orgName: string;
  staffName: string | null;
  nowIso: string;
  unread: number;
  checklists: ChecklistSummary[];
  extra?: React.ReactNode;
}) {
  const t = getDictionary(locale);
  const d = getDesign(locale);
  const now = new Date(nowIso);
  // Today's routine reads as one card, so its tasks are not also listed loose
  // among the day's individual work.
  const inAChecklist = new Set(checklists.flatMap((c) => c.taskIds));
  const groups = groupBySection(
    tasks.filter((task) => !inAChecklist.has(task.id)),
    now,
  );

  const headings: Record<SectionKey, string> = {
    naya: t.lists.naya,
    late: t.lists.late,
    aaj: t.lists.aajHeading,
    later: t.actions.baadMein,
    done: t.lists.hoGayaSection,
  };

  const next = groups.late[0] ?? groups.naya[0] ?? groups.aaj[0] ?? null;
  if (next) {
    for (const key of ["naya", "late", "aaj"] as const) {
      groups[key] = groups[key].filter((task) => task.id !== next.id);
    }
  }

  const open = (["naya", "late", "aaj", "later"] as const).filter(
    (key) => groups[key].length > 0,
  );

  return (
    <div className="flex min-h-dvh flex-col">
      <main className="flex-1 p-4 pb-6">
        <header className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-title leading-[30px] font-bold text-ink-900">
              {t.lists.mereKaam}
            </h1>
            <p className="num mt-0.5 text-body leading-[20px] text-ink-500">
              {orgName} · {formatIndianDate(now, locale)}
            </p>
          </div>
          <Bell locale={locale} unread={unread} />
          <Mark size={26} />
          <Avatar name={staffName ?? "?"} size={40} />
        </header>

        <div className="mt-4">{extra}</div>

        {next ? (
          <section aria-labelledby="next-up" className="mt-5">
            <h2 id="next-up" className="mb-2 text-label leading-[18px] font-semibold text-neel-700">
              {d.v3.upNext}
            </h2>
            <div className="rounded-card ring-2 ring-neel-100">
              <TaskRow
                task={next}
                locale={locale}
                viewer="staff"
                now={now}
                showAssignee={false}
                highlightNew={next.state === "delivered"}
              />
            </div>
          </section>
        ) : null}

        {!next && open.length === 0 && groups.done.length === 0 && checklists.length === 0 ? (
          <EmptyState title={t.lists.noTasks} help={t.lists.nothingToday} />
        ) : null}

        {open.map((key) => (
          <section key={key} className="mt-5">
            <h2
              className={
                key === "late"
                  ? "mb-2 text-label leading-[18px] font-semibold text-laal-700"
                  : "mb-2 text-label leading-[18px] font-semibold text-ink-700"
              }
            >
              {headings[key]}{" "}
              <span className="num font-normal text-ink-400">
                {groups[key].length}
              </span>
            </h2>
            <ul className="flex flex-col gap-2">
              {groups[key].map((task) => (
                <li key={task.id}>
                  <TaskRow
                    task={task}
                    locale={locale}
                    viewer="staff"
                    now={now}
                    showAssignee={false}
                    highlightNew={key === "naya"}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}

        {checklists.length > 0 ? (
          <section className="mt-5">
            <h2 className="mb-2 text-label leading-[18px] font-semibold text-ink-700">
              {t.lists.checklist}
            </h2>
            <ul className="flex flex-col gap-2">
              {checklists.map((checklist) => (
                <li key={checklist.id}>
                  <ChecklistCard locale={locale} checklist={checklist} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {!next && open.length === 0 && groups.done.length > 0 ? (
          <p className="mt-8 text-center text-body-lg font-bold text-hara-700">
            {t.lists.nothingToday}
          </p>
        ) : null}

        {groups.done.length > 0 ? (
          <details className="mt-6 group">
            <summary className="flex min-h-tap cursor-pointer list-none items-center gap-2 text-body font-semibold text-hara-700">
              <ListChecks className="size-5" aria-hidden="true" />
              {t.lists.hoGayaSection}
              <span className="num font-normal text-ink-400">
                {groups.done.length}
              </span>
              <ChevronDown
                className="ml-auto size-5 text-ink-400 transition-transform group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <ul className="mt-2 flex flex-col gap-2">
              {groups.done.map((task) => (
                <li key={task.id}>
                  <TaskRow
                    task={task}
                    locale={locale}
                    viewer="staff"
                    now={now}
                    showAssignee={false}
                  />
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </main>

    </div>
  );
}

function EmptyState({ title, help }: { title: string; help: string }) {
  return (
    <div className="mt-10 flex flex-col items-center gap-2 text-center">
      <p className="font-display text-title font-extrabold text-ink-900">
        {title}
      </p>
      <p className="text-body leading-[20px] text-ink-500">{help}</p>
    </div>
  );
}
