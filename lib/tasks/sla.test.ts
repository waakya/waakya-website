import { describe, expect, it } from "vitest";
import {
  AMBER_AT,
  LAAL_AT,
  REMINDER_FRACTIONS,
  ackDeadline,
  clock,
  formatDuration,
  minutes,
  percent,
  reminderTimes,
  toneFor,
} from "./sla";

const UNITS = { minShort: "min", hourShort: "gh", dayShort: "din" };

/** 10:00 IST, as the screens show it. */
const START = new Date("2026-09-04T04:30:00.000Z");
const at = (minutesLater: number) =>
  new Date(START.getTime() + minutesLater * 60_000);

describe("the clock", () => {
  const endsAt = at(100);

  it("starts at zero and Neel", () => {
    const c = clock({ startedAt: START, endsAt, now: START });
    expect(c.progress).toBe(0);
    expect(c.tone).toBe("neel");
    expect(c.breached).toBe(false);
  });

  it("stays Neel below half", () => {
    expect(clock({ startedAt: START, endsAt, now: at(49) }).tone).toBe("neel");
  });

  it("turns Amber exactly at 50%", () => {
    const c = clock({ startedAt: START, endsAt, now: at(50) });
    expect(c.progress).toBeCloseTo(AMBER_AT);
    expect(c.tone).toBe("amber");
  });

  it("turns Laal exactly at 90%", () => {
    const c = clock({ startedAt: START, endsAt, now: at(90) });
    expect(c.progress).toBeCloseTo(LAAL_AT);
    expect(c.tone).toBe("laal");
  });

  it("is Laal and breached past the end", () => {
    const c = clock({ startedAt: START, endsAt, now: at(140) });
    expect(c.breached).toBe(true);
    expect(c.tone).toBe("laal");
    expect(minutes(c.remainingMs)).toBe(-40);
  });

  it("never reports more than 100% spent", () => {
    expect(clock({ startedAt: START, endsAt, now: at(1000) }).progress).toBe(1);
  });

  it("stops where it was met and turns green", () => {
    const met = clock({
      startedAt: START,
      endsAt,
      metAt: at(3),
      now: at(500),
    });
    expect(met.tone).toBe("hara");
    expect(met.progress).toBeCloseTo(0.03);
    expect(met.breached).toBe(false);
  });

  it("stays Laal when it was met late", () => {
    const met = clock({
      startedAt: START,
      endsAt,
      metAt: at(140),
      now: at(500),
    });
    expect(met.tone).toBe("laal");
    expect(met.breached).toBe(true);
  });

  it("is inert when it has no window", () => {
    for (const input of [
      { startedAt: null, endsAt, now: START },
      { startedAt: START, endsAt: null, now: START },
      { startedAt: endsAt, endsAt: START, now: START },
      { startedAt: "not a date", endsAt, now: START },
    ]) {
      const c = clock(input);
      expect(c.progress).toBe(0);
      expect(c.tone).toBe("neel");
      expect(c.breached).toBe(false);
    }
  });

  it("accepts ISO strings as well as Dates", () => {
    const fromStrings = clock({
      startedAt: START.toISOString(),
      endsAt: endsAt.toISOString(),
      now: at(50),
    });
    expect(fromStrings.tone).toBe("amber");
  });
});

describe("the tone rule", () => {
  it("is amber only at or past half, red only at or past 90% or breached", () => {
    expect(toneFor(0, false)).toBe("neel");
    expect(toneFor(0.4999, false)).toBe("neel");
    expect(toneFor(0.5, false)).toBe("amber");
    expect(toneFor(0.8999, false)).toBe("amber");
    expect(toneFor(0.9, false)).toBe("laal");
    expect(toneFor(1, false)).toBe("laal");
    // Breached wins whatever the fraction says.
    expect(toneFor(0.1, true)).toBe("laal");
  });
});

describe("the acknowledge deadline", () => {
  it("is delivery plus the SLA in minutes", () => {
    expect(ackDeadline(START, 5)).toEqual(at(5));
    expect(ackDeadline(START, 15)).toEqual(at(15));
  });

  it("is nothing at all before the task is delivered", () => {
    expect(ackDeadline(null, 15)).toBeNull();
  });
});

describe("reminders", () => {
  it("fall at 50% and 90% of the window", () => {
    expect(REMINDER_FRACTIONS).toEqual([0.5, 0.9]);
    expect(reminderTimes(START, at(100))).toEqual([at(50), at(90)]);
  });

  it("are absolute instants, so a late job still owes the earlier one", () => {
    const [half, ninety] = reminderTimes(START, at(100));
    const jobRanAt = at(95);
    const due = [half, ninety].filter((t) => t <= jobRanAt);
    expect(due).toEqual([half, ninety]);
  });

  it("are empty without a window", () => {
    expect(reminderTimes(null, at(100))).toEqual([]);
    expect(reminderTimes(START, null)).toEqual([]);
    expect(reminderTimes(at(100), START)).toEqual([]);
  });
});

describe("durations, written the way the screens write them", () => {
  it("shows minutes below an hour", () => {
    expect(formatDuration(40 * 60_000, UNITS)).toBe("40 min");
    expect(formatDuration(59 * 60_000, UNITS)).toBe("59 min");
  });

  it("shows hours and minutes above an hour", () => {
    expect(formatDuration(130 * 60_000, UNITS)).toBe("2 gh 10 min");
    expect(formatDuration(120 * 60_000, UNITS)).toBe("2 gh");
  });

  it("shows days beyond a day", () => {
    expect(formatDuration(26 * 60 * 60_000, UNITS)).toBe("1 din 2 gh");
    expect(formatDuration(48 * 60 * 60_000, UNITS)).toBe("2 din");
  });

  it("writes a negative span as a magnitude — 'Late 40 min', never '-40'", () => {
    expect(formatDuration(-40 * 60_000, UNITS)).toBe("40 min");
    expect(formatDuration(-130 * 60_000, UNITS)).toBe("2 gh 10 min");
  });

  it("uses Latin digits", () => {
    expect(formatDuration(130 * 60_000, UNITS)).not.toMatch(/[०-९]/);
  });
});

describe("percent", () => {
  it("rounds for the label and clamps to 0–100", () => {
    expect(percent(0.62)).toBe(62);
    expect(percent(0)).toBe(0);
    expect(percent(1)).toBe(100);
    expect(percent(1.4)).toBe(100);
    expect(percent(-2)).toBe(0);
  });
});

describe("minutes", () => {
  it("rounds away from zero so a late task never reads as on time", () => {
    expect(minutes(90_000)).toBe(2);
    expect(minutes(-90_000)).toBe(-2);
    expect(minutes(0)).toBe(0);
  });
});
