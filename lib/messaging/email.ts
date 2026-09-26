import "server-only";

import type { EmailProvider, OutboundEmail, SendOutcome } from "./types";

/** Resend over fetch, or a mock that records what it would have sent. */
export function resendProvider(): EmailProvider {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM ?? "Waakya <onboarding@resend.dev>";
  if (!apiKey || process.env.MESSAGING_MOCK === "true") return mockEmailProvider();
  return {
    name: "resend",
    async send(message: OutboundEmail): Promise<SendOutcome> {
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            authorization: `Bearer ${apiKey}`,
            "content-type": "application/json",
            ...(message.idempotencyKey ? { "idempotency-key": message.idempotencyKey } : {}),
          },
          body: JSON.stringify({ from, to: [message.to], subject: message.subject, text: message.text, ...(message.html ? { html: message.html } : {}) }),
        });
        if (!response.ok) return { ok: false, error: `resend_${response.status}`, provider: "resend", retryable: response.status >= 500 || response.status === 429 };
        const body = (await response.json().catch(() => null)) as { id?: string } | null;
        return { ok: true, providerMessageId: body?.id ?? null, provider: "resend" };
      } catch {
        return { ok: false, error: "network", provider: "resend", retryable: true };
      }
    },
  };
}

export const mockSent: { email: OutboundEmail[]; whatsapp: import("./types").OutboundWhatsApp[] } = { email: [], whatsapp: [] };

export function mockEmailProvider(): EmailProvider {
  return {
    name: "mock-email",
    async send(message: OutboundEmail): Promise<SendOutcome> {
      mockSent.email.push(message);
      console.info(`[messaging:email] mock — would send "${message.subject}" to ${message.to}`);
      return { ok: true, providerMessageId: `mock-${Date.now()}`, provider: "mock-email", mocked: true };
    },
  };
}
