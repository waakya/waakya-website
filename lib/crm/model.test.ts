import { describe, expect, it } from "vitest";
import { canMoveStage, endOfIstDay, followUpState, isUnassignedLead, normalizeEmail, normalizePhone } from "./model";

describe("phone identity", () => {
  it("reads Indian numbers however they are typed", () => {
    expect(normalizePhone("98765 43210")).toBe("+919876543210");
    expect(normalizePhone("098765-43210")).toBe("+919876543210");
    expect(normalizePhone("+91 98765 43210")).toBe("+919876543210");
    expect(normalizePhone("919876543210")).toBe("+919876543210");
  });
  it("keeps other countries and refuses noise", () => {
    expect(normalizePhone("+44 20 7946 0958")).toBe("+442079460958");
    expect(normalizePhone("12345")).toBeNull();
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone("call me")).toBeNull();
  });
});

describe("email identity", () => {
  it("lowercases and trims, and refuses what is not an address", () => {
    expect(normalizeEmail("  Meera@Example.com ")).toBe("meera@example.com");
    expect(normalizeEmail("nope")).toBeNull();
    expect(normalizeEmail(null)).toBeNull();
  });
});

describe("stage moves", () => {
  const stage = (id: string, pipelineId: string, kind: "open" | "won" | "lost" = "open") => ({ id, pipelineId, kind, position: 0 });
  it("stay inside the pipeline", () => {
    expect(canMoveStage({ pipelineId: "p1", status: "open" }, stage("s", "p2"), { manages: true })).toEqual({ ok: false, reason: "other_pipeline" });
    expect(canMoveStage({ pipelineId: "p1", status: "open" }, stage("s", "p1"), { manages: false })).toEqual({ ok: true });
  });
  it("let only a manager reopen a closed deal", () => {
    expect(canMoveStage({ pipelineId: "p1", status: "won" }, stage("s", "p1"), { manages: false })).toEqual({ ok: false, reason: "closed" });
    expect(canMoveStage({ pipelineId: "p1", status: "lost" }, stage("s", "p1"), { manages: true })).toEqual({ ok: true });
  });
});

describe("follow-ups", () => {
  const now = new Date("2026-09-26T05:00:00Z"); // 10:30 IST
  it("know due today from overdue from later", () => {
    expect(followUpState(null, now)).toBe("none");
    expect(followUpState("2026-09-26T03:00:00Z", now)).toBe("overdue");
    expect(followUpState("2026-09-26T12:00:00Z", now)).toBe("due");
    expect(followUpState("2026-09-27T04:00:00Z", now)).toBe("scheduled");
  });
  it("end the day at midnight in Kolkata, not UTC", () => {
    expect(endOfIstDay(now).toISOString()).toBe("2026-09-26T18:29:59.000Z");
  });
});

describe("unassigned leads", () => {
  it("are leads with nobody's name, still live", () => {
    expect(isUnassignedLead({ kind: "lead", ownerId: null, archivedAt: null })).toBe(true);
    expect(isUnassignedLead({ kind: "lead", ownerId: "u", archivedAt: null })).toBe(false);
    expect(isUnassignedLead({ kind: "customer", ownerId: null, archivedAt: null })).toBe(false);
    expect(isUnassignedLead({ kind: "lead", ownerId: null, archivedAt: "2026-01-01" })).toBe(false);
  });
});
