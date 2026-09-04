import type { Metadata } from "next";
import { requireOrg, canManage } from "@/lib/auth/session";
import { getMyTasks, getOrgTasks } from "@/lib/tasks/queries";
import { getUnreadCount } from "@/lib/notify/inbox";
import { OwnerToday } from "./owner-today";
import { StaffToday } from "./staff-today";

export const metadata: Metadata = { title: "Aaj" };

/**
 * One route, two screens. An owner sees the business; a staff member sees
 * their own work, on a quieter screen with one thing to do (D-09).
 */
export default async function AajPage() {
  const viewer = await requireOrg();
  const now = new Date();

  if (canManage(viewer.role)) {
    const [tasks, unread] = await Promise.all([
      getOrgTasks(viewer.org.id, viewer.org.ackMinutes),
      getUnreadCount(),
    ]);
    return (
      <OwnerToday
        tasks={tasks}
        locale={viewer.org.language}
        orgName={viewer.org.name}
        ownerName={viewer.fullName}
        nowIso={now.toISOString()}
        unread={unread}
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
      locale={viewer.org.language}
      orgName={viewer.org.name}
      staffName={viewer.fullName}
      nowIso={now.toISOString()}
      unread={unread}
    />
  );
}
