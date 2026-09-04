import type { Metadata } from "next";
import { Users } from "lucide-react";

import { requireOrg, canManage } from "@/lib/auth/session";
import { getOrgMembers } from "@/lib/org/members";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { StateChip } from "@/components/ui/state-chip";
import { BottomNav } from "@/components/vaakya/bottom-nav";
import { InviteSheet } from "./invite-sheet";
import { PendingInvites } from "./pending-invites";
import { getLocale } from "@/lib/i18n/server";

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

  return (
    <div className="flex min-h-dvh flex-col">
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

      <BottomNav locale={locale} variant="owner" />
    </div>
  );
}
