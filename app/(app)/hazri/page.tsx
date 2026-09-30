import type { Metadata } from "next";

import { requireModule, canManage } from "@/lib/auth/session";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { shellFor } from "@/lib/auth/shell";
import { getUx } from "@/lib/i18n/ux";
import { AppShell } from "@/components/waakya/app-shell";
import { PageHeader } from "@/components/waakya/page";
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
  const viewer = await requireModule("attendance");
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
  // Nobody decides their own leave (the database refuses it), so a
  // manager's own request is neither offered nor counted as waiting on them.
  const pendingForMe = pending.filter((request) => request.userId !== viewer.userId);

  return (
    <AppShell {...shell} width="list">
      <main className="flex-1 p-4 pb-8 lg:px-0">
        <PageHeader title={ux.nav.attendance} description={formatIndianDate(new Date(), locale)} />

        {/* Leave and holidays live further down this page; say so up front. */}
        <nav aria-label={ux.nav.attendance} className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-body-sm font-semibold lg:hidden">
          <a href="#leave" className="text-neel-700 hover:underline">{ux.attendance.sectionLeave}</a>
          <a href={manages ? "#holidays" : "#leave"} className="text-neel-700 hover:underline">{ux.attendance.sectionHolidays}</a>
          {manages ? <a href="#team" className="text-neel-700 hover:underline">{ux.attendance.sectionTeam}</a> : null}
        </nav>

        {manages && pendingForMe.length > 0 ? (
          <p className="relative mt-4 pl-4">
            {/* A decision waiting on you: the attention rule and a verb (Visual V2). */}
            <span aria-hidden="true" className="absolute top-1 bottom-1 left-0 w-[3px] rounded-full bg-neel-600" />
            <Link href="#leave-requests" className="inline-flex min-h-10 items-center gap-1 text-body font-semibold text-neel-700 underline decoration-[1.5px] underline-offset-4 hover:text-neel-800">
              {ux.attendance.pendingCount(pendingForMe.length)}
              <ChevronRight className="size-4 shrink-0" aria-hidden="true" />
            </Link>
          </p>
        ) : null}

        {/* Desktop: you on the left, the team on the right — the manager's
            decisions sit beside their own day instead of under it. */}
        <div className={manages ? "lg:mt-6 lg:grid lg:grid-cols-2 lg:items-start lg:gap-8" : "lg:mt-6 lg:max-w-2xl"}>
          <div className="min-w-0">
            <div className="mt-5 lg:mt-0">
              <PunchCard locale={locale} today={today} />
            </div>

            <div className="mt-6">
              <LeavePanel
                locale={locale}
                balance={balance}
                requests={myRequests}
                holidays={holidays}
                showHolidays={!manages}
              />
            </div>

            <div className="mt-6">
              <MonthHistory locale={locale} days={month} />
            </div>
          </div>

          {manages ? (
            <div id="team" className="mt-8 min-w-0 scroll-mt-4 border-t border-line pt-6 lg:mt-0 lg:border-t-0 lg:pt-0">
              <TeamPanel
                locale={locale}
                team={team}
                pending={pendingForMe}
                balances={balances}
                holidays={holidays}
                names={Object.fromEntries(names)}
              />
            </div>
          ) : null}
        </div>
      </main>
    </AppShell>
  );
}
