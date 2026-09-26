import { describe, expect, it } from "vitest";
import { countDay, justSentFirst, needsYou, waitingOnTeam } from "./counters";
import type { TaskListItem } from "./queries";

const NOW = new Date("2026-09-04T06:00:00.000Z"); // 11:30 IST
const TODAY = "2026-09-04T04:30:00.000Z"; // 10:00 IST
const YESTERDAY = "2026-09-03T04:30:00.000Z";

function task(overrides: Partial<TaskListItem> = {}): TaskListItem {
  return {
    id: Math.random().toString(36).slice(2),
    title: "kaam",
    details: null,
    state: "delivered",
    priority: "normal",
    proofRequired: false,
    assigneeId: "raju",
    assigneeName: "Raju",
    createdById: "rakesh",
    createdByName: "Rakesh",
    dueAt: "2026-09-04T11:30:00.000Z",
    deliveredAt: TODAY,
    acknowledgedAt: null,
    doneAt: null,
    ackMinutes: 15,
    createdAt: TODAY,
    checklistItemId: null,
    checklistDate: null,
    ...overrides,
  };
}

describe("the four counters", () => {
  it("read as a funnel: verified work was also done, seen and sent", () => {
    const counters = countDay(
      [
        task({ state: "delivered" }),
        task({ state: "acknowledged", acknowledgedAt: TODAY }),
        task({ state: "in_progress", acknowledgedAt: TODAY }),
        task({ state: "done", acknowledgedAt: TODAY, doneAt: TODAY }),
        task({ state: "verified", acknowledgedAt: TODAY, doneAt: TODAY }),
      ],
      NOW,
    );

    expect(counters.bheje).toBe(5);
    expect(counters.dekhe).toBe(4);
    expect(counters.hoGaye).toBe(2);
    expect(counters.verified).toBe(1);
    expect(counters.bheje).toBeGreaterThanOrEqual(counters.dekhe);
    expect(counters.dekhe).toBeGreaterThanOrEqual(counters.hoGaye);
    expect(counters.hoGaye).toBeGreaterThanOrEqual(counters.verified);
  });

  it("count today's work, not everything ever sent", () => {
    const counters = countDay(
      [task(), task({ deliveredAt: YESTERDAY, createdAt: YESTERDAY })],
      NOW,
    );
    expect(counters.bheje).toBe(1);
  });

  it("reckon the day in Kolkata, not in UTC", () => {
    // 20:00 UTC is already the next day in India.
    const lateUtc = new Date("2026-09-04T20:00:00.000Z");
    const counters = countDay(
      [task({ deliveredAt: "2026-09-04T20:30:00.000Z" })],
      lateUtc,
    );
    expect(counters.bheje).toBe(1);
  });

  it("leave cancelled work out of the day's tally", () => {
    expect(countDay([task({ state: "cancelled" })], NOW).bheje).toBe(0);
  });

  it("ignore work that was never delivered", () => {
    expect(countDay([task({ deliveredAt: null })], NOW).bheje).toBe(0);
  });
});

describe("the two chips", () => {
  it("count late work from any day, because it is still late", () => {
    const counters = countDay(
      [
        task({
          deliveredAt: YESTERDAY,
          dueAt: "2026-09-03T11:30:00.000Z",
          state: "accepted",
          acknowledgedAt: YESTERDAY,
        }),
      ],
      NOW,
    );
    expect(counters.bheje).toBe(0); // not today's
    expect(counters.late).toBe(1); // still the owner's problem
  });

  it("count work nobody has looked at past its SLA", () => {
    // Delivered at 10:00 with a 15-minute SLA; it is 11:30.
    expect(countDay([task()], NOW).dekhaNahi).toBe(1);
    expect(
      countDay([task({ state: "acknowledged", acknowledgedAt: TODAY })], NOW)
        .dekhaNahi,
    ).toBe(0);
  });
});

describe("the completion rate", () => {
  it("is verified out of sent", () => {
    const counters = countDay(
      [
        task({ state: "verified", acknowledgedAt: TODAY, doneAt: TODAY }),
        task({ state: "verified", acknowledgedAt: TODAY, doneAt: TODAY }),
        task({ state: "delivered" }),
        task({ state: "delivered" }),
      ],
      NOW,
    );
    expect(counters.completionRate).toBe(50);
  });

  it("is nothing at all before anything was sent, rather than a flattering 0", () => {
    expect(countDay([], NOW).completionRate).toBeNull();
  });

  it("is 100 only when every task sent today came back verified", () => {
    expect(
      countDay(
        [task({ state: "verified", acknowledgedAt: TODAY, doneAt: TODAY })],
        NOW,
      ).completionRate,
    ).toBe(100);
  });
});

