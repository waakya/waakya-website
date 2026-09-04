import type { Metadata } from "next";
import { requireOrg, canManage } from "@/lib/auth/session";
import { getMyTasks, getOrgTasks } from "@/lib/tasks/queries";
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
    const tasks = await getOrgTasks(viewer.org.id, viewer.org.ackMinutes);
    return (
      <OwnerToday
        tasks={tasks}
        locale={viewer.org.language}
        orgName={viewer.org.name}
        ownerName={viewer.fullName}
        nowIso={now.toISOString()}
      />
    );
  }

  const tasks = await getMyTasks(
    viewer.org.id,
    viewer.userId,
    viewer.org.ackMinutes,
  );
  return (
    <StaffToday
      tasks={tasks}
      locale={viewer.org.language}
      orgName={viewer.org.name}
      staffName={viewer.fullName}
      nowIso={now.toISOString()}
    />
  );
}
