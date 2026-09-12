"use client";

import * as React from "react";
import { Clock, FileText, Flag, MessageSquare } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  AppWindow,
  Chip,
  Drawer,
  Eyebrow,
  PersonAvatar,
  PresenterNote,
  Stage,
  Timeline,
  Title,
} from "../chrome";
import {
  BUSINESS,
  PEOPLE,
  TASK_FILTERS,
  TASK_ROWS,
  TASK_TIMELINE,
  type TaskFilter,
  type TaskRow,
} from "../../_lib/data";
import { useDemo } from "../../_lib/store";
import type { SectionProps } from "../../_lib/types";

const STATE_TONE: Record<TaskRow["state"], "neutral" | "accent" | "good" | "warn" | "bad"> = {
  Seen: "neutral",
  Accepted: "neutral",
  "In progress": "accent",
  Submitted: "warn",
  Verified: "good",
  Overdue: "bad",
};

/** How far along the timeline each state sits. */
const STATE_PROGRESS: Record<TaskRow["state"], number> = {
  Seen: 1,
  Accepted: 2,
  "In progress": 3,
  Submitted: 4,
  Verified: 5,
  Overdue: 2,
};

/**
 * Task accountability as a working list, not a board. A row is a commitment;
 * opening one shows everything behind it.
 */
