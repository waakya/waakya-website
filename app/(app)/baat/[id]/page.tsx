import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireOrg, canManage } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { AppShell } from "@/components/waakya/app-shell";
import { getUnreadCount } from "@/lib/notify/inbox";
import { getConversation, listConversations } from "@/lib/conversations/queries";
import { ConversationList } from "@/components/waakya/conversation-list";
import { getOrgMembers } from "@/lib/org/members";
import { Thread } from "./thread";
import { listMessageDocuments } from "@/lib/documents/queries";
import { createClient } from "@/lib/supabase/server";

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

  // Opening the conversation is reading it: clear its unread count, so the
  // list, the tab badge and Today stop saying it is waiting.
  const supabase = await createClient();
  await Promise.all([
    supabase.rpc("mark_conversation_read", { p_conversation: id }),
    // The "new message" update for this conversation has been seen too.
    supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", viewer.userId)
      .eq("dedupe_key", `msg:${id}:${viewer.userId}`)
      .is("read_at", null),
  ]);

  // Read after marking this one read, so the pane beside it is already true.
  const [attachmentMap, conversations, unread] = await Promise.all([
    listMessageDocuments(
      viewer.org.id,
      conversation.messages.map((message) => message.id),
    ),
    listConversations(viewer.org.id, viewer.userId),
    getUnreadCount(),
  ]);
  const attachments = Object.fromEntries(
    [...attachmentMap.entries()].map(([messageId, docs]) => [
      messageId,
      docs.map((doc) => ({ id: doc.id, name: doc.name })),
    ]),
  );

  return (
    <AppShell
      locale={locale}
      variant={canManage(viewer.role) ? "owner" : "staff"}
      orgName={viewer.org.name}
      personName={viewer.fullName ?? "—"}
      roleLabel={viewer.role ? t.org.roles[viewer.role] : ""}
      unread={unread}
      width="full"
    >
      <div className="flex min-h-0 flex-1">
        {/* On a desk the list stays beside the thread, so moving between
            conversations never loses your place. */}
        <aside className="hidden w-96 shrink-0 overflow-y-auto border-r border-line px-5 pt-6 pb-8 lg:block lg:h-dvh">
          <h2 className="mb-4 text-title font-bold text-fg">{t.baat.title}</h2>
          <ConversationList
            conversations={conversations}
            locale={locale}
            activeId={conversation.id}
            hasTeam={members.length > 1}
            manages={canManage(viewer.role)}
          />
        </aside>
      <Thread
        participantCount={conversation.participantIds.length}
        locale={locale}
        conversationId={conversation.id}
        title={conversation.title}
        messages={conversation.messages}
        attachments={attachments}
        isGroup={conversation.kind === "group"}
        members={members.map((member) => ({
          userId: member.userId,
          name: member.name,
        }))}
      />
      </div>
    </AppShell>
  );
}
