import { describe, expect, it } from "vitest";
import { availableTransitions, canActorTransition, manages } from "./authz";
import type { MemberRole } from "@/lib/supabase/types";

const assignee = { role: "member" as MemberRole, isAssignee: true };
const otherStaff = { role: "member" as MemberRole, isAssignee: false };
const owner = { role: "owner" as MemberRole, isAssignee: false };
const manager = { role: "manager" as MemberRole, isAssignee: false };

describe("who runs the business", () => {
  it("is owner, admin and manager — not a member", () => {
    expect(manages("owner")).toBe(true);
    expect(manages("admin")).toBe(true);
    expect(manages("manager")).toBe(true);
    expect(manages("member")).toBe(false);
    expect(manages(null)).toBe(false);
  });
});

describe("the assignee", () => {
  it("walks their own task down the ladder", () => {
    expect(canActorTransition(assignee, "delivered", "acknowledged")).toBe(true);
    expect(canActorTransition(assignee, "acknowledged", "accepted")).toBe(true);
    expect(canActorTransition(assignee, "accepted", "in_progress")).toBe(true);
    expect(canActorTransition(assignee, "in_progress", "done")).toBe(true);
  });

  it("may decline, which escalates to the owner rather than ending the task", () => {
    expect(canActorTransition(assignee, "acknowledged", "escalated")).toBe(true);
    expect(canActorTransition(assignee, "delivered", "escalated")).toBe(true);
  });

  it("cannot verify their own work", () => {
    expect(canActorTransition(assignee, "done", "verified")).toBe(false);
  });

  it("cannot cancel or reassign", () => {
    expect(canActorTransition(assignee, "accepted", "cancelled")).toBe(false);
    expect(canActorTransition(assignee, "accepted", "reassigned")).toBe(false);
  });
});

describe("somebody else's task", () => {
  it("cannot be moved by a colleague who does not run the business", () => {
    for (const to of ["acknowledged", "accepted", "in_progress", "done"] as const) {
      expect(canActorTransition(otherStaff, "delivered", to), to).toBe(false);
    }
  });
});

describe("the owner", () => {
  it("verifies finished work", () => {
    expect(canActorTransition(owner, "done", "verified")).toBe(true);
    expect(canActorTransition(manager, "done", "verified")).toBe(true);
  });

  it("sends work back for a better proof", () => {
    expect(canActorTransition(owner, "done", "in_progress")).toBe(true);
  });

  it("reassigns and cancels", () => {
    expect(canActorTransition(owner, "acknowledged", "reassigned")).toBe(true);
    expect(canActorTransition(owner, "in_progress", "cancelled")).toBe(true);
  });

  it("does not acknowledge or accept on the staff member's behalf", () => {
    // The whole point of the product is that the staff member said so.
    expect(canActorTransition(owner, "delivered", "acknowledged")).toBe(false);
    expect(canActorTransition(owner, "acknowledged", "accepted")).toBe(false);
  });

  it("cannot mark somebody else's work done", () => {
    expect(canActorTransition(owner, "in_progress", "done")).toBe(false);
  });
});

describe("an owner who is also the assignee", () => {
  const both = { role: "owner" as MemberRole, isAssignee: true };

  it("can do both jobs, because they really are both", () => {
    expect(canActorTransition(both, "delivered", "acknowledged")).toBe(true);
    expect(canActorTransition(both, "in_progress", "done")).toBe(true);
    expect(canActorTransition(both, "done", "verified")).toBe(true);
  });
});

describe("nothing is allowed out of a terminal state", () => {
  for (const actor of [assignee, owner, manager]) {
    it(`for ${actor.role}${actor.isAssignee ? " (assignee)" : ""}`, () => {
      expect(availableTransitions(actor, "verified")).toEqual([]);
      expect(availableTransitions(actor, "cancelled")).toEqual([]);
    });
  }
});

describe("the buttons a screen offers", () => {
  it("match what the server will accept", () => {
    for (const from of ["delivered", "acknowledged", "accepted", "in_progress", "done", "escalated"] as const) {
      for (const actor of [assignee, owner, otherStaff]) {
        for (const to of availableTransitions(actor, from)) {
          expect(canActorTransition(actor, from, to), `${from} → ${to}`).toBe(true);
        }
      }
    }
  });

  it("gives the assignee one obvious next step on a new task", () => {
    expect(availableTransitions(assignee, "delivered")).toEqual([
      "acknowledged",
      "escalated",
    ]);
  });

  it("gives the owner verify and send-back on finished work", () => {
    expect(availableTransitions(owner, "done").sort()).toEqual([
      "cancelled",
      "in_progress",
      "reassigned",
      "verified",
    ]);
  });

  it("offers a colleague nothing at all", () => {
    expect(availableTransitions(otherStaff, "delivered")).toEqual([]);
  });
});
