import type { Metadata } from "next";

import { requireOrg, canManage } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
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
  const locale = await getLocale();
  const t = getDictionary(locale);
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
    <AppShell
      locale={locale}
      variant={manages ? "owner" : "staff"}
      orgName={viewer.org.name}
      personName={viewer.fullName ?? "—"}
      roleLabel={viewer.role ? t.org.roles[viewer.role] : ""}
      unread={0}
    >
      <main className="flex-1 p-4 pb-8">
        <h1 className="text-[24px] leading-[30px] font-bold text-ink-900">
          {t.nav.hazri}
        </h1>
        <p className="mt-0.5 text-[15px] leading-[20px] text-ink-500">
          {formatIndianDate(new Date(), locale)}
        </p>

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
          <div className="mt-8 border-t border-paper-200 pt-6">
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
