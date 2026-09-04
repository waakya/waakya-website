import "server-only";

import type { NotifyChannel, NotifyMessage, ChannelOutcome } from "../types";

/**
 * Email through Resend, called over `fetch` rather than the SDK — one endpoint
 * does not justify a dependency.
 *
 * Without a key the channel reports `not_configured` and logs the message it
 * would have sent, so the rest of the app keeps working while B2 is open.
 */
export function emailChannel(): NotifyChannel {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM ?? "Vaakya <onboarding@resend.dev>";

  return {
    name: "email",
    async send(message: NotifyMessage): Promise<ChannelOutcome> {
      if (!message.email) return { ok: true, skipped: "no_address" };

      if (!apiKey) {
        console.info(
          `[notify:email] not configured — would send "${message.event}" to ${message.email}`,
        );
        return { ok: true, skipped: "not_configured" };
      }

      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            authorization: `Bearer ${apiKey}`,
            "content-type": "application/json",
            // Resend honours this to collapse retries of the same send.
            ...(message.dedupeKey
              ? { "idempotency-key": message.dedupeKey }
              : {}),
          },
          body: JSON.stringify({
            from,
            to: [message.email],
            subject: message.subject ?? message.body,
            text: message.url ? `${message.body}\n\n${message.url}` : message.body,
          }),
        });

        if (!response.ok) {
          return { ok: false, error: `resend_${response.status}` };
        }
        return { ok: true };
      } catch {
        // The network is not the user's problem: the in-app record still stands.
        return { ok: false, error: "network" };
      }
    },
  };
}
