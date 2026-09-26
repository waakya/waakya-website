import Link from "next/link";
import { ArrowRight, ChevronDown, Plus, UserPlus } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Bell } from "@/components/waakya/bell";
import { Ticks } from "@/components/waakya/ticks";
import { getDictionary, type Locale } from "@/lib/i18n";
import { getDesign } from "@/lib/i18n/design";
import type { DayCounters, NeedsYou } from "@/lib/tasks/counters";
import type { TaskListItem } from "@/lib/tasks/queries";
import type { AttendanceDay, TeamAttendanceRow } from "@/lib/attendance/queries";
import { formatIndianDate } from "@/lib/tasks/format-date";
import { rowMeta } from "@/lib/tasks/present";
import { ticksFor } from "@/lib/tasks/state-machine";
import { cn } from "@/lib/utils";
import { OwnerHeader } from "./owner-header";
import { AttentionList } from "./attention";
import { PunchLine } from "./punch-line";
import { TeamToday, type TeamPulse } from "./team-today";

/**
 * Today for the people who run the business (V3 — attention first).
 *
 * One question per region, in the order they are asked: what needs me (one
 * list, decided in place), who is on and who is behind, what got finished.
 * Everything else — the whole list of work, projects, documents — is one tap
 * away and no longer competes here. One primary action: New task.
 *
 * One tree at every width: the phone keeps the kit's Neel header with its
 * counters; a desk gets the same numbers as a single quiet line.
 */
