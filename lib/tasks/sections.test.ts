import { describe, expect, it } from "vitest";
import { groupBySection, sectionFor, SECTION_ORDER } from "./sections";
import type { TaskListItem } from "./queries";

const NOW = new Date("2026-09-04T06:00:00.000Z"); // 11:30 IST

function task(overrides: Partial<TaskListItem> = {}): TaskListItem {
  return {
    id: "t",
    title: "kaam",
    details: null,
    state: "accepted",
    priority: "normal",
    proofRequired: false,
    assigneeId: "u",
    assigneeName: "Raju",
    createdById: "o",
    createdByName: "Rakesh",
    dueAt: "2026-09-04T11:30:00.000Z", // 5:00 pm today
    deliveredAt: "2026-09-04T04:30:00.000Z",
    acknowledgedAt: "2026-09-04T04:33:00.000Z",
    doneAt: null,
    ackMinutes: 15,
    createdAt: "2026-09-04T04:30:00.000Z",
    ...overrides,
  };
}

describe("My Tasks sections", () => {
  it("puts work nobody has looked at under Naya", () => {
    expect(sectionFor(task({ state: "delivered" }), NOW)).toBe("naya");
  });

  it("puts overdue work under Late, even if it was never looked at", () => {
    const overdue = task({ state: "delivered", dueAt: "2026-09-04T05:00:00.000Z" });
    expect(sectionFor(overdue, NOW)).toBe("late");
  });

  it("puts today's live work under Aaj", () => {
    expect(sectionFor(task({ state: "in_progress" }), NOW)).toBe("aaj");
  });

  it("puts tomorrow's work under Baad mein rather than dropping it", () => {
    expect(sectionFor(task({ dueAt: "2026-09-05T11:30:00.000Z" }), NOW)).toBe(
      "later",
    );
  });

  it("puts finished and cancelled work under Ho gaya", () => {
    for (const state of ["done", "verified", "cancelled"] as const) {
      expect(sectionFor(task({ state }), NOW), state).toBe("done");
    }
  });

  it("keeps a task with no deadline visible today", () => {
    expect(sectionFor(task({ dueAt: null }), NOW)).toBe("aaj");
  });

  it("loses nothing: every task lands in exactly one section", () => {
    const tasks = [
      task({ id: "1", state: "delivered" }),
      task({ id: "2", state: "delivered", dueAt: "2026-09-04T05:00:00.000Z" }),
      task({ id: "3", state: "in_progress" }),
      task({ id: "4", dueAt: "2026-09-06T11:30:00.000Z" }),
      task({ id: "5", state: "done" }),
      task({ id: "6", state: "verified" }),
      task({ id: "7", state: "cancelled" }),
      task({ id: "8", dueAt: null }),
      task({ id: "9", state: "escalated" }),
    ];
    const groups = groupBySection(tasks, NOW);
    const total = SECTION_ORDER.reduce((n, key) => n + groups[key].length, 0);
    expect(total).toBe(tasks.length);

    const ids = SECTION_ORDER.flatMap((key) => groups[key].map((t) => t.id));
    expect(new Set(ids).size).toBe(tasks.length);
  });

  it("orders the sections the way the screen does", () => {
    expect(SECTION_ORDER).toEqual(["naya", "late", "aaj", "later", "done"]);
  });
});
