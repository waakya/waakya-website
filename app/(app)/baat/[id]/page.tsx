import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireOrg, canManage } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { AppShell } from "@/components/waakya/app-shell";
import { getConversation } from "@/lib/conversations/queries";
import { getOrgMembers } from "@/lib/org/members";
import { Thread } from "./thread";

export const metadata: Metadata = { title: "Baat-cheet" };

/** One conversation: what was said, and the work it produced. */
export default async function ConversationPage({
  params,
}: PageProps<"/baat/[id]">) {
  const { id } = await params;
  const viewer = await requireOrg();
  const locale = await getLocale();
  const t = getDictionary(locale);

  const [conversation, members] = await Promise.all([
    getConversation(viewer.org.id, id, viewer.userId),
    getOrgMembers(viewer.org.id),
  ]);

  if (!conversation) notFound();

  return (
    <AppShell
      locale={locale}
      variant={canManage(viewer.role) ? "owner" : "staff"}
      orgName={viewer.org.name}
      personName={viewer.fullName ?? "—"}
      roleLabel={viewer.role ? t.org.roles[viewer.role] : ""}
      unread={0}
    >
      <Thread
        locale={locale}
        conversationId={conversation.id}
        title={conversation.title}
        messages={conversation.messages}
        members={members.map((member) => ({
          userId: member.userId,
          name: member.name,
        }))}
      />
    </AppShell>
  );
}
