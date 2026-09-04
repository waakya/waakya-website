import { describe, expect, it } from "vitest";
import {
  isLate,
  isUnseen,
  rowMeta,
  rowStatus,
  stateWord,
  taskClocks,
  type TaskForDisplay,
} from "./present";
import { TASK_STATES } from "./state-machine";

const DELIVERED = "2026-09-04T04:30:00.000Z"; // 10:00 IST
const DUE = "2026-09-04T11:30:00.000Z"; //  5:00 pm IST
const now = (iso: string) => new Date(iso);

function task(overrides: Partial<TaskForDisplay> = {}): TaskForDisplay {
  return {
    state: "delivered",
    priority: "normal",
    proofRequired: false,
    dueAt: DUE,
    deliveredAt: DELIVERED,
    acknowledgedAt: null,
    doneAt: null,
    ackMinutes: 15,
    ...overrides,
  };
}

const owner = { now: now(DELIVERED), locale: "hi-Latn" as const, viewer: "owner" as const };
const staff = { ...owner, viewer: "staff" as const };

describe("a row shows the glyph or a chip, never both", () => {
  it("shows the glyph on the normal path", () => {
    expect(rowStatus(task({ state: "delivered" }), owner)).toEqual({
      kind: "ticks",
      state: "sent",
    });
    expect(
      rowStatus(task({ state: "acknowledged", acknowledgedAt: DELIVERED }), owner),
    ).toEqual({ kind: "ticks", state: "seen" });
    expect(rowStatus(task({ state: "in_progress" }), owner)).toEqual({
      kind: "ticks",
      state: "accepted",
    });
    expect(rowStatus(task({ state: "verified" }), owner)).toEqual({
      kind: "ticks",
      state: "verified",
    });
  });

  it("returns exactly one thing for every state", () => {
    for (const state of TASK_STATES) {
      const status = rowStatus(task({ state }), owner);
      expect(["ticks", "chip"], state).toContain(status.kind);
    }
  });

  it("never gives a chip without a word", () => {
    for (const state of TASK_STATES) {
      const status = rowStatus(task({ state }), owner);
      if (status.kind === "chip") {
        expect(status.chip.label.length, state).toBeGreaterThan(0);
        expect(status.chip.icon, state).toBeTruthy();
      }
    }
  });
});

describe("Late", () => {
  it("appears once the deadline passes and the work is not done", () => {
    const late = now("2026-09-04T12:10:00.000Z"); // 40 minutes past 5:00 pm
    expect(isLate(task(), late)).toBe(true);
    expect(rowStatus(task(), { ...owner, now: late })).toEqual({
      kind: "chip",
      chip: { tone: "laal", icon: "clock", label: "Late 40 min" },
    });
  });

  it("does not appear for work that is done, verified or cancelled", () => {
    const late = now("2026-09-04T12:10:00.000Z");
    for (const state of ["done", "verified", "cancelled"] as const) {
      expect(isLate(task({ state }), late), state).toBe(false);
    }
  });

  it("does not appear for a task with no deadline", () => {
    expect(isLate(task({ dueAt: null }), now("2027-01-01T00:00:00.000Z"))).toBe(
      false,
    );
  });

  it("outranks everything except cancellation", () => {
    const late = now("2026-09-04T12:10:00.000Z");
    const status = rowStatus(
      task({ state: "escalated", priority: "urgent" }),
      { ...owner, now: late },
    );
    expect(status.kind === "chip" && status.chip.label).toBe("Late 40 min");

    const cancelled = rowStatus(task({ state: "cancelled" }), {
      ...owner,
      now: late,
    });
    expect(cancelled.kind === "chip" && cancelled.chip.label).toBe("Cancelled");
  });
});

describe("Dekha nahi", () => {
  it("appears only after the acknowledge SLA passes with nobody looking", () => {
    const before = now("2026-09-04T04:40:00.000Z"); // 10 min in, SLA is 15
    const after = now("2026-09-04T04:50:00.000Z"); // 20 min in

    expect(isUnseen(task(), before)).toBe(false);
    expect(isUnseen(task(), after)).toBe(true);
    expect(rowStatus(task(), { ...owner, now: after })).toEqual({
      kind: "chip",
      chip: { tone: "amber", icon: "eye-off", label: "Dekha nahi" },
    });
  });

  it("stops once somebody has looked", () => {
    const after = now("2026-09-04T04:50:00.000Z");
    expect(
      isUnseen(task({ state: "acknowledged", acknowledgedAt: DELIVERED }), after),
    ).toBe(false);
  });

  it("honours a per-task SLA over the org default", () => {
    const at6 = now("2026-09-04T04:36:00.000Z");
    expect(isUnseen(task({ ackMinutes: 5 }), at6)).toBe(true);
    expect(isUnseen(task({ ackMinutes: 30 }), at6)).toBe(false);
  });
});

describe("Verify baaki", () => {
  it("is shown to the owner but not to the person who did the work", () => {
    expect(rowStatus(task({ state: "done", doneAt: DELIVERED }), owner)).toEqual({
      kind: "chip",
      chip: { tone: "neel", icon: "eye", label: "Verify baaki" },
    });
    expect(rowStatus(task({ state: "done", doneAt: DELIVERED }), staff)).toEqual({
      kind: "ticks",
      state: "done",
    });
  });
});

describe("the meta line", () => {
  it("always states the state in words", () => {
    for (const state of TASK_STATES) {
      const line = rowMeta(task({ state }), owner, "Raju");
      expect(line, state).toContain(stateWord(state, "hi-Latn"));
    }
  });

  it("reads like the screens", () => {
    expect(
      rowMeta(task({ state: "accepted" }), owner, "Raju"),
    ).toBe("Raju · Maana · 5:00 pm tak");
  });

  it("adds Urgent and Photo chahiye as facts, not as the only signal", () => {
    const line = rowMeta(
      task({ priority: "urgent", proofRequired: true }),
      owner,
      "Raju",
    );
    expect(line).toContain("Urgent");
    expect(line).toContain("Photo chahiye");
  });

  it("drops the deadline once the work is verified or cancelled", () => {
    expect(rowMeta(task({ state: "verified" }), owner)).not.toContain("5:00 pm");
    expect(rowMeta(task({ state: "cancelled" }), owner)).not.toContain("5:00 pm");
  });

  it("writes Latin digits in Devanagari too", () => {
    const line = rowMeta(task(), { ...owner, locale: "hi" }, "राजू");
    expect(line).toContain("5:00 pm");
    expect(line).not.toMatch(/[०-९]/);
  });
});

describe("the two clocks", () => {
  it("runs the ack clock from delivery to the SLA and the completion clock to the deadline", () => {
    const clocks = taskClocks(task(), now("2026-09-04T04:37:30.000Z"));
    expect(clocks.ack.progress).toBeCloseTo(0.5); // 7.5 of 15 minutes
    expect(clocks.ack.tone).toBe("amber");
    expect(clocks.completion.tone).toBe("neel");
  });

  it("turns the ack clock green once somebody looked in time", () => {
    const clocks = taskClocks(
      task({ state: "acknowledged", acknowledgedAt: "2026-09-04T04:33:00.000Z" }),
      now("2026-09-04T09:00:00.000Z"),
    );
    expect(clocks.ack.tone).toBe("hara");
  });

  it("turns the completion clock red at 90% of the window", () => {
    // 10:00 to 17:00 is 7 hours; 90% is 16:18.
    const clocks = taskClocks(task(), now("2026-09-04T10:48:00.000Z"));
    expect(clocks.completion.tone).toBe("laal");
  });
});
