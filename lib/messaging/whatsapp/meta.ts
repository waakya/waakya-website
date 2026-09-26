import "server-only";

import type { OutboundWhatsApp, SendOutcome, WhatsAppProvider } from "../types";

/**
 * WhatsApp Cloud API (Meta), template messages only — the official route for
 * business-initiated conversations. Needs WHATSAPP_ACCESS_TOKEN and
 * WHATSAPP_PHONE_NUMBER_ID; templates must already be approved in the
 * business's WhatsApp Manager under the given names.
 */
export function metaWhatsAppProvider(): WhatsAppProvider {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const version = process.env.WHATSAPP_API_VERSION ?? "v21.0";
  return {
    name: "meta",
    async send(message: OutboundWhatsApp): Promise<SendOutcome> {
      if (!token || !phoneId) return { ok: false, error: "not_configured", provider: "meta", retryable: false };
      try {
        const response = await fetch(`https://graph.facebook.com/${version}/${phoneId}/messages`, {
          method: "POST",
          headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: message.to,
            type: "template",
            template: {
              name: message.templateName,
              language: { code: message.language },
              components: message.parameters.length
                ? [{ type: "body", parameters: message.parameters.map((text) => ({ type: "text", text })) }]
                : [],
            },
          }),
        });
        const body = (await response.json().catch(() => null)) as { messages?: { id: string }[]; error?: { message?: string; code?: number } } | null;
        if (!response.ok) {
          return { ok: false, error: `meta_${response.status}${body?.error?.code ? `_${body.error.code}` : ""}`, provider: "meta", retryable: response.status >= 500 || response.status === 429 };
        }
        return { ok: true, providerMessageId: body?.messages?.[0]?.id ?? null, provider: "meta" };
      } catch {
        return { ok: false, error: "network", provider: "meta", retryable: true };
      }
    },
  };
}
