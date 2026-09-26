/**
 * Outbound messages to people outside the business: customers and leads.
 * Providers sit behind these two interfaces; nothing else in the app knows
 * which one is live. Automated QA never sends a real message: the mock
 * provider is the default outside production configuration.
 */
export interface OutboundEmail {
  to: string;
  subject: string;
  text: string;
  html?: string;
  /** Collapses retries of the same send at the provider. */
  idempotencyKey?: string;
}

export interface OutboundWhatsApp {
  /** E.164 without the plus, as providers want it. */
  to: string;
  /** The provider-approved template name; free text is not allowed. */
  templateName: string;
  language: string;
  parameters: string[];
  idempotencyKey?: string;
}

export type SendOutcome =
  | { ok: true; providerMessageId: string | null; provider: string; mocked?: boolean }
  | { ok: false; error: string; provider: string; retryable: boolean };

export interface EmailProvider {
  readonly name: string;
  send(message: OutboundEmail): Promise<SendOutcome>;
}

export interface WhatsAppProvider {
  readonly name: string;
  send(message: OutboundWhatsApp): Promise<SendOutcome>;
}
