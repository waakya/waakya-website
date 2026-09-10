import type { TaskPriority, TaskState } from "@/lib/supabase/types";
import { getDictionary, type Locale } from "@/lib/i18n";
import { ticksFor } from "./state-machine";
import { clock, formatDuration, ackDeadline } from "./sla";
import { dayKey, formatTime } from "./time";
import { formatIndianDate } from "./format-date";
import type { TicksState } from "@/components/waakya/ticks";

/**
 * What a task row shows on its right edge, and what its meta line says.
 *
 * Pure, so the rules can be tested rather than eyeballed. Two rules from the
 * Design Direction drive all of it:
 *
 *  - the ticks glyph shows the normal path only; an exception takes its place,
 *    so a row never shows both (D-11); and
 *  - every row states its state in words as well, so nothing depends on colour
 *    or on knowing the ladder (D-03).
 */
export type ChipTone =
  | "neel"
  | "neelSolid"
  | "amber"
  | "laal"
  | "laalSolid"
  | "hara"
  | "outline"
  | "muted";

export type ChipIcon =
  | "clock"
  | "eye-off"
  | "eye"
  | "zap"
  | "alert"
  | "camera"
  | "x"
  | "bell"
  | "swap";

export interface RowChip {
  tone: ChipTone;
  icon: ChipIcon;
  label: string;
}

export type RowStatus =
  | { kind: "ticks"; state: TicksState }
  | { kind: "chip"; chip: RowChip };

export interface TaskForDisplay {
  state: TaskState;
  priority: TaskPriority;
  proofRequired: boolean;
  dueAt: string | null;
  deliveredAt: string | null;
  acknowledgedAt: string | null;
  doneAt: string | null;
  /** The effective acknowledge SLA in minutes — the task's, else the org's. */
  ackMinutes: number;
}

export interface PresentOptions {
  now: Date;
  locale: Locale;
  /** Owners see "Verify baaki"; the assignee does not need telling. */
  viewer: "owner" | "staff";
}

/** True when the completion clock has run out and the work is not finished. */
export function isLate(task: TaskForDisplay, now: Date): boolean {
  if (!task.dueAt) return false;
  if (["done", "verified", "cancelled"].includes(task.state)) return false;
  return Date.parse(task.dueAt) < now.getTime();
}

/** True when the acknowledge SLA passed and nobody has looked at it. */
export function isUnseen(task: TaskForDisplay, now: Date): boolean {
  if (task.state !== "delivered") return false;
  const deadline = ackDeadline(task.deliveredAt, task.ackMinutes);
  return deadline !== null && deadline.getTime() < now.getTime();
}

/**
 * The single thing on the right of a row.
 *
 * Order matters: it answers "what would make the owner act first?" Cancelled
 * ends the story, then Late, then an escalation, then work never looked at,
 * then work waiting to be verified. Only if none of those hold does the row
 * show the glyph.
 */
export function rowStatus(
  task: TaskForDisplay,
  { now, locale, viewer }: PresentOptions,
): RowStatus {
  const t = getDictionary(locale);

  if (task.state === "cancelled") {
    return { kind: "chip", chip: { tone: "muted", icon: "x", label: t.chips.cancelled } };
  }

  if (isLate(task, now)) {
    const overdueBy = now.getTime() - Date.parse(task.dueAt!);
    return {
      kind: "chip",
      chip: {
        tone: "laal",
        icon: "clock",
        label: t.chips.lateBy(formatDuration(overdueBy, t.time)),
      },
    };
  }

  if (task.state === "escalated") {
    // "Escalated to you" is the owner's view; the person who raised it reads "Sent to owner".
    const label = viewer === "staff" ? t.chips.escalatedToOwner : t.chips.escalated;
    return { kind: "chip", chip: { tone: "amber", icon: "bell", label } };
  }

  if (isUnseen(task, now)) {
    return { kind: "chip", chip: { tone: "amber", icon: "eye-off", label: t.chips.dekhaNahi } };
  }

  if (task.state === "done" && viewer === "owner") {
    return { kind: "chip", chip: { tone: "neel", icon: "eye", label: t.chips.verifyBaaki } };
  }

  const ticks = ticksFor(task.state);
  if (ticks) return { kind: "ticks", state: ticks };

  // `reassigned` never rests on a task, but a row should still say something.
  return { kind: "chip", chip: { tone: "muted", icon: "swap", label: t.chips.reassigned } };
}

