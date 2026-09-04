/**
 * Everything time-shaped happens in Asia/Kolkata, because that is where the
 * business is. Latin digits in every language (D-07), so `Intl` is asked for
 * the `-u-nu-latn` numbering system explicitly rather than trusted to default
 * to it in a Hindi locale.
 */
export const TIME_ZONE = "Asia/Kolkata";

const TIME_FORMAT = new Intl.DateTimeFormat("en-IN-u-nu-latn", {
  timeZone: TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const DAY_FORMAT = new Intl.DateTimeFormat("en-IN-u-nu-latn", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** "5:00 pm" — lower case, as the screens write it. */
export function formatTime(value: string | Date): string {
  return TIME_FORMAT.format(asDate(value)).toLowerCase().replace(/\s+/g, " ");
}

/** "2026-09-04" in Asia/Kolkata, for grouping a day. */
export function dayKey(value: string | Date): string {
  const parts = DAY_FORMAT.formatToParts(asDate(value));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function isToday(value: string | Date, now: Date): boolean {
  return dayKey(value) === dayKey(now);
}

export function isBefore(value: string | Date, now: Date): boolean {
  return asDate(value).getTime() < now.getTime();
}

/**
 * A wall-clock time on a given IST day, as a real instant.
 *
 * Built by measuring the zone's offset at that moment rather than assuming
 * +05:30 forever, so the maths stays right if the rules ever change.
 */
export function atIstTime(
  reference: Date,
  hour: number,
  minute: number,
  dayOffset = 0,
): Date {
  const key = dayKey(new Date(reference.getTime() + dayOffset * 86_400_000));
  const [year, month, day] = key.split("-").map(Number);
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  // `guess` is that wall time read as UTC; correct it by the zone's offset.
  return new Date(guess - istOffsetMs(new Date(guess)));
}

function istOffsetMs(at: Date): number {
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(formatted.find((p) => p.type === type)?.value ?? "0");
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") % 24,
    get("minute"),
    get("second"),
  );
  return asUtc - at.getTime();
}

function asDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}
