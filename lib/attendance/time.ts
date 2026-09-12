/**
 * The working day, and how long it lasted.
 *
 * Attendance is the one module where the date itself is the record, so the
 * rule from `lib/tasks/time.ts` matters more here than anywhere: a working day
 * is an Asia/Kolkata day. Somebody punching in at ten past midnight is
 * starting that IST date, not the UTC date that is still yesterday.
 *
 * Every date decision in attendance comes through this file, and the database
 * agrees with it via `ist_today()`.
 */
import { TIME_ZONE, dayKey } from "@/lib/tasks/time";

export { TIME_ZONE };

/** "2026-09-13" — the working day a moment belongs to. */
export function workDate(value: Date | string = new Date()): string {
  return dayKey(value);
}

/** The first and last working day of the month a date falls in. */
export function monthRange(value: Date | string = new Date()): {
  start: string;
  end: string;
} {
  const [year, month] = workDate(value).split("-").map(Number);
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    start: `${year}-${pad(month)}-01`,
    end: `${year}-${pad(month)}-${pad(last)}`,
  };
}

/**
 * "8h 38m" — worked time between two punches.
 *
 * Returns null while somebody is still working, because a running total that
 * only updates on refresh reads as a stale fact rather than a live one.
 */
export function workedDuration(
  punchIn: string | null,
  punchOut: string | null,
): string | null {
  if (!punchIn || !punchOut) return null;
  const ms = new Date(punchOut).getTime() - new Date(punchIn).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  return formatDuration(ms);
}

/** Milliseconds as "8h 38m", or "38m" under an hour. */
export function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

/** "13 Sep" for a working day string, in Latin digits. */
export function formatWorkDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN-u-nu-latn", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

/** "9:43 AM" from a timestamp, in IST. */
export function formatPunchTime(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN-u-nu-latn", {
    timeZone: TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(new Date(value))
    .toUpperCase()
    .replace(/\s+/g, " ");
}
