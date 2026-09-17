import type { Metadata } from "next";

import { requireOrg, canManage } from "@/lib/auth/session";
import Link from "next/link";
import { CalendarClock } from "lucide-react";

import { shellFor } from "@/lib/auth/shell";
import { getUx } from "@/lib/i18n/ux";
import { AppShell } from "@/components/waakya/app-shell";
import { formatIndianDate } from "@/lib/tasks/format-date";
import {
  getHolidays,
  getMyLeaveBalance,
  getMyLeaveRequests,
  getMyMonth,
  getMyToday,
  getPendingLeave,
  getTeamBalances,
  getTeamToday,
} from "@/lib/attendance/queries";
import { getOrgMembers } from "@/lib/org/members";
import { PunchCard } from "./punch-card";
import { MonthHistory } from "./month-history";
import { LeavePanel } from "./leave-panel";
import { TeamPanel } from "./team-panel";

export const metadata: Metadata = { title: "Hazri" };

/**
 * Attendance.
 *
 * One screen answers the two questions people actually have: am I marked in
 * today, and how much leave do I have left. Managers get the same screen with
 * the team underneath, so nobody learns a second place to look.
 */
export default async function HazriPage() {
  const viewer = await requireOrg();
  const shell = await shellFor(viewer);
  const locale = shell.locale;
  const ux = getUx(locale);
  const manages = canManage(viewer.role);

  const [today, month, balance, myRequests, holidays] = await Promise.all([
    getMyToday(viewer.org.id, viewer.userId),
    getMyMonth(viewer.org.id, viewer.userId),
    getMyLeaveBalance(viewer.org.id, viewer.userId),
    getMyLeaveRequests(viewer.org.id, viewer.userId),
    getHolidays(viewer.org.id),
  ]);

  const [team, pending, balances, members] = manages
    ? await Promise.all([
        getTeamToday(viewer.org.id),
        getPendingLeave(viewer.org.id),
        getTeamBalances(viewer.org.id),
        getOrgMembers(viewer.org.id),
      ])
    : [[], [], [], []];

  const names = new Map(members.map((member) => [member.userId, member.name]));

  return (
    <AppShell {...shell}>
      <main className="flex-1 p-4 pb-8">
        <h1 className="text-[24px] leading-[30px] font-bold text-ink-900">
          {ux.nav.attendance}
        </h1>
        <p className="mt-0.5 text-[15px] leading-[20px] text-ink-500">
          {formatIndianDate(new Date(), locale)}
        </p>

        {/* Leave and holidays live further down this page; say so up front. */}
        <nav aria-label={ux.nav.attendance} className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[14px] font-semibold">
          <a href="#leave" className="text-neel-700 hover:underline">{ux.attendance.sectionLeave}</a>
          <a href={manages ? "#holidays" : "#leave"} className="text-neel-700 hover:underline">{ux.attendance.sectionHolidays}</a>
          {manages ? <a href="#team" className="text-neel-700 hover:underline">{ux.attendance.sectionTeam}</a> : null}
        </nav>

        {manages && pending.length > 0 ? (
          <Link
            href="#leave-requests"
            className="mt-4 flex items-center gap-2 rounded-card border border-amber-600/40 bg-amber-100 px-4 py-3 text-[15px] font-semibold text-amber-700"
          >
            <CalendarClock className="size-5 shrink-0" aria-hidden="true" />
            {ux.attendance.pendingCount(pending.length)}
          </Link>
        ) : null}

        <div className="mt-5">
          <PunchCard locale={locale} today={today} />
        </div>

        <div className="mt-6">
          <LeavePanel
            locale={locale}
            balance={balance}
            requests={myRequests}
            holidays={holidays}
          />
        </div>

        <div className="mt-6">
          <MonthHistory locale={locale} days={month} />
        </div>

        {manages ? (
          <div id="team" className="mt-8 scroll-mt-4 border-t border-paper-200 pt-6">
            <TeamPanel
              locale={locale}
              team={team}
              pending={pending}
              balances={balances}
              holidays={holidays}
              names={Object.fromEntries(names)}
            />
          </div>
        ) : null}
      </main>
    </AppShell>
  );
}
