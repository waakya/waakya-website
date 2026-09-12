/**
 * Leave arithmetic, kept pure so it can be tested without a database.
 *
 * The database is the authority — `leave_days_between()` counts the days that
 * are actually deducted — but the same rules run here so the screen can show
 * the cost before somebody commits to it, and so the two can be tested against
 * each other.
 *
 * The rule that matters commercially: a full day costs 1.0 and a half day
 * costs 0.5, so one credited day funds two half days.
 */

export type LeaveKind = "full_day" | "half_day";
export type DayHalf = "first_half" | "second_half";
export type LeaveStatus = "pending" | "approved" | "rejected";

export const FULL_DAY = 1;
export const HALF_DAY = 0.5;

/** Every date from start to end inclusive, as working-day strings. */
export function datesBetween(start: string, end: string): string[] {
  const out: string[] = [];
  const from = Date.parse(`${start}T00:00:00Z`);
  const to = Date.parse(`${end}T00:00:00Z`);
  if (!Number.isFinite(from) || !Number.isFinite(to) || to < from) return out;
  for (let t = from; t <= to; t += 86_400_000) {
    out.push(new Date(t).toISOString().slice(0, 10));
  }
  return out;
}

/**
 * What a request will cost, in days.
 *
 * Holidays inside the range are free, because the office was shut anyway.
 * A half day is always exactly one date and always 0.5.
 */
export function leaveDaysFor(
  kind: LeaveKind,
  start: string,
  end: string,
  holidays: readonly string[] = [],
): number {
  if (kind === "half_day") return HALF_DAY;
  const shut = new Set(holidays);
  return datesBetween(start, end).filter((date) => !shut.has(date)).length * FULL_DAY;
}

/** Whether a balance can fund a request. */
export function canAfford(balanceDays: number, requestedDays: number): boolean {
  return requestedDays > 0 && balanceDays >= requestedDays;
}

/** "1.5 days", "1 day", "half day" — how a balance reads on screen. */
export function formatDays(days: number): string {
  if (days === HALF_DAY) return "half day";
  if (days === FULL_DAY) return "1 day";
  const rounded = Math.round(days * 2) / 2;
  return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)} days`;
}

/** Requests move in half days; anything finer is a mistake somewhere. */
export function isHalfDayStep(days: number): boolean {
  return Number.isFinite(days) && days * 2 === Math.floor(days * 2);
}

/** Refuse a range that runs backwards, or a half day spread over two dates. */
export function validateRange(
  kind: LeaveKind,
  start: string,
  end: string,
): { ok: true } | { ok: false; reason: string } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
    return { ok: false, reason: "Choose the dates for this leave." };
  }
  if (end < start) {
    return { ok: false, reason: "The last day is before the first day." };
  }
  if (kind === "half_day" && start !== end) {
    return { ok: false, reason: "A half day covers one date." };
  }
  return { ok: true };
}
