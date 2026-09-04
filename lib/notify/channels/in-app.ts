import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import type { NotifyChannel, NotifyMessage, ChannelOutcome } from "../types";

/**
 * The in-app inbox — a row in `notifications`, which the bell reads.
 *
 * This is the channel that must not fail: it is the record. Email is best
 * effort on top of it.
 */
export function inAppChannel(
  client: SupabaseClient<Database>,
): NotifyChannel {
  return {
    name: "in_app",
    async send(message: NotifyMessage): Promise<ChannelOutcome> {
      const { error } = await client.from("notifications").insert({
        org_id: message.orgId,
        user_id: message.userId,
        event: message.event,
        task_id: message.taskId ?? null,
        body: message.body,
        dedupe_key: message.dedupeKey ?? null,
      });

      // 23505 is the unique index on dedupe_key: this message was already
      // sent, which is a success, not a failure.
      if (error?.code === "23505") return { ok: true, skipped: "duplicate" };
      if (error) return { ok: false, error: error.code ?? "insert_failed" };
      return { ok: true };
    },
  };
}
