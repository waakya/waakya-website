import Link from "next/link";
import { Plus, UserPlus } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Bell } from "@/components/waakya/bell";
import { getDictionary, type Locale } from "@/lib/i18n";
import { getDesign } from "@/lib/i18n/design";
import type { DayCounters, NeedsYou } from "@/lib/tasks/counters";
import type { TaskListItem } from "@/lib/tasks/queries";
import type { AttendanceDay, TeamAttendanceRow } from "@/lib/attendance/queries";
import { formatIndianDate } from "@/lib/tasks/format-date";
import { OwnerHeader } from "./owner-header";
import { AttentionList } from "./attention";
import { TodayBands } from "./today-bands";
import { type TeamPulse } from "./team-today";

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
  canSeeHistory = false,
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
  /** Whether "Everything that happened" (the audit history) is open to this person. */
  canSeeHistory?: boolean;
}) {
  const t = getDictionary(locale);
  const d = getDesign(locale);
  const now = new Date(nowIso);
  // With nobody to give work to, "New task" is a dead end: the one primary
  // is inviting the team (V3 review).
  const primary =
    staff.length === 0
      ? { href: "/staff", label: d.v3.inviteFirst, icon: UserPlus }
      : { href: "/naya", label: t.create.newTask, icon: Plus };


  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <div className="lg:hidden">
        <OwnerHeader locale={locale} orgName={orgName} ownerName={personName} counters={counters} unread={unread} now={now} />
      </div>

      <main className="flex-1 px-4 pt-6 pb-32 lg:px-10 lg:pt-10 lg:pb-14">
        <div className="mx-auto max-w-6xl">
          <header className="hidden items-start gap-4 lg:flex">
            <div className="min-w-0 flex-1">
              <h1 className="text-title font-bold text-fg">
                {personName ? t.lists.greeting(personName) : t.lists.aajHeading}
              </h1>
              <p className="num mt-0.5 text-body-sm text-fg-subtle">
                {formatIndianDate(now, locale)} · {orgName}
              </p>
            </div>
            <Link href={primary.href} className={buttonVariants()}>
              <primary.icon />
              {primary.label}
            </Link>
            <Bell locale={locale} unread={unread} />
          </header>

          {guide ? <div className="mb-8 lg:mt-6">{guide}</div> : null}

          <div className="lg:mt-8">
            {manages ? (
              <TodayBands
                locale={locale}
                orgId={orgId}
                userId={userId}
                attention={attention}
                waiting={waiting}
                done={done}
                staff={staff}
                teamAttendance={teamAttendance}
                myToday={myToday}
                showPunch={showPunch}
                canSeeHistory={canSeeHistory}
                nowIso={nowIso}
              />
            ) : (
              <AttentionList locale={locale} orgId={orgId} userId={userId} manages={manages} attention={attention} nowIso={nowIso} />
            )}
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