/**
 * The words under a title. Always includes the state, so the glyph is never
 * the only thing carrying it.
 */
export function rowMeta(
  task: TaskForDisplay,
  { locale, now, viewer }: PresentOptions,
  who?: string,
): string {
  const t = getDictionary(locale);
  const parts: string[] = [];

  if (who) parts.push(who);
  parts.push(
    task.state === "escalated" && viewer === "staff"
      ? t.chips.escalatedToOwner
      : stateWord(task.state, locale),
  );

  if (task.priority === "urgent" && task.state !== "verified") {
    parts.push(t.chips.urgent);
  }
  if (task.proofRequired && !["done", "verified", "cancelled"].includes(task.state)) {
    parts.push(t.chips.photoChahiye);
  }
  if (task.dueAt && !["verified", "cancelled"].includes(task.state)) {
    parts.push(t.time.tak(formatDeadline(task.dueAt, locale, now)));
  }

  return parts.join(" · ");
}

/** The state, in words, in the reader's script. */
export function stateWord(state: TaskState, locale: Locale): string {
  const t = getDictionary(locale);
  switch (state) {
    case "created":
    case "delivered":
      return t.stepper.bheja;
    case "acknowledged":
      return t.stepper.dekha;
    case "accepted":
      return t.stepper.maana;
    case "in_progress":
      return t.stepper.chalRaha;
    case "done":
      return t.stepper.hoGaya;
    case "verified":
      return t.stepper.verified;
    case "escalated":
      return t.chips.escalated;
    case "reassigned":
      return t.chips.reassigned;
    case "cancelled":
      return t.chips.cancelled;
  }
}

/**
 * The two clocks for a task, ready to draw. The ack clock stops when somebody
 * looked; the completion clock stops when the work was done.
 */
export function taskClocks(task: TaskForDisplay, now: Date) {
  return {
    ack: clock({
      startedAt: task.deliveredAt,
      endsAt: ackDeadline(task.deliveredAt, task.ackMinutes),
      metAt: task.acknowledgedAt,
      now,
    }),
    completion: clock({
      startedAt: task.deliveredAt,
      endsAt: task.dueAt,
      metAt: task.doneAt,
      now,
    }),
  };
}

/**
 * The line under an "Aapke liye" headline: when it was sent, then whatever
 * else the card wants to say. It lives here rather than beside the card
 * because the card is a client component and this is called while rendering
 * on the server.
 */
export function needsYouMeta(
  locale: Locale,
  deliveredAt: string | null,
  extra: string[],
): string {
  const t = getDictionary(locale);
  const parts: string[] = [];
  if (deliveredAt) parts.push(`${t.stepper.bheja} ${formatTime(deliveredAt)}`);
  parts.push(...extra);
  return parts.join(" · ");
}


/**
 * A deadline as a person would say it: "5:00 pm" today, "kal 5:00 pm"
 * tomorrow, and "Shukr, 12 Sept · 5:00 pm" beyond that. A bare time for a
 * deadline that is not today is how "by 5:00 pm" came to mean tomorrow.
 */
export function formatDeadline(
  value: string | Date,
  locale: Locale,
  now: Date,
): string {
  const t = getDictionary(locale);
  const time = formatTime(value);
  const target = dayKey(value);
  if (target === dayKey(now)) return time;
  if (target === dayKey(new Date(now.getTime() + 86_400_000))) {
    // Mid-sentence ("by tomorrow 5:00 pm"), so the Latin-script word is lower case.
    const kal = locale === "hi" ? t.time.kal : t.time.kal.toLowerCase();
    return `${kal} ${time}`;
  }
  return `${formatIndianDate(value, locale)} · ${time}`;
}
