"use client";

import * as React from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  FolderKanban,
  Home,
  MessageSquare,
  ShieldCheck,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  AppWindow,
  Chip,
  Drawer,
  Eyebrow,
  PersonAvatar,
  Stage,
  Timeline,
  Title,
} from "../chrome";
import {
  ATTENTION,
  BUSINESS,
  CONVERSATIONS,
  PEOPLE,
  RECENT_ACTIVITY,
  TASK_TIMELINE,
  TODAY,
  WORKSPACES,
  type TodayItem,
} from "../../_lib/data";
import type { SectionProps } from "../../_lib/types";

const NAV = [
  { id: "home", icon: Home, label: "Today", active: true },
  { id: "messages", icon: MessageSquare, label: "Conversations" },
  { id: "tasks", icon: CheckCircle2, label: "Work" },
  { id: "projects", icon: FolderKanban, label: "Projects" },
  { id: "documents", icon: FileText, label: "Documents" },
  { id: "approvals", icon: ShieldCheck, label: "Approvals" },
  { id: "people", icon: Users, label: "Team" },
];

const STATE_CHIP: Record<
  TodayItem["state"],
  { label: string; tone: "neutral" | "accent" | "good" | "warn" | "bad" }
> = {
  in_progress: { label: "In progress", tone: "accent" },
  accepted: { label: "Accepted", tone: "neutral" },
  waiting: { label: "Waiting for approval", tone: "warn" },
  overdue: { label: "Overdue", tone: "bad" },
  verified: { label: "Verified", tone: "good" },
};

const TONE_DOT: Record<string, string> = {
  bad: "bg-[#c62828]",
  warn: "bg-[#c98a1e]",
  accent: "bg-[#3541c4]",
};

/**
 * The product's Home: built to answer "what needs me?" before anything else.
 * Rows open a real detail panel, so this is the application, not a picture.
 */
