import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { requireOrg, canManage } from "@/lib/auth/session";
import { shellFor } from "@/lib/auth/shell";
import { getPhase1 } from "@/lib/i18n/phase1";
import { getMyTasks, getOrgTasks, type TaskListItem } from "@/lib/tasks/queries";
import { isLate, stateWord } from "@/lib/tasks/present";
import { formatIndianDate } from "@/lib/tasks/format-date";
import { formatTime } from "@/lib/tasks/time";
import { AppShell } from "@/components/waakya/app-shell";
import { buttonVariants } from "@/components/ui/button";
import { StateChip } from "@/components/ui/state-chip";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Work" };

type Tab = "mine" | "team" | "open" | "late" | "done";

const FINISHED = ["verified", "cancelled"];

/**
 * Work as a compact list, not a board: every commitment with its owner, its
 * deadline and where it is. Filters are links, so a filtered view can be
 * bookmarked or shared.
 */
export default async function WorkPage({ searchParams }: PageProps<"/work">) {
  const viewer = await requireOrg();
  const shell = await shellFor(viewer);
  const p = getPhase1(shell.locale);
  const manages = canManage(viewer.role);
  const now = new Date();

  const params = await searchParams;
  const requested = typeof params.tab === "string" ? (params.tab as Tab) : manages ? "team" : "mine";
  const tabs: Tab[] = manages ? ["team", "mine", "open", "late", "done"] : ["mine", "open", "late", "done"];
  const tab = tabs.includes(requested) ? requested : tabs[0];

  const all: TaskListItem[] = manages
    ? await getOrgTasks(viewer.org.id, viewer.org.ackMinutes)
    : await getMyTasks(viewer.org.id, viewer.userId, viewer.org.ackMinutes);

  const shown = all
    .filter((task) => {
      switch (tab) {
        case "mine":
          return task.assigneeId === viewer.userId || task.createdById === viewer.userId;
        case "open":
          return !FINISHED.includes(task.state);
        case "late":
          return isLate(task, now);
        case "done":
          return ["done", "verified"].includes(task.state);
        default:
          return task.state !== "cancelled";
      }
    })
    .sort((a, b) => {
      const at = a.dueAt ? Date.parse(a.dueAt) : Infinity;
      const bt = b.dueAt ? Date.parse(b.dueAt) : Infinity;
      return tab === "done" ? bt - at : at - bt;
    });

  const label: Record<Tab, string> = {
    mine: p.work.mine,
    team: p.work.team,
    open: p.work.pending,
    late: p.work.late,
    done: p.work.done,
  };

  return (
    <AppShell {...shell}>
      <main className="flex-1 p-4 pb-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[24px] leading-[30px] font-bold text-ink-900">{p.work.title}</h1>
            <p className="mt-0.5 text-[15px] leading-[20px] text-ink-500">{p.work.subtitle}</p>
          </div>
          {manages ? (
            <Link href="/naya" className={buttonVariants({ size: "owner" })}>
              <Plus aria-hidden="true" />
              {p.work.newTask}
            </Link>
          ) : null}
        </div>

        <nav aria-label={p.work.title} className="mt-4 flex gap-1 overflow-x-auto pb-1">
          {tabs.map((value) => (
            <Link
              key={value}
              href={`/work?tab=${value}`}
              aria-current={value === tab ? "page" : undefined}
              className={cn(
                "shrink-0 rounded-chip border px-3.5 py-1.5 text-[13.5px] font-semibold",
                value === tab
                  ? "border-neel-600 bg-neel-600 text-white"
                  : "border-paper-200 bg-paper-0 text-ink-700 hover:bg-paper-100",
              )}
            >
              {label[value]}
            </Link>
          ))}
        </nav>

        {shown.length === 0 ? (
          <p className="mt-8 text-center text-[15px] text-ink-500">{p.work.empty}</p>
        ) : (
          <ul
            aria-label={label[tab]}
            className="mt-4 overflow-hidden rounded-card border border-paper-200 bg-paper-0"
          >
            {shown.map((task) => {
              const late = isLate(task, now);
              return (
                <li key={task.id} className="border-b border-paper-100 last:border-b-0">
                  <Link
                    href={`/kaam/${task.id}`}
                    className="flex items-center gap-3 px-3.5 py-3 hover:bg-paper-50"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold text-ink-900">
                        {task.title}
                      </span>
                      <span className="num block truncate text-[13px] text-ink-500">
                        {task.assigneeName}
                        {" · "}
                        {task.dueAt
                          ? `${p.work.due} ${formatIndianDate(task.dueAt, shell.locale)} ${formatTime(task.dueAt)}`
                          : p.work.noDeadline}
                      </span>
                    </span>
                    {late ? (
                      <StateChip tone="laal">{p.work.late}</StateChip>
                    ) : (
                      <span className="shrink-0 text-[13px] font-semibold text-ink-700">
                        {stateWord(task.state, shell.locale)}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </AppShell>
  );
}
