import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn keeps the Waakya type scale apart from colours", () => {
  it("a size and a colour both survive", () => {
    expect(cn("text-label", "text-ink-900")).toBe("text-label text-ink-900");
    expect(cn("text-body-lg font-bold", "text-neel-700")).toBe("text-body-lg font-bold text-neel-700");
  });
  it("a later size still wins over an earlier one", () => {
    expect(cn("text-label", "text-title")).toBe("text-title");
    expect(cn("text-[13px]", "text-body")).toBe("text-body");
  });
  it("radius steps merge", () => {
    expect(cn("rounded-card", "rounded-inner")).toBe("rounded-inner");
  });
});