export function TasksSection(props: SectionProps) {
  void props;
  const { state, dispatch } = useDemo();
  const [filter, setFilter] = React.useState<TaskFilter>("team");

  const rows = TASK_ROWS.filter((row) => row.filters.includes(filter));
  const open = TASK_ROWS.find((row) => row.id === state.openTaskId) ?? null;

  return (
    <Stage wide className="min-h-full">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow className="wk-rise">Accountability</Eyebrow>
          <Title size="md" className="wk-rise wk-d1 mt-3 max-w-[24ch]">
            Every commitment, with a name and a time against it.
          </Title>
        </div>
        <p className="wk-rise wk-d2 max-w-[34ch] text-[14px] leading-[1.55] text-[var(--d-faint)]">
          Open any row for the full history.
        </p>
      </div>

      <div className="wk-pop wk-d2 relative mt-6">
        <AppWindow
          title={BUSINESS.name}
          subtitle="Tasks"
          bodyClassName="relative flex h-[min(58vh,520px)] flex-col overflow-hidden"
        >
          <div className="wk-scroll flex shrink-0 gap-1 overflow-x-auto border-b border-[var(--s-line)] px-3 py-2">
            {TASK_FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={cn(
                  "shrink-0 rounded-[9px] px-3 py-1.5 text-[12.5px] font-semibold transition-colors",
                  filter === item.id
                    ? "bg-[#eef0fe] text-[#2c35a5]"
                    : "text-[var(--s-dim)] hover:bg-[var(--s-sub)]",
                )}
              >
                {item.label}
              </button>
            ))}
            <span className="wk-tabnum ml-auto hidden shrink-0 self-center pr-1 text-[11.5px] text-[var(--s-faint)] sm:block">
              {rows.length} {rows.length === 1 ? "task" : "tasks"}
            </span>
          </div>

          <div className="wk-scroll flex-1 overflow-y-auto">
            <table className="w-full border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-[var(--s-sub)]">
                <tr>
                  <th className="px-4 py-2 text-[10.5px] font-bold tracking-[0.12em] uppercase text-[var(--s-faint)]">
                    Task
                  </th>
                  <th className="hidden px-3 py-2 text-[10.5px] font-bold tracking-[0.12em] uppercase text-[var(--s-faint)] md:table-cell">
                    Owner
                  </th>
                  <th className="hidden px-3 py-2 text-[10.5px] font-bold tracking-[0.12em] uppercase text-[var(--s-faint)] lg:table-cell">
                    Due
                  </th>
                  <th className="px-4 py-2 text-right text-[10.5px] font-bold tracking-[0.12em] uppercase text-[var(--s-faint)]">
                    State
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => dispatch({ type: "openTask", id: row.id })}
                    className="cursor-pointer border-b border-[var(--s-line-soft)] transition-colors last:border-b-0 hover:bg-[#fafbff]"
                  >
                    <td className="px-4 py-3">
                      <span className="block text-[13.5px] font-semibold">{row.title}</span>
                      <span className="block text-[11.5px] text-[var(--s-faint)] md:hidden">
                        {PEOPLE[row.personId]?.name}
                      </span>
                      <span className="hidden text-[11.5px] text-[var(--s-faint)] md:block">
                        {row.project}
                      </span>
                    </td>
                    <td className="hidden px-3 py-3 md:table-cell">
                      <span className="flex items-center gap-2">
                        <PersonAvatar personId={row.personId} size={24} />
                        <span className="truncate text-[12.5px]">
                          {PEOPLE[row.personId]?.name}
                        </span>
                      </span>
                    </td>
                    <td className="wk-tabnum hidden px-3 py-3 text-[12.5px] text-[var(--s-dim)] lg:table-cell">
                      {row.due}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Chip tone={STATE_TONE[row.state]}>{row.state}</Chip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {rows.length === 0 ? (
              <p className="px-4 py-10 text-center text-[13px] text-[var(--s-faint)]">
                Nothing here. That is the point.
              </p>
            ) : null}
          </div>

          <Drawer
            open={open !== null}
            onClose={() => dispatch({ type: "openTask", id: null })}
            title={open?.title ?? ""}
            subtitle={open ? `${open.project} · ${BUSINESS.name}` : undefined}
            footer={
              <p className="text-[11.5px] text-[var(--s-faint)]">
                Nothing in this history can be edited after the fact.
              </p>
            }
          >
            {open ? (
              <div className="flex flex-col gap-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Chip tone={STATE_TONE[open.state]}>{open.state}</Chip>
                  <Chip tone="neutral" icon={<Clock aria-hidden="true" />}>
                    {open.due}
                  </Chip>
                  <Chip tone={open.priority === "High" ? "bad" : "neutral"} icon={<Flag aria-hidden="true" />}>
                    {open.priority}
                  </Chip>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-[10px] border border-[var(--s-line)] px-3 py-2.5">
                    <p className="text-[11px] text-[var(--s-faint)]">Doing it</p>
                    <span className="mt-1.5 flex items-center gap-2">
                      <PersonAvatar personId={open.personId} size={24} />
                      <span className="truncate text-[12.5px] font-semibold">
                        {PEOPLE[open.personId]?.name}
                      </span>
                    </span>
                  </div>
                  <div className="rounded-[10px] border border-[var(--s-line)] px-3 py-2.5">
                    <p className="text-[11px] text-[var(--s-faint)]">Asked for it</p>
                    <span className="mt-1.5 flex items-center gap-2">
                      <PersonAvatar personId="aarav" size={24} />
                      <span className="truncate text-[12.5px] font-semibold">Aarav Mehta</span>
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--s-faint)]">
                    Description
                  </p>
                  <p className="mt-2 text-[13px] leading-[1.55] text-[var(--s-dim)]">
                    {open.state === "Overdue"
                      ? "Past its deadline. It has been escalated to the owner automatically, and it stays on this list until it is closed."
                      : "Agreed in the Tower B conversation. The deadline and the owner were set at the moment it was agreed."}
                  </p>
                </div>

                <div className="flex items-center gap-3 rounded-[10px] bg-[var(--s-sub)] px-3.5 py-3">
                  <FileText className="size-4 shrink-0 text-[#3541c4]" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium">
                    {open.state === "Verified" || open.state === "Submitted"
                      ? "Kitchen_Quotation_v3.pdf"
                      : "No attachment yet"}
                  </span>
                  <MessageSquare className="size-4 shrink-0 text-[var(--s-faint)]" aria-hidden="true" />
                  <span className="wk-tabnum text-[11.5px] text-[var(--s-faint)]">2</span>
                </div>

                <div>
                  <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--s-faint)]">
                    Activity
                  </p>
                  <div className="mt-3">
                    <Timeline
                      steps={TASK_TIMELINE}
                      reachedUpTo={STATE_PROGRESS[open.state] - 1}
                    />
                  </div>
                </div>
              </div>
            ) : null}
          </Drawer>
        </AppWindow>
      </div>

      <div className="mt-6">
        <PresenterNote>
          No more &ldquo;I didn&rsquo;t see it&rdquo; or &ldquo;I thought someone else was
          doing it&rdquo;.
        </PresenterNote>
      </div>
    </Stage>
  );
}