export function HomeSection(props: SectionProps) {
  void props;
  const [openItem, setOpenItem] = React.useState<TodayItem | null>(null);

  return (
    <Stage wide className="min-h-full">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow className="wk-rise">Inside Waakya</Eyebrow>
          <Title size="md" className="wk-rise wk-d1 mt-3">
            A home screen that tells you what needs you.
          </Title>
        </div>
        <p className="wk-rise wk-d2 max-w-[38ch] text-[14px] leading-[1.55] text-[var(--d-faint)]">
          Open any row to see the whole story behind it.
        </p>
      </div>

      <div className="wk-pop wk-d2 relative mt-6">
        <AppWindow
          title={BUSINESS.name}
          subtitle="Business workspace"
          bodyClassName="relative flex h-[min(62vh,560px)] overflow-hidden"
        >
          {/* nav rail */}
          <nav className="hidden w-[178px] shrink-0 flex-col gap-0.5 border-r border-[var(--s-line)] bg-[var(--s-sub)] p-2.5 lg:flex">
            {NAV.map((item) => {
              const Icon = item.icon;
              return (
                <span
                  key={item.id}
                  className={cn(
                    "flex items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-[13px] font-medium",
                    item.active
                      ? "bg-[#eef0fe] font-semibold text-[#2c35a5]"
                      : "text-[var(--s-dim)]",
                  )}
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  {item.label}
                </span>
              );
            })}
            <span className="mt-auto flex items-center gap-2.5 rounded-[9px] px-2.5 py-2">
              <PersonAvatar personId="aarav" size={26} />
              <span className="min-w-0">
                <span className="block truncate text-[12.5px] font-semibold">Aarav Mehta</span>
                <span className="block text-[11px] text-[var(--s-faint)]">Owner</span>
              </span>
            </span>
          </nav>

          {/* main */}
          <div className="wk-scroll flex-1 overflow-y-auto p-5">
            <h3 className="font-display text-[24px] font-bold">Good morning, Aarav.</h3>
            <p className="mt-1 text-[13.5px] text-[var(--s-dim)]">
              5 things need your attention
            </p>

            <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
              {ATTENTION.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-[11px] border border-[var(--s-line)] px-3.5 py-3"
                >
                  <span
                    aria-hidden="true"
                    className={cn("size-2 shrink-0 rounded-full", TONE_DOT[item.tone])}
                  />
                  <span className="wk-tabnum font-display text-[22px] leading-none font-bold">
                    {item.count}
                  </span>
                  <span className="text-[12.5px] leading-tight text-[var(--s-dim)]">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            <p className="mt-6 text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--s-faint)]">
              Today
            </p>
            <ul className="mt-2.5 flex flex-col gap-2">
              {TODAY.map((item) => {
                const chip = STATE_CHIP[item.state];
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setOpenItem(item)}
                      className="group flex w-full items-center gap-3 rounded-[11px] border border-[var(--s-line)] px-3.5 py-3 text-left transition-all duration-200 hover:border-[#c9cdf6] hover:bg-[#fafbff]"
                    >
                      <PersonAvatar personId={item.personId} size={30} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-semibold">
                          {item.title}
                        </span>
                        <span className="wk-tabnum block truncate text-[12px] text-[var(--s-faint)]">
                          {PEOPLE[item.personId]?.name} · {item.due}
                        </span>
                      </span>
                      <Chip tone={chip.tone}>{chip.label}</Chip>
                      <ArrowRight
                        className="size-4 shrink-0 text-[var(--s-faint)] opacity-0 transition-opacity group-hover:opacity-100"
                        aria-hidden="true"
                      />
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--s-faint)]">
                  Projects
                </p>
                <ul className="mt-2.5 flex flex-col gap-1.5">
                  {WORKSPACES.map((workspace) => (
                    <li
                      key={workspace.id}
                      className="flex items-center gap-3 rounded-[10px] border border-[var(--s-line)] px-3 py-2.5"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold">
                          {workspace.name}
                        </span>
                        <span className="block truncate text-[11.5px] text-[var(--s-faint)]">
                          {workspace.project} · {workspace.open} open
                        </span>
                      </span>
                      {workspace.unread > 0 ? (
                        <span className="wk-tabnum grid size-5 shrink-0 place-items-center rounded-full bg-[#3541c4] text-[11px] font-bold text-white">
                          {workspace.unread}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--s-faint)]">
                  Recent activity
                </p>
                <ul className="mt-2.5 flex flex-col gap-2">
                  {RECENT_ACTIVITY.map((entry) => (
                    <li key={entry.id} className="flex items-start gap-2.5">
                      <Activity
                        className="mt-[3px] size-3.5 shrink-0 text-[var(--s-faint)]"
                        aria-hidden="true"
                      />
                      <p className="text-[12.5px] leading-[1.45] text-[var(--s-dim)]">
                        <span className="font-semibold text-[var(--s-text)]">{entry.who}</span>{" "}
                        {entry.what}{" "}
                        <span className="font-medium text-[var(--s-text)]">{entry.target}</span>
                        <span className="wk-tabnum text-[var(--s-faint)]"> · {entry.when}</span>
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--s-faint)]">
                Conversations
              </p>
              <ul className="mt-2.5 grid gap-1.5 sm:grid-cols-3">
                {CONVERSATIONS.map((conversation) => (
                  <li
                    key={conversation.id}
                    className="rounded-[10px] border border-[var(--s-line)] px-3 py-2.5"
                  >
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[13px] font-semibold">
                        {conversation.name}
                      </span>
                      {conversation.unread > 0 ? (
                        <span className="wk-tabnum ml-auto grid size-4.5 shrink-0 place-items-center rounded-full bg-[#3541c4] px-1 text-[10.5px] font-bold text-white">
                          {conversation.unread}
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-0.5 block truncate text-[11.5px] text-[var(--s-faint)]">
                      {conversation.preview}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Drawer
            open={openItem !== null}
            onClose={() => setOpenItem(null)}
            title={openItem?.title ?? ""}
            subtitle={openItem?.project}
          >
            {openItem ? (
              <div className="flex flex-col gap-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Chip tone={STATE_CHIP[openItem.state].tone}>
                    {STATE_CHIP[openItem.state].label}
                  </Chip>
                  <Chip tone="neutral" icon={<Clock aria-hidden="true" />}>
                    {openItem.due}
                  </Chip>
                </div>

                <div className="flex items-center gap-3 rounded-[11px] border border-[var(--s-line)] px-3.5 py-3">
                  <PersonAvatar personId={openItem.personId} size={34} />
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-semibold">
                      {PEOPLE[openItem.personId]?.name}
                    </p>
                    <p className="text-[12px] text-[var(--s-faint)]">
                      {PEOPLE[openItem.personId]?.role}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--s-faint)]">
                    What happened
                  </p>
                  <div className="mt-3">
                    <Timeline
                      steps={TASK_TIMELINE.slice(0, 4)}
                      reachedUpTo={openItem.state === "waiting" ? 1 : 3}
                    />
                  </div>
                </div>

                <p className="flex items-start gap-2 rounded-[10px] bg-[var(--s-sub)] px-3.5 py-3 text-[12.5px] leading-[1.5] text-[var(--s-dim)]">
                  <AlertTriangle
                    className="mt-[2px] size-3.5 shrink-0 text-[#c98a1e]"
                    aria-hidden="true"
                  />
                  If this is not accepted by the deadline, it comes back to you automatically.
                </p>
              </div>
            ) : null}
          </Drawer>
        </AppWindow>
      </div>
    </Stage>
  );
}
