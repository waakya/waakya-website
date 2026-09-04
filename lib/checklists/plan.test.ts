import { describe, expect, it } from "vitest";
import { planChecklistTasks, type ChecklistPlanInput } from "./plan";

const MORNING = new Date("2026-09-04T05:00:00.000Z"); // 10:30 IST
const BEFORE_NINE = new Date("2026-09-04T02:00:00.000Z"); // 07:30 IST

function checklist(overrides: Partial<ChecklistPlanInput> = {}): ChecklistPlanInput {
  return {
    id: "cl",
    orgId: "org",
    name: "Opening checklist",
    assignedTo: "raju",
    runAt: "09:00",
    windowMinutes: 120,
    active: true,
    items: [
      { id: "i1", title: "Shutter kholo", proofRequired: false },
      { id: "i2", title: "Board lagao", proofRequired: true },
    ],
    ...overrides,
  };
}

describe("generating a day's checklist", () => {
  it("makes one task per item", () => {
    const planned = planChecklistTasks([checklist()], new Set(), MORNING);
    expect(planned.map((p) => p.title)).toEqual(["Shutter kholo", "Board lagao"]);
    expect(planned.every((p) => p.assignedTo === "raju")).toBe(true);
  });

  it("stamps them with today's Indian date", () => {
    const planned = planChecklistTasks([checklist()], new Set(), MORNING);
    expect(planned.every((p) => p.checklistDate === "2026-09-04")).toBe(true);

    // 20:00 UTC is already the next day in India.
    const lateUtc = new Date("2026-09-04T20:00:00.000Z");
    const next = planChecklistTasks([checklist()], new Set(), lateUtc);
    expect(next.every((p) => p.checklistDate === "2026-09-05")).toBe(true);
  });

  it("is due a window after its hour, not a window after now", () => {
    const [first] = planChecklistTasks([checklist()], new Set(), MORNING);
    // 09:00 IST plus two hours is 11:00 IST, which is 05:30 UTC.
    expect(first.dueAt).toBe("2026-09-04T05:30:00.000Z");
  });

  it("carries the item's proof requirement", () => {
    const planned = planChecklistTasks([checklist()], new Set(), MORNING);
    expect(planned.map((p) => p.proofRequired)).toEqual([false, true]);
  });
});

describe("running it again", () => {
  it("produces nothing once today's tasks exist", () => {
    const existing = new Set(["i1:2026-09-04", "i2:2026-09-04"]);
    expect(planChecklistTasks([checklist()], existing, MORNING)).toEqual([]);
  });

  it("fills only the gap when one item is missing", () => {
    const existing = new Set(["i1:2026-09-04"]);
    const planned = planChecklistTasks([checklist()], existing, MORNING);
    expect(planned.map((p) => p.checklistItemId)).toEqual(["i2"]);
  });

  it("makes tomorrow's set even though yesterday's exists", () => {
    const existing = new Set(["i1:2026-09-03", "i2:2026-09-03"]);
    expect(planChecklistTasks([checklist()], existing, MORNING)).toHaveLength(2);
  });
});

describe("what it refuses to generate", () => {
  it("waits until the checklist's hour", () => {
    // A 9am routine should not be sitting in somebody's list at half past seven.
    expect(planChecklistTasks([checklist()], new Set(), BEFORE_NINE)).toEqual([]);
  });

  it("skips a paused checklist", () => {
    expect(
      planChecklistTasks([checklist({ active: false })], new Set(), MORNING),
    ).toEqual([]);
  });

  it("skips one with nobody to send it to", () => {
    expect(
      planChecklistTasks([checklist({ assignedTo: null })], new Set(), MORNING),
    ).toEqual([]);
  });

  it("skips one with no items", () => {
    expect(planChecklistTasks([checklist({ items: [] })], new Set(), MORNING)).toEqual(
      [],
    );
  });

  it("skips one whose hour cannot be read, rather than guessing", () => {
    expect(
      planChecklistTasks([checklist({ runAt: "half nine" })], new Set(), MORNING),
    ).toEqual([]);
  });
});

describe("several checklists", () => {
  it("are planned independently", () => {
    const opening = checklist({ id: "a", runAt: "09:00" });
    const closing = checklist({
      id: "b",
      runAt: "20:00",
      items: [{ id: "i3", title: "Shutter band karo", proofRequired: false }],
    });
    const planned = planChecklistTasks([opening, closing], new Set(), MORNING);
    // Only the morning one is due at 10:30.
    expect(planned.map((p) => p.checklistItemId)).toEqual(["i1", "i2"]);
  });
});