describe("Aapke liye", () => {
  it("puts what is most pressing first", () => {
    const late = task({
      dueAt: "2026-09-04T05:00:00.000Z",
      state: "accepted",
      acknowledgedAt: TODAY,
    });
    const escalated = task({ state: "escalated", acknowledgedAt: TODAY });
    const unseen = task();
    const toVerify = task({
      state: "done",
      acknowledgedAt: TODAY,
      doneAt: TODAY,
    });

    const list = needsYou([toVerify, unseen, escalated, late], NOW);
    expect(list.map((item) => item.reason)).toEqual([
      "late",
      "escalated",
      "unseen",
      "verify",
    ]);
  });

  it("gives each task exactly one reason", () => {
    // A late task that is also unseen is listed once, as late.
    const both = task({ dueAt: "2026-09-04T05:00:00.000Z" });
    const list = needsYou([both], NOW);
    expect(list).toHaveLength(1);
    expect(list[0].reason).toBe("late");
  });

  it("leaves alone work that is simply in progress", () => {
    expect(
      needsYou([task({ state: "in_progress", acknowledgedAt: TODAY })], NOW),
    ).toEqual([]);
  });

  it("says nothing about cancelled or verified work", () => {
    expect(
      needsYou(
        [
          task({ state: "cancelled" }),
          task({ state: "verified", acknowledgedAt: TODAY, doneAt: TODAY }),
        ],
        NOW,
      ),
    ).toEqual([]);
  });
});

describe("waiting on your team (Design V3)", () => {
  it("is open work that does not need you — never a task Today already lists", () => {
    const late = task({ dueAt: "2026-09-04T05:00:00.000Z", state: "accepted", acknowledgedAt: TODAY });
    const unseen = task();
    const toVerify = task({ state: "done", acknowledgedAt: TODAY, doneAt: TODAY });
    const working = task({ state: "in_progress", acknowledgedAt: TODAY });
    const accepted = task({ state: "accepted", acknowledgedAt: TODAY, dueAt: "2026-09-04T09:00:00.000Z" });
    const verified = task({ state: "verified", acknowledgedAt: TODAY, doneAt: TODAY });
    const all = [late, unseen, toVerify, working, accepted, verified];
    const waiting = waitingOnTeam(all, NOW);
    const needs = new Set(needsYou(all, NOW).map((item) => item.task.id));
    expect(waiting.map((t) => t.id).sort()).toEqual([working.id, accepted.id].sort());
    expect(waiting.some((t) => needs.has(t.id))).toBe(false);
  });

  it("lists the nearest deadline first", () => {
    const later = task({ state: "in_progress", acknowledgedAt: TODAY, dueAt: "2026-09-05T09:00:00.000Z" });
    const sooner = task({ state: "in_progress", acknowledgedAt: TODAY, dueAt: "2026-09-04T09:00:00.000Z" });
    expect(waitingOnTeam([later, sooner], NOW).map((t) => t.id)).toEqual([sooner.id, later.id]);
  });
});

describe("what you just sent leads the waiting list", () => {
  it("puts your task from the last minutes first, keeps the rest in order, and keeps the set", () => {
    const soon = task({ id: "soon", state: "in_progress", acknowledgedAt: TODAY, dueAt: "2026-09-04T07:00:00.000Z" });
    const later = task({ id: "later", state: "in_progress", acknowledgedAt: TODAY, dueAt: "2026-09-04T09:00:00.000Z" });
    const mine = task({ id: "mine", createdById: "rakesh", createdAt: "2026-09-04T05:55:00.000Z", dueAt: "2026-09-05T09:00:00.000Z", state: "acknowledged", acknowledgedAt: TODAY });
    const out = justSentFirst([soon, later, mine], "rakesh", NOW);
    expect(out.map((t) => t.id)).toEqual(["mine", "soon", "later"]);
    expect(out).toHaveLength(3);
  });
});

describe("several just sent", () => {
  it("puts the newest of several just-sent tasks first", () => {
    const a = task({ id: "a", createdById: "rakesh", createdAt: "2026-09-04T05:50:00.000Z" });
    const b = task({ id: "b", createdById: "rakesh", createdAt: "2026-09-04T05:58:00.000Z" });
    expect(justSentFirst([a, b], "rakesh", NOW).map((t) => t.id)).toEqual(["b", "a"]);
  });
});
