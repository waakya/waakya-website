import type { Metadata } from "next";
import { requireOrg, canManage } from "@/lib/auth/session";
import { getLocale } from "@/lib/i18n/server";
import { getMyTasks, getOrgTasks } from "@/lib/tasks/queries";
import { getUnreadCount } from "@/lib/notify/inbox";
import { getOrgMembers } from "@/lib/org/members";
import { getTodayChecklists } from "@/lib/checklists/queries";
import { OwnerToday } from "./owner-today";
import { StaffToday } from "./staff-today";

export const metadata: Metadata = { title: "Aaj" };

/**
 * One route, two screens. An owner sees the business; a staff member sees
 * their own work, on a quieter screen with one thing to do (D-09).
 */
export default async function AajPage() {
  const viewer = await requireOrg();
  const locale = await getLocale();
  const now = new Date();

  if (canManage(viewer.role)) {
    const [tasks, unread, members] = await Promise.all([
      getOrgTasks(viewer.org.id, viewer.org.ackMinutes),
      getUnreadCount(),
      getOrgMembers(viewer.org.id),
    ]);
    return (
      <OwnerToday
        tasks={tasks}
        locale={locale}
        orgName={viewer.org.name}
        ownerName={viewer.fullName}
        nowIso={now.toISOString()}
        unread={unread}
        phones={Object.fromEntries(
          members.map((member) => [member.userId, member.phone]),
        )}
      />
    );
  }

  const [tasks, unread] = await Promise.all([
    getMyTasks(viewer.org.id, viewer.userId, viewer.org.ackMinutes),
    getUnreadCount(),
  ]);
  return (
    <StaffToday
      tasks={tasks}
      locale={locale}
      orgName={viewer.org.name}
      staffName={viewer.fullName}
      nowIso={now.toISOString()}
      unread={unread}
      checklists={await getTodayChecklists(viewer.org.id, tasks, now)}
    />
  );
}
