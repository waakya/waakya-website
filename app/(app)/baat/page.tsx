import type { Metadata } from "next";
import Link from "next/link";
import { MessageSquare, UserPlus } from "lucide-react";

import { requireOrg, canManage } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n";
import { shellFor } from "@/lib/auth/shell";
import { getUx } from "@/lib/i18n/ux";
import { AppShell } from "@/components/waakya/app-shell";
import { Avatar } from "@/components/ui/avatar";
import { listConversations } from "@/lib/conversations/queries";
import { getOrgMembers } from "@/lib/org/members";
import { formatPunchTime } from "@/lib/attendance/time";
import { StartConversation } from "./start-conversation";

export const metadata: Metadata = { title: "Baat-cheet" };

/** Every conversation this person is in, and a way to start another. */
export default async function BaatPage() {
  const viewer = await requireOrg();
  const shell = await shellFor(viewer);
  const locale = shell.locale;
  const t = getDictionary(locale);
  const ux = getUx(locale);

  const [conversations, members] = await Promise.all([
    listConversations(viewer.org.id, viewer.userId),
    getOrgMembers(viewer.org.id),
  ]);

  const others = members.filter((member) => member.userId !== viewer.userId);

  return (
    <AppShell {...shell}>
      <main className="flex-1 p-4 pb-8">
        <h1 className="text-[24px] leading-[30px] font-bold text-ink-900">
          {t.baat.title}
        </h1>

        <div className="mt-4">
          <StartConversation locale={locale} people={others} />
        </div>

        {conversations.length === 0 && others.length === 0 ? (
          // Nobody to talk to yet: say why, and lead to the one step that fixes it.
          <div className="mt-6 flex flex-col items-center gap-2 rounded-card border border-dashed border-paper-300 p-6 text-center">
            <UserPlus className="size-7 text-ink-400" aria-hidden="true" />
            <p className="text-[17px] font-bold text-ink-900">{ux.team.noTeamYet}</p>
            <p className="max-w-sm text-[15px] leading-[20px] text-ink-500">{ux.team.noTeamHelp}</p>
            {canManage(viewer.role) ? (
              <Link href="/staff" className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-button bg-neel-600 px-4 text-[15px] font-semibold text-white hover:bg-neel-700">
                <UserPlus className="size-4" aria-hidden="true" />
                {ux.team.invite}
              </Link>
            ) : null}
          </div>
        ) : conversations.length === 0 ? (
          <div className="mt-6 flex flex-col items-center gap-2 rounded-card border border-dashed border-paper-300 p-6 text-center">
            <MessageSquare className="size-7 text-ink-400" aria-hidden="true" />
            <p className="text-[17px] font-bold text-ink-900">{t.baat.empty}</p>
            <p className="text-[15px] leading-[20px] text-ink-500">{t.baat.emptyHelp}</p>
          </div>
        ) : (
          <ul className="mt-5 overflow-hidden rounded-card border border-paper-200 bg-paper-0">
            {conversations.map((conversation) => (
              <li key={conversation.id} className="border-b border-paper-100 last:border-b-0">
                <Link
                  href={`/baat/${conversation.id}`}
                  className="flex items-center gap-3 px-3.5 py-3"
                >
                  <Avatar name={conversation.title} size={34} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold text-ink-900">
                      {conversation.title}
                    </span>
                    <span className="block truncate text-[13px] text-ink-500">
                      {conversation.preview ?? "—"}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <span className="num text-[12px] text-ink-400">
                      {formatPunchTime(conversation.lastMessageAt)}
                    </span>
                    {conversation.unread > 0 ? (
                      <span className="num grid size-5 place-items-center rounded-full bg-neel-600 text-[11px] font-bold text-white">
                        {conversation.unread}
                      </span>
                    ) : null}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </AppShell>
  );
}
