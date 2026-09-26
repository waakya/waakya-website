import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import type { NotifyChannel, NotifyMessage, ChannelOutcome } from "../types";

/**
 * The in-app inbox — a row in `notifications`, which the bell reads.
 *
 * This is the channel that must not fail: it is the record. Email is best
 * effort on top of it.
 *
 * The row is written by `push_user_notification` (migration 0030), never by a
 * direct insert: the function signs the sender, checks that the recipient is
 * in the same business, keeps the link inside the app and namespaces a
 * member's dedupe key so nobody can pre-empt somebody else's reminder.
 */
export function inAppChannel(
  client: SupabaseClient<Database>,
): NotifyChannel {
  return {
    name: "in_app",
    async send(message: NotifyMessage): Promise<ChannelOutcome> {
      const { data, error } = await client.rpc("push_user_notification", {
        p_org: message.orgId,
        p_user: message.userId,
        p_event: message.event,
        p_body: message.body,
        p_task: message.taskId ?? undefined,
        p_href: message.href ?? undefined,
        p_dedupe: message.dedupeKey ?? undefined,
      });

      if (error) return { ok: false, error: error.code ?? "insert_failed" };
      if (data === "duplicate") return { ok: true, skipped: "duplicate" };
      if (data === "no_recipient") return { ok: true, skipped: "no_address" };
      return { ok: true };
    },
  };
}
