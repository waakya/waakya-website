import type { Metadata } from "next";

import { requireOrg, canManage } from "@/lib/auth/session";
import { getMyTasks, getOrgTasks } from "@/lib/tasks/queries";
import { getUnreadCount } from "@/lib/notify/inbox";
import { getOrgMembers } from "@/lib/org/members";
import { getTodayChecklists } from "@/lib/checklists/queries";
import { getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { countDay, needsYou } from "@/lib/tasks/counters";
import { groupBySection } from "@/lib/tasks/sections";
import { isLate } from "@/lib/tasks/present";
import { AppShell } from "@/components/vaakya/app-shell";
import { OwnerToday } from "./owner-today";
import { OwnerDesktop } from "./owner-desktop";
import { NeedsYouList } from "./needs-you-list";
import { StaffToday } from "./staff-today";

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
    const [tasks, unread, members] = await Promise.all([
      getOrgTasks(viewer.org.id, viewer.org.ackMinutes),
      getUnreadCount(),
      getOrgMembers(viewer.org.id),
    ]);

    const phones = Object.fromEntries(
      members.map((member) => [member.userId, member.phone]),
    );
    const counters = countDay(tasks, now);
    const attention = needsYou(tasks, now);
    const groups = groupBySection(tasks, now);
    const live = [
      ...groups.late,
      ...groups.naya,
      ...groups.aaj,
      ...groups.later,
    ];

    // Who is carrying what today — the right rail on a wide screen.
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
          done: theirs.filter((task) =>
            ["done", "verified"].includes(task.state),
          ).length,
          late: theirs.filter((task) => isLate(task, now)).length,
        };
      });

    const needsYouCards = (
      <NeedsYouList
        locale={locale}
        attention={attention}
        phones={phones}
        nowIso={now.toISOString()}
        columns
      />
    );

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
        <OwnerToday
          tasks={tasks}
          locale={locale}
          orgName={viewer.org.name}
          ownerName={viewer.fullName}
          nowIso={now.toISOString()}
          unread={unread}
          phones={phones}
        />
        <OwnerDesktop
          locale={locale}
          orgName={viewer.org.name}
          ownerName={viewer.fullName}
          counters={counters}
          attention={attention}
          live={live}
          done={groups.done}
          staff={staff}
          unread={unread}
          nowIso={now.toISOString()}
          phones={phones}
        >
          {needsYouCards}
        </OwnerDesktop>
      </AppShell>
    );
  }

  const [tasks, unread] = await Promise.all([
    getMyTasks(viewer.org.id, viewer.userId, viewer.org.ackMinutes),
    getUnreadCount(),
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
        nowIso={now.toISOString()}
        unread={unread}
        checklists={await getTodayChecklists(viewer.org.id, tasks, now)}
      />
    </AppShell>
  );
}
