import "server-only";

import { mockEmailProvider, resendProvider } from "./email";
import { metaWhatsAppProvider } from "./whatsapp/meta";
import { mockWhatsAppProvider } from "./whatsapp/mock";
import type { EmailProvider, WhatsAppProvider } from "./types";

export type { EmailProvider, OutboundEmail, OutboundWhatsApp, SendOutcome, WhatsAppProvider } from "./types";

/**
 * Which providers are live. Production names them by environment;
 * everything else (local, preview, automated QA) gets mocks that record the
 * message and never send it.
 */
export function emailProvider(): EmailProvider {
  return process.env.MESSAGING_MOCK === "true" ? mockEmailProvider() : resendProvider();
}

export function whatsappProvider(): WhatsAppProvider {
  if (process.env.MESSAGING_MOCK === "true") return mockWhatsAppProvider();
  return process.env.WHATSAPP_PROVIDER === "meta" ? metaWhatsAppProvider() : mockWhatsAppProvider();
}

export function messagingStatus(): { email: string; whatsapp: string } {
  return { email: emailProvider().name, whatsapp: whatsappProvider().name };
}
