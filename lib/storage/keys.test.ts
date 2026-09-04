import { describe, expect, it } from "vitest";
import { MAX_PROOF_BYTES, PROOF_TYPES, orgIdFromKey, proofKey } from "./keys";

const ORG = "11111111-1111-4111-8111-111111111111";
const TASK = "22222222-2222-4222-8222-222222222222";

describe("proof keys", () => {
  it("put the org first, because that is what the access rule reads", () => {
    expect(proofKey(ORG, TASK, "abc123", "jpg")).toBe(
      `orgs/${ORG}/tasks/${TASK}/abc123.jpg`,
    );
  });

  it("round-trip the org id", () => {
    expect(orgIdFromKey(proofKey(ORG, TASK, "abc123", "jpg"))).toBe(ORG);
  });

  it("refuse a key that is not shaped like one of ours", () => {
    for (const key of [
      "",
      "orgs/not-a-uuid/tasks/x/y.jpg",
      `orgs/${ORG}/tasks/${TASK}/../../../etc/passwd`,
      `../orgs/${ORG}/tasks/${TASK}/a.jpg`,
      `orgs/${ORG}/a.jpg`,
      "public/a.jpg",
    ]) {
      expect(orgIdFromKey(key), key).toBeNull();
    }
  });

  it("allow only photos and voice notes, and name each one on disk", () => {
    expect(Object.keys(PROOF_TYPES).sort()).toEqual([
      "audio/mp4",
      "audio/mpeg",
      "audio/ogg",
      "audio/webm",
      "image/heic",
      "image/jpeg",
      "image/png",
      "image/webp",
    ]);
    // Nothing executable, nothing arbitrary.
    expect(PROOF_TYPES["application/pdf"]).toBeUndefined();
    expect(PROOF_TYPES["text/html"]).toBeUndefined();
    for (const { extension } of Object.values(PROOF_TYPES)) {
      expect(extension).toMatch(/^[a-z0-9]+$/);
    }
  });

  it("cap a proof at a phone photo, not a video", () => {
    expect(MAX_PROOF_BYTES).toBe(10 * 1024 * 1024);
  });
});
