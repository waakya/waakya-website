import type { Locale } from "@/lib/i18n";

/**
 * Everything Waakya ever tells somebody. The list is closed on purpose: a new
 * kind of message is a decision, not a string someone adds in passing.
 */
export type NotifyEvent =
  | "task_assigned"
  | "ack_reminder"
  | "completion_reminder"
  | "not_seen"
  | "overdue"
  | "escalated"
  | "task_done"
  | "task_verified"
  | "reassigned"
  | "cancelled"
  | "sent_back";

export interface NotifyMessage {
  orgId: string;
  /** Who is being told. */
  userId: string;
  event: NotifyEvent;
  taskId?: string | null;
  /** The recipient's language — a message is written for its reader. */
  locale: Locale;
  /** One line, already in the reader's script. */
  body: string;
  /** Where the recipient's inbox is, for the email channel. */
  email?: string | null;
  /** The email subject; the body doubles as the email body. */
  subject?: string;
  /** A link into the app, if the message points at something. */
  url?: string | null;
  /**
   * Makes a resend a no-op. The SLA job keys every reminder by task, kind and
   * window, so a retry after a partial failure cannot double-send.
   */
  dedupeKey?: string | null;
}

export type ChannelOutcome =
  | { ok: true; skipped?: "duplicate" | "not_configured" | "no_address" }
  | { ok: false; error: string };

/**
 * A way of reaching somebody. WhatsApp becomes a third implementation of this
 * and no caller changes (CLAUDE.md §2.7).
 */
export interface NotifyChannel {
  readonly name: "in_app" | "email" | "whatsapp";
  send(message: NotifyMessage): Promise<ChannelOutcome>;
}

export interface NotifyResult {
  /** Per channel, so a failing email never hides a delivered in-app message. */
  outcomes: Record<string, ChannelOutcome>;
  /** True when at least one channel accepted the message. */
  delivered: boolean;
}
