import { describe, expect, it } from "vitest";
import { bodyFingerprint, generateKey, hashSecret, parseKey, secretMatches } from "./keys";

describe("integration keys", () => {
  it("generate a key whose prefix and hash are stored, and whose secret is not", () => {
    const { key, prefix, hash } = generateKey();
    const parsed = parseKey(key);
    expect(parsed?.prefix).toBe(prefix);
    expect(hash).toBe(hashSecret(parsed!.secret));
    expect(hash).not.toContain(parsed!.secret);
  });
  it("match only the right secret, in constant time", () => {
    const { key, hash } = generateKey();
    const { secret } = parseKey(key)!;
    expect(secretMatches(secret, hash)).toBe(true);
    expect(secretMatches(secret.replace(/./, "0"), hash)).toBe(false);
    expect(secretMatches("short", hash)).toBe(false);
  });
  it("refuse anything that is not a key", () => {
    expect(parseKey("")).toBeNull();
    expect(parseKey("wk_live_abc")).toBeNull();
    expect(parseKey("Bearer wk_live_aaaaaaaa_" + "a".repeat(32))).toBeNull();
    expect(parseKey(" wk_test_aaaaaaaa_" + "b".repeat(32) + " ")).not.toBeNull();
  });
  it("fingerprint a body stably", () => {
    expect(bodyFingerprint('{"a":1}')).toBe(bodyFingerprint('{"a":1}'));
    expect(bodyFingerprint('{"a":1}')).not.toBe(bodyFingerprint('{"a":2}'));
  });
});
