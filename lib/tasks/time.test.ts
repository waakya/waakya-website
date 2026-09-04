import { describe, expect, it } from "vitest";
import { atIstTime, dayKey, formatTime, isToday } from "./time";
import { resolvePreset } from "./deadlines";

/**
 * Asia/Kolkata is +05:30, so a UTC instant and an IST day rarely agree. These
 * tests pin the cases where a naive implementation goes wrong: late evening
 * UTC is already tomorrow in India, and "Aaj 5 pm" after 5 pm is a trap.
 */
describe("Asia/Kolkata", () => {
  it("writes the time the way the screens do", () => {
    expect(formatTime("2026-09-04T11:30:00.000Z")).toBe("5:00 pm");
    expect(formatTime("2026-09-04T04:32:00.000Z")).toBe("10:02 am");
  });

  it("uses Latin digits, not Devanagari", () => {
    expect(formatTime("2026-09-04T11:30:00.000Z")).not.toMatch(/[०-९]/);
  });

  it("puts 20:00 UTC on the next Indian day", () => {
    // 20:00 UTC on the 4th is 01:30 on the 5th in Kolkata.
    expect(dayKey("2026-09-04T20:00:00.000Z")).toBe("2026-09-05");
    expect(dayKey("2026-09-04T18:00:00.000Z")).toBe("2026-09-04");
  });

  it("compares days in Kolkata, not in UTC", () => {
    const now = new Date("2026-09-04T20:00:00.000Z"); // already the 5th in IST
    expect(isToday("2026-09-05T04:00:00.000Z", now)).toBe(true);
    expect(isToday("2026-09-04T12:00:00.000Z", now)).toBe(false);
  });

  it("builds a wall-clock time as a real instant", () => {
    const now = new Date("2026-09-04T04:30:00.000Z"); // 10:00 IST
    expect(atIstTime(now, 17, 0).toISOString()).toBe("2026-09-04T11:30:00.000Z");
    expect(atIstTime(now, 9, 0, 1).toISOString()).toBe("2026-09-05T03:30:00.000Z");
  });
});

describe("the deadline chips", () => {
  const morning = new Date("2026-09-04T04:30:00.000Z"); // 10:00 IST

  it("gives 'one hour' exactly an hour", () => {
    expect(resolvePreset("one_hour", morning).toISOString()).toBe(
      "2026-09-04T05:30:00.000Z",
    );
  });

  it("gives 'today 5 pm' today when it is still morning", () => {
    expect(resolvePreset("today_evening", morning).toISOString()).toBe(
      "2026-09-04T11:30:00.000Z",
    );
  });

  it("rolls 'today 5 pm' to tomorrow once 5 pm has passed", () => {
    // A deadline in the past is a trap, not a shortcut.
    const evening = new Date("2026-09-04T13:00:00.000Z"); // 18:30 IST
    expect(resolvePreset("today_evening", evening).toISOString()).toBe(
      "2026-09-05T11:30:00.000Z",
    );
  });

  it("gives 'tomorrow morning' 9 am the next Indian day", () => {
    expect(resolvePreset("tomorrow_morning", morning).toISOString()).toBe(
      "2026-09-05T03:30:00.000Z",
    );
  });

  it("reckons 'tomorrow' from the Indian day, not the UTC one", () => {
    // 20:00 UTC on the 4th is already the 5th in India, so tomorrow is the 6th.
    const lateUtc = new Date("2026-09-04T20:00:00.000Z");
    expect(resolvePreset("tomorrow_morning", lateUtc).toISOString()).toBe(
      "2026-09-06T03:30:00.000Z",
    );
  });

  it("never resolves a preset into the past", () => {
    for (const now of [
      new Date("2026-09-04T04:30:00.000Z"),
      new Date("2026-09-04T13:00:00.000Z"),
      new Date("2026-09-04T20:00:00.000Z"),
    ]) {
      for (const preset of ["one_hour", "today_evening", "tomorrow_morning"] as const) {
        expect(
          resolvePreset(preset, now).getTime(),
          `${preset} at ${now.toISOString()}`,
        ).toBeGreaterThan(now.getTime());
      }
    }
  });
});
