import { describe, expect, it } from "vitest";
import { safeNextPath } from "./next";

describe("safeNextPath", () => {
  it("keeps same-site paths, including an invite link", () => {
    expect(safeNextPath("/aaj")).toBe("/aaj");
    expect(safeNextPath("/join/abc123")).toBe("/join/abc123");
    expect(safeNextPath("/kaam/1?tab=proof")).toBe("/kaam/1?tab=proof");
    expect(safeNextPath("/")).toBe("/");
  });

  it("drops anything that could leave the site", () => {
    expect(safeNextPath("https://evil.example")).toBeNull();
    expect(safeNextPath("//evil.example")).toBeNull();
    expect(safeNextPath("/\\evil.example")).toBeNull();
    expect(safeNextPath("javascript:alert(1)")).toBeNull();
    expect(safeNextPath("aaj")).toBeNull();
  });

  it("drops what is not a string, and what is absurdly long", () => {
    expect(safeNextPath(undefined)).toBeNull();
    expect(safeNextPath(null)).toBeNull();
    expect(safeNextPath(["/aaj"])).toBeNull();
    expect(safeNextPath("/" + "a".repeat(600))).toBeNull();
  });
});
