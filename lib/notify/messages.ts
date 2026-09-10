import type { Locale } from "@/lib/i18n";
import type { NotifyEvent } from "./types";

/**
 * The words Waakya uses when it tells somebody something.
 *
 * Voice: the good munshi (Character document §2.5). Names before verbs —
 * "Raju ne dekh liya", never "Task acknowledged". The owner is the sender to
 * staff; the product never speaks as "Waakya" to them. One line, no
 * exclamation marks, no emoji.
 */
export interface MessageContext {
  /** The person who caused this — usually the owner, sometimes the assignee. */
  actor: string;
  /** The task title, quoted in the line. */
  task: string;
  /** A time or duration, already formatted with Latin digits. */
  when?: string;
}

type Writer = (context: MessageContext) => string;

const MESSAGES: Record<Locale, Record<NotifyEvent, Writer>> = {
  hi: {
    task_assigned: ({ actor, task, when }) =>
      `${actor} ने नया काम भेजा: "${task}"${when ? ` · ${when} तक` : ""}`,
    ack_reminder: ({ task, when }) =>
      `"${task}" अभी बाकी है${when ? ` · ${when} बचा` : ""}`,
    completion_reminder: ({ task, when }) =>
      `"${task}" का समय पास आ रहा है${when ? ` · ${when} बचा` : ""}`,
    not_seen: ({ actor, task }) => `${actor} ने "${task}" अभी तक नहीं देखा`,
    overdue: ({ task, when }) =>
      `"${task}" लेट हो गया${when ? ` · ${when}` : ""}`,
    escalated: ({ actor, task }) => `"${task}" आप तक आया है · ${actor}`,
    task_seen: ({ actor, task }) => `${actor} ने "${task}" देख लिया`,
    task_done: ({ actor, task }) => `${actor} ने "${task}" कर दिया`,
    task_verified: ({ actor, task }) => `${actor} ने "${task}" वेरिफ़ाई कर दिया`,
    reassigned: ({ actor, task }) => `${actor} ने "${task}" आपको दिया`,
    cancelled: ({ actor, task }) => `${actor} ने "${task}" कैंसिल किया`,
    sent_back: ({ actor, task }) => `${actor} ने "${task}" वापस भेजा`,
  },
  "hi-Latn": {
    task_assigned: ({ actor, task, when }) =>
      `${actor} ne naya kaam bheja: "${task}"${when ? ` · ${when} tak` : ""}`,
    ack_reminder: ({ task, when }) =>
      `"${task}" abhi baaki hai${when ? ` · ${when} bacha` : ""}`,
    completion_reminder: ({ task, when }) =>
      `"${task}" ka samay paas aa raha hai${when ? ` · ${when} bacha` : ""}`,
    not_seen: ({ actor, task }) => `${actor} ne "${task}" abhi tak nahi dekha`,
    overdue: ({ task, when }) => `"${task}" late ho gaya${when ? ` · ${when}` : ""}`,
    escalated: ({ actor, task }) => `"${task}" aap tak aaya hai · ${actor}`,
    task_seen: ({ actor, task }) => `${actor} ne "${task}" dekh liya`,
    task_done: ({ actor, task }) => `${actor} ne "${task}" kar diya`,
    task_verified: ({ actor, task }) => `${actor} ne "${task}" verify kar diya`,
    reassigned: ({ actor, task }) => `${actor} ne "${task}" aapko diya`,
    cancelled: ({ actor, task }) => `${actor} ne "${task}" cancel kiya`,
    sent_back: ({ actor, task }) => `${actor} ne "${task}" wapas bheja`,
  },
  en: {
    task_assigned: ({ actor, task, when }) =>
      `${actor} sent new work: "${task}"${when ? ` · by ${when}` : ""}`,
    ack_reminder: ({ task, when }) =>
      `"${task}" is still open${when ? ` · ${when} left` : ""}`,
    completion_reminder: ({ task, when }) =>
      `"${task}" is due soon${when ? ` · ${when} left` : ""}`,
    not_seen: ({ actor, task }) => `${actor} has not seen "${task}" yet`,
    overdue: ({ task, when }) => `"${task}" is late${when ? ` · ${when}` : ""}`,
    escalated: ({ actor, task }) => `"${task}" has come to you · ${actor}`,
    task_seen: ({ actor, task }) => `${actor} has seen "${task}"`,
    task_done: ({ actor, task }) => `${actor} finished "${task}"`,
    task_verified: ({ actor, task }) => `${actor} verified "${task}"`,
    reassigned: ({ actor, task }) => `${actor} gave "${task}" to you`,
    cancelled: ({ actor, task }) => `${actor} cancelled "${task}"`,
    sent_back: ({ actor, task }) => `${actor} sent "${task}" back`,
  },
};

export function writeMessage(
  event: NotifyEvent,
  locale: Locale,
  context: MessageContext,
): string {
  return MESSAGES[locale][event](context);
}

/** The email subject: the business name plus the same line. */
export function writeSubject(orgName: string, body: string): string {
  return `${orgName} · ${body}`;
}
