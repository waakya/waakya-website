import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import { getOrgMembers } from "@/lib/org/members";

/**
 * Reads for internal conversations.
 *
 * Row level security limits every one of these to conversations the reader is
 * actually in, so none of them re-filters by user. Names come from the org
 * member list rather than a join: `messages.author_id` points at `auth.users`,
 * which PostgREST cannot join to `profiles`, and a team is small.
 */

export interface ConversationSummary {
  id: string;
  kind: "direct" | "group";
  /** The other person for a direct chat, or the group's title. */
  title: string;
  lastMessageAt: string;
  preview: string | null;
  unread: number;
}

export interface Message {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
  mine: boolean;
}

export interface ConversationDetail {
  id: string;
  kind: "direct" | "group";
  title: string;
  messages: Message[];
  participantIds: string[];
}

/** Every conversation this person is in, most recently active first. */
export const listConversations = cache(
  async (orgId: string, userId: string): Promise<ConversationSummary[]> => {
    const supabase = await createClient();

    const { data: rows } = await supabase
      .from("conversations")
      .select("id, kind, title, last_message_at")
      .eq("org_id", orgId)
      .order("last_message_at", { ascending: false })
      .limit(40);

    if (!rows?.length) return [];
    const ids = rows.map((row) => row.id);

    const [{ data: participants }, { data: recent }, members] = await Promise.all([
      supabase
        .from("conversation_participants")
        .select("conversation_id, user_id, last_read_at")
        .in("conversation_id", ids),
      supabase
        .from("messages")
        .select("conversation_id, body, created_at")
        .in("conversation_id", ids)
        .order("created_at", { ascending: false })
        .limit(400),
      getOrgMembers(orgId),
    ]);

    const nameOf = new Map(members.map((member) => [member.userId, member.name]));

    // The other side of a direct chat, and when I last read each one.
    const others = new Map<string, string>();
    const myLastRead = new Map<string, string | null>();
    for (const row of participants ?? []) {
      if (row.user_id === userId) myLastRead.set(row.conversation_id, row.last_read_at);
      else if (!others.has(row.conversation_id)) others.set(row.conversation_id, row.user_id);
    }

    const latest = new Map<string, { body: string; at: string }>();
    const unread = new Map<string, number>();
    for (const message of recent ?? []) {
      if (!latest.has(message.conversation_id)) {
        latest.set(message.conversation_id, {
          body: message.body,
          at: message.created_at,
        });
      }
      const readAt = myLastRead.get(message.conversation_id) ?? null;
      if (!readAt || message.created_at > readAt) {
        unread.set(message.conversation_id, (unread.get(message.conversation_id) ?? 0) + 1);
      }
    }

    return rows.map((row) => ({
      id: row.id,
      kind: row.kind as "direct" | "group",
      title:
        row.kind === "group"
          ? (row.title ?? "Group")
          : (nameOf.get(others.get(row.id) ?? "") ?? "Someone"),
      lastMessageAt: row.last_message_at,
      preview: latest.get(row.id)?.body ?? null,
      unread: unread.get(row.id) ?? 0,
    }));
  },
);

/** One conversation and its messages, oldest first. */
export const getConversation = cache(
  async (
    orgId: string,
    conversationId: string,
    userId: string,
  ): Promise<ConversationDetail | null> => {
    const supabase = await createClient();

    const { data: conversation } = await supabase
      .from("conversations")
      .select("id, kind, title")
      .eq("id", conversationId)
      .maybeSingle();
    if (!conversation) return null;

    const [{ data: participants }, { data: rows }, members] = await Promise.all([
      supabase
        .from("conversation_participants")
        .select("user_id")
        .eq("conversation_id", conversationId),
      supabase
        .from("messages")
        .select("id, author_id, body, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(200),
      getOrgMembers(orgId),
    ]);

    const nameOf = new Map(members.map((member) => [member.userId, member.name]));
    const participantIds = (participants ?? []).map((row) => row.user_id);
    const other = participantIds.find((id) => id !== userId);

    return {
      id: conversation.id,
      kind: conversation.kind as "direct" | "group",
      title:
        conversation.kind === "group"
          ? (conversation.title ?? "Group")
          : (nameOf.get(other ?? "") ?? "Someone"),
      participantIds,
      messages: (rows ?? []).map((row) => ({
        id: row.id,
        authorId: row.author_id,
        authorName: nameOf.get(row.author_id) ?? "Someone",
        body: row.body,
        createdAt: row.created_at,
        mine: row.author_id === userId,
      })),
    };
  },
);
