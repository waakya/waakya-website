import { describe, expect, it } from "vitest";
import type { TaskState } from "@/lib/supabase/types";
import {
  TASK_STATES,
  TRANSITIONS,
  STEPPER_STATES,
  canTransition,
  isActive,
  isTerminal,
  settleState,
  showsTicks,
  stepIndex,
  ticksFor,
  transition,
} from "./state-machine";

const HAPPY_PATH: TaskState[] = [
  "created",
  "delivered",
  "acknowledged",
  "accepted",
  "in_progress",
  "done",
  "verified",
];

describe("the happy path", () => {
  it("walks created → delivered → … → verified", () => {
    for (let i = 0; i < HAPPY_PATH.length - 1; i += 1) {
      const from = HAPPY_PATH[i];
      const to = HAPPY_PATH[i + 1];
      expect(canTransition(from, to), `${from} → ${to}`).toBe(true);
      expect(transition(from, to)).toEqual({
        ok: true,
        state: to,
        recorded: to,
      });
    }
  });

  it("lets an accepted task finish without an explicit start", () => {
    // Staff who just do the thing and press "Ho gaya" are not an error.
    expect(canTransition("accepted", "done")).toBe(true);
  });

  it("never skips a step forwards", () => {
    expect(canTransition("delivered", "accepted")).toBe(false);
    expect(canTransition("created", "acknowledged")).toBe(false);
    expect(canTransition("acknowledged", "done")).toBe(false);
    expect(canTransition("delivered", "verified")).toBe(false);
  });

  it("never walks backwards along the ladder", () => {
    expect(canTransition("acknowledged", "delivered")).toBe(false);
    expect(canTransition("accepted", "acknowledged")).toBe(false);
    expect(canTransition("verified", "done")).toBe(false);
  });
});

describe("illegal transitions are rejected, not silently allowed", () => {
  it("refuses every unlisted pair", () => {
    for (const from of TASK_STATES) {
      for (const to of TASK_STATES) {
        const allowed = TRANSITIONS[from].includes(to);
        const result = transition(from, to);
        expect(result.ok, `${from} → ${to}`).toBe(allowed);
        if (!result.ok) {
          expect(result.reason).toBe(
            TRANSITIONS[from].length === 0 ? "terminal" : "illegal",
          );
        }
      }
    }
  });

  it("refuses a transition to itself", () => {
    for (const state of TASK_STATES) {
      expect(canTransition(state, state), state).toBe(false);
    }
  });

  it("treats verified and cancelled as final", () => {
    expect(isTerminal("verified")).toBe(true);
    expect(isTerminal("cancelled")).toBe(true);
    expect(transition("verified", "in_progress")).toEqual({
      ok: false,
      reason: "terminal",
    });
    expect(transition("cancelled", "delivered")).toEqual({
      ok: false,
      reason: "terminal",
    });
  });
});

describe("escalation", () => {
  const escalatable: TaskState[] = [
    "delivered",
    "acknowledged",
    "accepted",
    "in_progress",
  ];

  it("is reachable from every active state before done", () => {
    for (const state of escalatable) {
      expect(canTransition(state, "escalated"), state).toBe(true);
    }
  });

  it("is not reachable from created, done, verified or cancelled", () => {
    for (const state of ["created", "done", "verified", "cancelled"] as const) {
      expect(canTransition(state, "escalated"), state).toBe(false);
    }
  });

  it("is never a dead end — the task can resume", () => {
    for (const state of ["acknowledged", "accepted", "in_progress", "done"] as const) {
      expect(canTransition("escalated", state), state).toBe(true);
    }
    expect(isTerminal("escalated")).toBe(false);
    expect(isActive("escalated")).toBe(true);
  });

  it("can also be reassigned or cancelled out of", () => {
    expect(canTransition("escalated", "reassigned")).toBe(true);
    expect(canTransition("escalated", "cancelled")).toBe(true);
  });
});

