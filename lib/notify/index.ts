import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { inAppChannel } from "./channels/in-app";
import { emailChannel } from "./channels/email";
import type {
  NotifyChannel,
  NotifyMessage,
  NotifyResult,
} from "./types";

export * from "./types";
export { writeMessage, writeSubject, type MessageContext } from "./messages";

/**
 * Tell somebody something, over every channel that is configured.
 *
 * Callers never name a channel. Adding WhatsApp means adding one entry here
 * (CLAUDE.md §2.7) and touching nothing else.
 *
 * Channels are independent: a failing email never loses the in-app record, and
 * the result reports each one so a caller that cares can look.
 */
export async function notify(
  message: NotifyMessage,
  channels: NotifyChannel[],
): Promise<NotifyResult> {
  const results = await Promise.all(
    channels.map(async (channel) => {
      try {
        return [channel.name, await channel.send(message)] as const;
      } catch {
        return [channel.name, { ok: false, error: "threw" }] as const;
      }
    }),
  );

  const outcomes = Object.fromEntries(results);
  return {
    outcomes,
    delivered: results.some(([, outcome]) => outcome.ok),
  };
}

/** In-app plus email. The email channel no-ops when Resend is not configured. */
export function defaultChannels(
  client: SupabaseClient<Database>,
): NotifyChannel[] {
  return [inAppChannel(client), emailChannel()];
}

/** The common case: notify over the default channels for this client. */
export async function notifyWith(
  client: SupabaseClient<Database>,
  message: NotifyMessage,
): Promise<NotifyResult> {
  return notify(message, defaultChannels(client));
}
