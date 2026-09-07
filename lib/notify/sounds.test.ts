import { describe, expect, it } from "vitest";
import { SOUND_FILES, soundFor } from "./sounds";

describe("the three sounds", () => {
  it("are exactly three", () => {
    expect(Object.keys(SOUND_FILES).sort()).toEqual([
      "dhyan",
      "hogaya",
      "naya",
    ]);
  });

  it("keep one meaning each", () => {
    expect(soundFor("task_assigned")).toBe("naya");
    expect(soundFor("reassigned")).toBe("naya");
    expect(soundFor("task_done")).toBe("hogaya");
    expect(soundFor("task_verified")).toBe("hogaya");
    expect(soundFor("escalated")).toBe("dhyan");
    expect(soundFor("not_seen")).toBe("dhyan");
    expect(soundFor("overdue")).toBe("dhyan");
  });

  it("stay silent for reminders, which use the phone's own sound", () => {
    expect(soundFor("ack_reminder")).toBeNull();
    expect(soundFor("completion_reminder")).toBeNull();
  });

  it("stay silent for anything unknown rather than guessing", () => {
    expect(soundFor("something_new")).toBeNull();
    expect(soundFor("")).toBeNull();
  });

  it("point at files that ship in public/", () => {
    for (const path of Object.values(SOUND_FILES)) {
      expect(path).toMatch(/^\/sound\/waakya-[a-z]+\.wav$/);
    }
  });
});
