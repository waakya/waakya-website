import type { Metadata } from "next";
import { MessageSquare } from "lucide-react";

import { requireOrg, canManage } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n";
import { getDesign } from "@/lib/i18n/design";
import { shellFor } from "@/lib/auth/shell";
import { AppShell } from "@/components/waakya/app-shell";
import { ConversationList } from "@/components/waakya/conversation-list";
import { listConversations } from "@/lib/conversations/queries";
import { getOrgMembers } from "@/lib/org/members";
import { StartConversation } from "./start-conversation";

export const metadata: Metadata = { title: "Baat-cheet" };

/**
 * Every conversation this person is in, and a way to start another. On a desk
 * the list is a pane and the right side waits for a thread to open.
 */
export default async function BaatPage() {
  const viewer = await requireOrg();
  const shell = await shellFor(viewer);
  const locale = shell.locale;
  const t = getDictionary(locale);
  const d = getDesign(locale);

  const [conversations, members] = await Promise.all([
    listConversations(viewer.org.id, viewer.userId),
    getOrgMembers(viewer.org.id),
  ]);

  const others = members.filter((member) => member.userId !== viewer.userId);

  return (
    <AppShell {...shell} width="full">
      <div className="flex min-h-0 flex-1 lg:h-dvh">
        <main className="flex min-h-0 w-full flex-col p-4 pb-8 lg:w-96 lg:shrink-0 lg:overflow-y-auto lg:border-r lg:border-line lg:px-5 lg:pt-6">
          <h1 className="text-title font-bold text-fg">{t.baat.title}</h1>

          <div className="mt-4">
            <StartConversation locale={locale} people={others} />
          </div>

          <div className="mt-5">
            <ConversationList
              conversations={conversations}
              locale={locale}
              hasTeam={others.length > 0}
              manages={canManage(viewer.role)}
            />
          </div>
        </main>

        <section
          aria-hidden="true"
          className="hidden flex-1 flex-col items-center justify-center gap-2 px-8 text-center lg:flex"
        >
          <MessageSquare className="size-8 text-line-strong" />
          <p className="text-body-lg font-bold text-fg-muted">{d.thread.pickConversation}</p>
          <p className="max-w-xs text-body text-fg-subtle">{d.thread.pickConversationHelp}</p>
        </section>
      </div>
    </AppShell>
  );
}
