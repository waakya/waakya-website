import type { Metadata } from "next";
import { Suspense } from "react";

import { requireOrg, canManage, viewerCan } from "@/lib/auth/session";
import { getMyTasks, getOrgTasks } from "@/lib/tasks/queries";
import { getUnreadCount } from "@/lib/notify/inbox";
import { getOrgMembers } from "@/lib/org/members";
import { getTodayChecklists } from "@/lib/checklists/queries";
import { getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { countDay, countersFromDb, justSentFirst, needsYou, waitingOnTeam } from "@/lib/tasks/counters";
import { createClient } from "@/lib/supabase/server";
import { groupBySection } from "@/lib/tasks/sections";
import { isLate } from "@/lib/tasks/present";
import { AppShell } from "@/components/waakya/app-shell";
import { OwnerHome } from "./owner-home";
import { StaffToday } from "./staff-today";
import { PunchLine } from "./punch-line";
import { AttentionList } from "./attention";
import { SetupGuide } from "./setup-guide";
import { getMyToday, getTeamToday } from "@/lib/attendance/queries";
import { isToday } from "@/lib/tasks/time";

export const metadata: Metadata = { title: "Aaj" };

/**
 * One route, two audiences, every width. An owner sees the business; a staff
 * member sees their own work, on a quieter screen with one thing to do (D-09).
 *
 * Both layouts are rendered from the same data and switched by a Tailwind
 * breakpoint rather than by sniffing the request, so there is one component
 * tree and no separate desktop app.
 */
export default async function AajPage() {
  const viewer = await requireOrg();
  const locale = await getLocale();
  const t = getDictionary(locale);
  const now = new Date();

  if (canManage(viewer.role)) {
    const supabase = await createClient();
    const [tasks, unread, members, myToday, teamAttendance, exact] = await Promise.all([
      getOrgTasks(viewer.org.id, viewer.org.ackMinutes),
      getUnreadCount(),
      getOrgMembers(viewer.org.id),
      getMyToday(viewer.org.id, viewer.userId),
      getTeamToday(viewer.org.id),
      supabase.rpc("org_task_counts", { p_org: viewer.org.id }),
    ]);

    // Exact from the database; the list is only the fallback.
    const counters = countersFromDb(Array.isArray(exact.data) ? exact.data[0] : null, countDay(tasks, now));
    const attention = needsYou(tasks, now);
    const groups = groupBySection(tasks, now);

    // Who is carrying what today, and who is behind.
    const staff = members
      .filter((member) => member.userId !== viewer.userId)
      .map((member) => {
        const theirs = tasks.filter(
          (task) => task.assigneeId === member.userId && task.state !== "cancelled",
        );
        return {
          id: member.userId,
          name: member.name,
          total: theirs.length,
          done: theirs.filter((task) => ["done", "verified"].includes(task.state)).length,
          late: theirs.filter((task) => isLate(task, now)).length,
        };
      });

    return (
      <AppShell
        locale={locale}
        variant="owner"
        orgName={viewer.org.name}
        personName={viewer.fullName ?? viewer.org.name}
        roleLabel={viewer.role ? t.org.roles[viewer.role] : ""}
        unread={unread}
        wide
      >
        <OwnerHome
          locale={locale}
          orgId={viewer.org.id}
          userId={viewer.userId}
          manages
          orgName={viewer.org.name}
          personName={viewer.fullName}
          counters={counters}
          attention={attention}
          // Finished today; work still waiting for verification is already
          // in "Needs you", so it is not listed twice.
          done={groups.done.filter(
            (task) => task.state !== "done" && (task.doneAt ? isToday(task.doneAt, now) : false),
          )}
          waiting={justSentFirst(waitingOnTeam(tasks, now), viewer.userId, now)}
          hasAnyWork={tasks.length > 0}
          staff={staff}
          teamAttendance={teamAttendance}
          myToday={myToday}
          showPunch={viewer.role !== "owner" || Boolean(myToday?.punchInAt)}
          canSeeHistory={viewerCan(viewer, "audit.read")}
          unread={unread}
          nowIso={now.toISOString()}
          guide={
            viewer.role === "owner" || viewer.role === "admin" ? (
              <SetupGuide locale={locale} orgId={viewer.org.id} />
            ) : null
          }
        />
      </AppShell>
    );
  }

  const [tasks, unread, myToday] = await Promise.all([
    getMyTasks(viewer.org.id, viewer.userId, viewer.org.ackMinutes),
    getUnreadCount(),
    getMyToday(viewer.org.id, viewer.userId),
  ]);

  return (
    <AppShell
      locale={locale}
      variant="staff"
      orgName={viewer.org.name}
      personName={viewer.fullName ?? "—"}
      roleLabel={viewer.role ? t.org.roles[viewer.role] : ""}
      unread={unread}
    >
      <StaffToday
        tasks={tasks}
        locale={locale}
        orgName={viewer.org.name}
        staffName={viewer.fullName}
        extra={
          <>
            <PunchLine locale={locale} today={myToday} size="staff" />
            {/* Staff can be approvers too, and they talk all day: whatever
                waits on them outside their own tasks (V3 review). */}
            {/* Streamed: the person's own tasks never wait for these. */}
            <Suspense fallback={null}>
            <div className="mt-4 empty:hidden">
              <AttentionList
                locale={locale}
                orgId={viewer.org.id}
                userId={viewer.userId}
                manages={false}
                attention={[]}
                nowIso={now.toISOString()}
                hideWhenEmpty
              />
            </div>
            </Suspense>
          </>
        }
        nowIso={now.toISOString()}
        unread={unread}
        checklists={await getTodayChecklists(viewer.org.id, tasks, now)}
      />
    </AppShell>
  );
}