describe("reassignment", () => {
  it("settles to delivered rather than resting on `reassigned`", () => {
    expect(settleState("reassigned")).toBe("delivered");
    expect(transition("in_progress", "reassigned")).toEqual({
      ok: true,
      state: "delivered",
      recorded: "reassigned",
    });
  });

  it("records `reassigned` in the audit trail even though the row says delivered", () => {
    const result = transition("acknowledged", "reassigned");
    expect(result.ok && result.recorded).toBe("reassigned");
    expect(result.ok && result.state).toBe("delivered");
  });

  it("is reachable from every active state and from done", () => {
    for (const state of [
      "delivered",
      "acknowledged",
      "accepted",
      "in_progress",
      "done",
      "escalated",
    ] as const) {
      expect(canTransition(state, "reassigned"), state).toBe(true);
    }
  });

  it("leaves every other state settling as itself", () => {
    for (const state of TASK_STATES) {
      if (state === "reassigned") continue;
      expect(settleState(state), state).toBe(state);
    }
  });
});

describe("cancellation", () => {
  it("is reachable from every non-final state", () => {
    for (const state of TASK_STATES) {
      if (state === "cancelled" || state === "verified") continue;
      if (state === "reassigned") continue; // transient, never a resting state
      expect(canTransition(state, "cancelled"), state).toBe(true);
    }
  });

  it("is terminal", () => {
    expect(TRANSITIONS.cancelled).toEqual([]);
  });
});

describe("sending work back", () => {
  it("lets the owner return a done task for a better proof", () => {
    expect(canTransition("done", "in_progress")).toBe(true);
  });

  it("does not let the owner escalate work that is already done", () => {
    expect(canTransition("done", "escalated")).toBe(false);
  });
});

describe("the stepper and the ticks glyph", () => {
  it("has exactly the six steps the design names", () => {
    expect(STEPPER_STATES).toEqual([
      "delivered",
      "acknowledged",
      "accepted",
      "in_progress",
      "done",
      "verified",
    ]);
  });

  it("places each step in order and keeps exceptions off the ladder", () => {
    STEPPER_STATES.forEach((state, index) => {
      expect(stepIndex(state), state).toBe(index);
    });
    for (const state of ["escalated", "reassigned", "cancelled", "created"] as const) {
      expect(stepIndex(state), state).toBe(-1);
    }
  });

  it("shows a chip instead of the glyph for the three exceptions (D-11)", () => {
    for (const state of ["escalated", "reassigned", "cancelled"] as const) {
      expect(showsTicks(state), state).toBe(false);
      expect(ticksFor(state), state).toBeNull();
    }
  });

  it("maps the normal path onto the five glyph states", () => {
    expect(ticksFor("created")).toBe("sent");
    expect(ticksFor("delivered")).toBe("sent");
    expect(ticksFor("acknowledged")).toBe("seen");
    expect(ticksFor("accepted")).toBe("accepted");
    expect(ticksFor("in_progress")).toBe("accepted");
    expect(ticksFor("done")).toBe("done");
    expect(ticksFor("verified")).toBe("verified");
  });

  it("gives every state a defined answer", () => {
    for (const state of TASK_STATES) {
      expect(() => ticksFor(state)).not.toThrow();
      expect(() => showsTicks(state)).not.toThrow();
    }
  });
});

describe("the transition table itself", () => {
  it("covers every enum value", () => {
    expect(Object.keys(TRANSITIONS).sort()).toEqual([...TASK_STATES].sort());
  });

  it("only ever points at real states", () => {
    for (const [from, targets] of Object.entries(TRANSITIONS)) {
      for (const to of targets) {
        expect(TASK_STATES, `${from} → ${to}`).toContain(to);
      }
    }
  });

  it("lists no duplicates", () => {
    for (const [from, targets] of Object.entries(TRANSITIONS)) {
      expect(new Set(targets).size, from).toBe(targets.length);
    }
  });
});
