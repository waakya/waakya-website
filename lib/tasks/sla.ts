/**
 * SLA maths. Pure: every function takes an explicit `now`, so the tests do not
 * depend on the wall clock and the reminder job is reproducible.
 *
 * Two clocks per task (Design Direction §5.3):
 *   the acknowledge clock, from delivery to the ack SLA, and
 *   the completion clock, from delivery to `due_at`.
 *
 * Both fill Neel, turn Amber at 50% and Laal at 90% — which is exactly when
 * the assignee was reminded, so what the owner sees matches what the staff
 * member felt.
 */

/** The two moments a reminder goes out, as a fraction of the window. */
export const REMINDER_FRACTIONS = [0.5, 0.9] as const;

export const AMBER_AT = 0.5;
export const LAAL_AT = 0.9;

export type ClockTone = "neel" | "amber" | "laal" | "hara";

export interface Clock {
  /** 0 before it starts, 1 once the window is spent. */
  progress: number;
  /** Milliseconds left; negative once it is breached. */
  remainingMs: number;
  breached: boolean;
  /** `hara` once the clock was met and stopped. */
  tone: ClockTone;
}

export interface ClockInput {
  startedAt: string | Date | null;
  endsAt: string | Date | null;
  /** When the clock stopped, if it did — acknowledgement, or completion. */
  metAt?: string | Date | null;
  now: Date;
}

/**
 * A clock's state at `now`.
 *
 * A clock that was met stops where it stopped and turns green; it never
 * creeps into amber afterwards.
 */
export function clock({ startedAt, endsAt, metAt, now }: ClockInput): Clock {
  const start = toMs(startedAt);
  const end = toMs(endsAt);

  if (start === null || end === null || end <= start) {
    return { progress: 0, remainingMs: 0, breached: false, tone: "neel" };
  }

  const met = toMs(metAt);
  const at = met ?? now.getTime();
  const span = end - start;
  const elapsed = at - start;
  const progress = clamp(elapsed / span, 0, 1);
  const remainingMs = end - at;
  const breached = remainingMs < 0;

  if (met !== null) {
    return {
      progress,
      remainingMs,
      breached,
      tone: breached ? "laal" : "hara",
    };
  }

  return { progress, remainingMs, breached, tone: toneFor(progress, breached) };
}

export function toneFor(progress: number, breached: boolean): ClockTone {
  if (breached || progress >= LAAL_AT) return "laal";
  if (progress >= AMBER_AT) return "amber";
  return "neel";
}

/** When the ack clock ends: delivery plus the task's or the org's SLA. */
export function ackDeadline(
  deliveredAt: string | Date | null,
  ackMinutes: number,
): Date | null {
  const start = toMs(deliveredAt);
  if (start === null) return null;
  return new Date(start + ackMinutes * 60_000);
}

/**
 * The exact instants a reminder is due, for one window.
 *
 * The job compares these against `now` rather than recomputing a percentage,
 * so a run that is late still sends the reminder it owes instead of skipping
 * it — and each one is keyed, so a retry never double-sends.
 */
export function reminderTimes(
  startedAt: string | Date | null,
  endsAt: string | Date | null,
): Date[] {
  const start = toMs(startedAt);
  const end = toMs(endsAt);
  if (start === null || end === null || end <= start) return [];
  const span = end - start;
  return REMINDER_FRACTIONS.map((f) => new Date(start + span * f));
}

/** Whole minutes, rounded away from zero, for display and for "Late 40 min". */
export function minutes(ms: number): number {
  return ms < 0 ? -Math.round(-ms / 60_000) : Math.round(ms / 60_000);
}

/**
 * A duration in the reader's script, using Latin digits in every language
 * (D-07) and the short forms the screens use: "2 gh 10 min", "40 min", "3 din".
 */
export function formatDuration(
  ms: number,
  units: { minShort: string; hourShort: string; dayShort: string },
): string {
  const total = Math.abs(minutes(ms));
  if (total < 60) return `${total} ${units.minShort}`;

  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (hours < 24) {
    return mins === 0
      ? `${hours} ${units.hourShort}`
      : `${hours} ${units.hourShort} ${mins} ${units.minShort}`;
  }

  const days = Math.floor(hours / 24);
  const leftoverHours = hours % 24;
  return leftoverHours === 0
    ? `${days} ${units.dayShort}`
    : `${days} ${units.dayShort} ${leftoverHours} ${units.hourShort}`;
}

/** Percentage for the clock label: "62% gaya". */
export function percent(progress: number): number {
  return Math.round(clamp(progress, 0, 1) * 100);
}

function toMs(value: string | Date | null | undefined): number | null {
  if (!value) return null;
  const ms = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
