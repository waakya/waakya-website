import "server-only";

import type { OutboundWhatsApp, SendOutcome, WhatsAppProvider } from "../types";
import { mockSent } from "../email";

/** Records the send and answers as a provider would. Never reaches a phone. */
export function mockWhatsAppProvider(): WhatsAppProvider {
  return {
    name: "mock-whatsapp",
    async send(message: OutboundWhatsApp): Promise<SendOutcome> {
      mockSent.whatsapp.push(message);
      console.info(`[messaging:whatsapp] mock — would send template ${message.templateName} to +${message.to}`);
      return { ok: true, providerMessageId: `mock-wa-${Date.now()}`, provider: "mock-whatsapp", mocked: true };
    },
  };
}
