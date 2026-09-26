import { describe, expect, it } from "vitest";
import { foldGroups } from "./fold";

type Item = { id: number; kind: "late" | "unseen" | "verify" };
const make = (kind: Item["kind"], n: number, from = 0): Item[] =>
  Array.from({ length: n }, (_, i) => ({ id: from + i, kind }));

describe("Today never hides work, it folds it", () => {
  it("shows everything on a short day", () => {
    const items = [...make("late", 2), ...make("verify", 3, 10)];
    const groups = foldGroups(items, (i) => i.kind);
    expect(groups.map((g) => [g.key, g.shown.length, g.rest])).toEqual([
      ["late", 2, 0],
      ["verify", 3, 0],
    ]);
  });

  it("on a busy day folds each group to three and counts the rest", () => {
    const items = [...make("late", 39), ...make("unseen", 28, 100), ...make("verify", 2, 200)];
    const groups = foldGroups(items, (i) => i.kind);
    expect(groups.map((g) => [g.key, g.total, g.shown.length, g.rest])).toEqual([
      ["late", 39, 3, 36],
      ["unseen", 28, 3, 25],
      ["verify", 2, 2, 0],
    ]);
  });

  it("never loses an item: shown plus rest is always the whole", () => {
    for (const n of [0, 1, 8, 9, 10, 250]) {
      const items = [...make("late", n), ...make("unseen", Math.floor(n / 2), 1000)];
      const groups = foldGroups(items, (i) => i.kind);
      const accounted = groups.reduce((sum, g) => sum + g.shown.length + g.rest, 0);
      expect(accounted).toBe(items.length);
    }
  });

  it("keeps every category visible however busy one of them is", () => {
    const items = [...make("late", 500), ...make("unseen", 1, 1000), ...make("verify", 1, 2000)];
    const keys = foldGroups(items, (i) => i.kind).map((g) => g.key);
    expect(keys).toEqual(["late", "unseen", "verify"]);
  });

  it("shows the most urgent first within a group (input order is kept)", () => {
    const items = make("late", 12);
    expect(foldGroups(items, (i) => i.kind)[0].shown.map((i) => i.id)).toEqual([0, 1, 2]);
  });
});