export function OwnerHome({
  locale,
  orgId,
  userId,
  manages,
  orgName,
  personName,
  counters,
  attention,
  done,
  waiting,
  hasAnyWork,
  staff,
  teamAttendance,
  myToday,
  unread,
  nowIso,
  guide,
  showPunch = true,
}: {
  locale: Locale;
  orgId: string;
  userId: string;
  manages: boolean;
  orgName: string;
  personName: string | null;
  counters: DayCounters;
  attention: NeedsYou[];
  done: TaskListItem[];
  /** Open work that does not need this person — who they are waiting on. */
  waiting: TaskListItem[];
  hasAnyWork: boolean;
  staff: TeamPulse[];
  teamAttendance: TeamAttendanceRow[];
  myToday: AttendanceDay | null;
  unread: number;
  nowIso: string;
  guide?: React.ReactNode;
  showPunch?: boolean;
}) {
  const t = getDictionary(locale);
  const d = getDesign(locale);
  const now = new Date(nowIso);
  const hasWork = hasAnyWork;
  // With nobody to give work to, "New task" is a dead end: the one primary
  // is inviting the team (V3 review).
  const primary =
    staff.length === 0
      ? { href: "/staff", label: d.v3.inviteFirst, icon: UserPlus }
      : { href: "/naya", label: t.create.newTask, icon: Plus };

  const tally: { label: string; value: number; tone?: "laal" | "amber" }[] = [
    { label: t.lists.bheje, value: counters.bheje },
    { label: t.lists.dekhe, value: counters.dekhe },
    { label: t.lists.hoGaye, value: counters.hoGaye },
    { label: t.lists.verifiedCount, value: counters.verified },
    { label: t.chips.late, value: counters.late, tone: counters.late > 0 ? "laal" : undefined },
    { label: t.chips.dekhaNahi, value: counters.dekhaNahi, tone: counters.dekhaNahi > 0 ? "amber" : undefined },
  ];

  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <div className="lg:hidden">
        <OwnerHeader locale={locale} orgName={orgName} ownerName={personName} counters={counters} unread={unread} now={now} />
      </div>

      <main className="flex-1 px-4 pt-5 pb-32 lg:px-10 lg:pt-10 lg:pb-12">
        <div className="mx-auto max-w-5xl">
          <header className="hidden items-start gap-4 lg:flex">
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-[30px] leading-tight font-extrabold text-fg">
                {personName ? t.lists.greeting(personName) : t.lists.aajHeading}
              </h1>
              <p className="num mt-1 text-body text-fg-subtle">
                {formatIndianDate(now, locale)} · {orgName}
              </p>
            </div>
            <Link href={primary.href} className={buttonVariants()}>
              <primary.icon />
              {primary.label}
            </Link>
            <Bell locale={locale} unread={unread} />
          </header>

          {/* The day's numbers, read as one line of words — not six cards. */}
          {hasWork ? (
            <ul aria-label={d.today.dayStrip} className="num mt-3 hidden flex-wrap gap-x-5 gap-y-1 text-body-sm text-fg-subtle lg:flex">
              <li aria-hidden="true" className="font-semibold text-fg-muted">{d.today.dayStrip}:</li>
              {tally.map((item) => (
                <li key={item.label} className={cn(item.tone === "laal" && "text-laal-700", item.tone === "amber" && "text-amber-700")}>
                  <span className={cn("font-semibold", item.tone ? "" : "text-fg")}>{item.value}</span> <span>{item.label}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {guide ? <div className="mt-6">{guide}</div> : null}

          <div className="mt-4 lg:mt-8 lg:grid lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start lg:gap-12">
            <div className="min-w-0">
              {/* Managers punch in like everyone else; owners rarely do, so for
                  them the line would only be noise (Attendance is under More). */}
              {showPunch ? <PunchLine locale={locale} today={myToday} /> : null}
              <div className={showPunch ? "mt-3" : ""}>
                <AttentionList locale={locale} orgId={orgId} userId={userId} manages={manages} attention={attention} nowIso={nowIso} />
              </div>

              {waiting.length > 0 ? (
                <section className="mt-8">
                  <h2 className="mb-2 text-body-lg font-bold text-fg">
                    {d.v3.waiting} <span className="num font-normal text-fg-subtle">{waiting.length}</span>
                  </h2>
                  <ul aria-label={d.v3.waiting} className="divide-y divide-line">
                    {waiting.slice(0, 5).map((task) => {
                      const ticks = ticksFor(task.state);
                      return (
                        <li key={task.id}>
                          <Link href={`/kaam/${task.id}`} className="flex items-center gap-3 py-2.5 transition-colors duration-150 hover:bg-paper-50/70">
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-body text-fg">{task.title}</span>
                              {/* The state in words, never the glyph alone (D-03). */}
                              <span className="num block truncate text-caption text-fg-subtle">
                                {rowMeta(task, { now, locale, viewer: "owner" }, task.assigneeName)}
                              </span>
                            </span>
                            {ticks ? <Ticks state={ticks} locale={locale} size={16} /> : null}
                          </Link>
                        </li>
                      );
                    })}
                    {waiting.length > 5 ? (
                      <li>
                        <Link href="/work?need=waiting" className="num flex min-h-11 items-center gap-1.5 text-label font-semibold text-neel-700 hover:text-neel-800">
                          {d.v3.moreOf(waiting.length - 5)} · {d.v3.waiting}
                          <ArrowRight className="size-3.5" aria-hidden="true" />
                        </Link>
                      </li>
                    ) : null}
                  </ul>
                </section>
              ) : null}

              {done.length > 0 ? (
                <details className="group mt-6">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-body font-semibold text-fg-muted">
                    {d.v3.doneToday}
                    <span className="num font-normal text-fg-subtle">{done.length}</span>
                    <ChevronDown className="ml-auto size-4 text-fg-subtle transition-transform duration-150 group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <ul aria-label={t.lists.hoGayaSection} className="mt-1 divide-y divide-line">
                    {done.map((task) => {
                      const ticks = ticksFor(task.state);
                      return (
                        <li key={task.id}>
                          <Link href={`/kaam/${task.id}`} className="flex items-center gap-3 py-2.5 hover:bg-paper-50/70">
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-body-sm text-fg">{task.title}</span>
                              <span className="num block truncate text-caption text-fg-subtle">
                                {rowMeta(task, { now, locale, viewer: "owner" }, task.assigneeName)}
                              </span>
                            </span>
                            {ticks ? <Ticks state={ticks} locale={locale} size={16} /> : null}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </details>
              ) : null}

              <Link href="/work" className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-body font-semibold text-neel-700 hover:text-neel-800">
                {d.v3.allWork}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>

            <aside className="mt-8 lg:mt-0" aria-label={d.v3.teamToday}>
              <h2 className="mb-2 text-body-lg font-bold text-fg">{d.v3.teamToday}</h2>
              <TeamToday locale={locale} staff={staff} attendance={teamAttendance} />
              {counters.completionRate !== null && counters.completionRate > 0 ? (
                <p className="num mt-4 text-label text-fg-subtle">
                  {t.lists.completionRate}: <span className="font-semibold text-hara-700">{counters.completionRate}%</span>
                </p>
              ) : null}
            </aside>
          </div>
        </div>
      </main>

      {/* Phone: the one primary, thumb-height (kit D-10). */}
      <div className="sticky bottom-16 z-20 px-4 pb-3 lg:hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-8 h-8 bg-gradient-to-b from-transparent to-paper-50" />
        <Link href={primary.href} className={buttonVariants({ size: "block", className: "relative shadow-mic" })}>
          <primary.icon />
          {primary.label}
        </Link>
      </div>
    </div>
  );
}
