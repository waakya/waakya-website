import type { Metadata } from "next";
import { Users } from "lucide-react";

import { requireOrg, canManage } from "@/lib/auth/session";
import { getOrgMembers } from "@/lib/org/members";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { StateChip } from "@/components/ui/state-chip";
import { AppShell } from "@/components/waakya/app-shell";
import { InviteSheet } from "./invite-sheet";
import { PendingInvites } from "./pending-invites";
import { getLocale } from "@/lib/i18n/server";
import { getTeamToday } from "@/lib/attendance/queries";
import { getOrgTasks } from "@/lib/tasks/queries";
import { getPhase1 } from "@/lib/i18n/phase1";
import { formatPunchTime } from "@/lib/attendance/time";

export const metadata: Metadata = { title: "Staff" };

export default async function StaffPage() {
  const viewer = await requireOrg();
  const locale = await getLocale();
  const t = getDictionary(locale);

  const supabase = await createClient();
  const [members, { data: invites }] = await Promise.all([
    getOrgMembers(viewer.org.id),
    supabase
      .from("invites")
      .select("id, full_name, phone, token, created_at")
      .eq("org_id", viewer.org.id)
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false }),
  ]);

  const manages = canManage(viewer.role);
  const p1 = getPhase1(locale);
  const [team, tasks] = manages
    ? await Promise.all([getTeamToday(viewer.org.id), getOrgTasks(viewer.org.id, viewer.org.ackMinutes)])
    : [[], []];
  const today = new Map(team.map((row) => [row.userId, row]));
  const openWork = new Map<string, number>();
  for (const task of tasks) {
    if (!task.assigneeId || ["verified", "cancelled"].includes(task.state)) continue;
    openWork.set(task.assigneeId, (openWork.get(task.assigneeId) ?? 0) + 1);
  }

  return (
    <AppShell
      locale={locale}
      variant={canManage(viewer.role) ? "owner" : "staff"}
      orgName={viewer.org.name}
      personName={viewer.fullName ?? "—"}
      roleLabel={viewer.role ? getDictionary(locale).org.roles[viewer.role] : ""}
      unread={0}
    >
      <main className="flex-1 p-4 pb-6">
        <h1 className="text-[24px] leading-[30px] font-bold text-ink-900">
          {t.org.teamTitle}
        </h1>
        <p className="num mt-0.5 text-[15px] text-ink-500">
          {viewer.org.name} · {t.org.teamSubtitle(members.length)}
        </p>

        <ul aria-label={t.org.teamTitle} className="mt-5 flex flex-col gap-2">
          {members.map((member) => (
            <li key={member.userId}>
              <Card className="flex min-h-16 items-center gap-3 p-3.5 shadow-none">
              <Avatar name={member.name} size={40} />
              <div className="min-w-0 flex-1">
                <p className="text-[15px] leading-[20px] font-bold text-ink-900">
                  {member.name}
                  {member.userId === viewer.userId ? (
                    <span className="font-normal text-ink-500"> · {t.org.you}</span>
                  ) : null}
                </p>
                {member.phone ? (
                  <p className="num text-[13px] text-ink-500">{member.phone}</p>
                ) : null}
                {manages ? (
                  <p className="num text-[13px] text-ink-500" data-testid="team-status">
                    {(() => {
                      const row = today.get(member.userId);
                      if (!row) return p1.team.notIn;
                      if (row.status === "leave") return p1.team.onLeave;
                      if (row.punchInAt && row.punchOutAt)
                        return `${formatPunchTime(row.punchInAt)} – ${formatPunchTime(row.punchOutAt)}`;
                      if (row.punchInAt) return `${p1.team.inToday} · ${formatPunchTime(row.punchInAt)}`;
                      return p1.team.notIn;
                    })()}
                    {" · "}
                    {p1.team.openWork(openWork.get(member.userId) ?? 0)}
                  </p>
                ) : null}
              </div>
                <StateChip tone={member.role === "owner" ? "neel" : "muted"}>
                  {t.org.roles[member.role]}
                </StateChip>
              </Card>
            </li>
          ))}
        </ul>

        {members.length === 1 && !invites?.length ? (
          <div className="mt-6 flex flex-col items-center gap-2 rounded-card border border-dashed border-paper-300 p-6 text-center">
            <Users className="size-7 text-ink-400" aria-hidden="true" />
            <p className="text-[17px] font-bold text-ink-900">{t.org.noStaffYet}</p>
            <p className="text-[15px] leading-[20px] text-ink-500">
              {t.org.noStaffHelp}
            </p>
          </div>
        ) : null}

        {invites?.length ? (
          <PendingInvites locale={locale} invites={invites} canManage={manages} />
        ) : null}
      </main>

      {manages ? (
        <div className="sticky bottom-16 z-20 px-4 pb-3">
          <InviteSheet locale={locale} />
        </div>
      ) : null}

    </AppShell>
  );
}
