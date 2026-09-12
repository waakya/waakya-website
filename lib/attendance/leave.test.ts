import { describe, expect, it } from "vitest";

import {
  canAfford,
  datesBetween,
  formatDays,
  isHalfDayStep,
  leaveDaysFor,
  validateRange,
} from "./leave";
import { formatDuration, monthRange, workedDuration } from "./time";

describe("leave arithmetic", () => {
  it("charges a full day 1.0 and a half day 0.5", () => {
    expect(leaveDaysFor("full_day", "2026-09-14", "2026-09-14")).toBe(1);
    expect(leaveDaysFor("half_day", "2026-09-14", "2026-09-14")).toBe(0.5);
  });

  it("lets one credited day fund two half days", () => {
    const balance = 1;
    const first = leaveDaysFor("half_day", "2026-09-14", "2026-09-14");
    const second = leaveDaysFor("half_day", "2026-09-15", "2026-09-15");
    expect(canAfford(balance, first)).toBe(true);
    const afterFirst = balance - first;
    expect(afterFirst).toBe(0.5);
    expect(canAfford(afterFirst, second)).toBe(true);
    expect(afterFirst - second).toBe(0);
  });

  it("counts every date in a range", () => {
    expect(leaveDaysFor("full_day", "2026-09-14", "2026-09-16")).toBe(3);
  });

  it("does not charge for holidays inside the range", () => {
    expect(
      leaveDaysFor("full_day", "2026-09-14", "2026-09-16", ["2026-09-15"]),
    ).toBe(2);
  });

  it("refuses a balance that cannot cover the request", () => {
    expect(canAfford(0.5, 1)).toBe(false);
    expect(canAfford(0, 0.5)).toBe(false);
    expect(canAfford(1, 1)).toBe(true);
  });

  it("keeps everything on half-day steps", () => {
    expect(isHalfDayStep(0.5)).toBe(true);
    expect(isHalfDayStep(4.5)).toBe(true);
    expect(isHalfDayStep(0.25)).toBe(false);
  });

  it("lists the dates in a range, inclusive", () => {
    expect(datesBetween("2026-09-14", "2026-09-16")).toEqual([
      "2026-09-14",
      "2026-09-15",
      "2026-09-16",
    ]);
    expect(datesBetween("2026-09-16", "2026-09-14")).toEqual([]);
  });

  it("refuses a backwards range and a spread half day", () => {
    expect(validateRange("full_day", "2026-09-16", "2026-09-14").ok).toBe(false);
    expect(validateRange("half_day", "2026-09-14", "2026-09-15").ok).toBe(false);
    expect(validateRange("full_day", "2026-09-14", "2026-09-16").ok).toBe(true);
  });

  it("writes balances the way a person would say them", () => {
    expect(formatDays(0.5)).toBe("half day");
    expect(formatDays(1)).toBe("1 day");
    expect(formatDays(4.5)).toBe("4.5 days");
    expect(formatDays(6)).toBe("6 days");
  });
});

describe("the working day", () => {
  it("reports worked time only once somebody has punched out", () => {
    expect(workedDuration("2026-09-13T04:13:00Z", null)).toBeNull();
    expect(workedDuration(null, null)).toBeNull();
    // 09:43 to 18:21 IST is 8h 38m.
    expect(
      workedDuration("2026-09-13T04:13:00Z", "2026-09-13T12:51:00Z"),
    ).toBe("8h 38m");
  });

  it("writes a short shift in minutes", () => {
    expect(formatDuration(35 * 60_000)).toBe("35m");
    expect(formatDuration(4 * 3_600_000 + 9 * 60_000)).toBe("4h 9m");
  });

  it("covers the whole month a date falls in", () => {
    expect(monthRange("2026-09-13T18:30:00Z")).toEqual({
      start: "2026-09-01",
      end: "2026-09-30",
    });
    expect(monthRange("2026-02-10T00:00:00Z").end).toBe("2026-02-28");
  });
});
