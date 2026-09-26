import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Integration keys: `wk_live_<prefix>_<secret>`. The prefix finds the row;
 * the secret's SHA-256 is what is stored. Shown once at creation, never
 * recoverable, revoked by a flag. Pure functions, unit-tested.
 */
export const KEY_PATTERN = /^wk_(live|test)_([0-9a-f]{8})_([0-9a-f]{32})$/;

export function generateKey(env: "live" | "test" = "live"): { key: string; prefix: string; hash: string } {
  const prefix = randomBytes(4).toString("hex");
  const secret = randomBytes(16).toString("hex");
  return { key: `wk_${env}_${prefix}_${secret}`, prefix, hash: hashSecret(secret) };
}

export function parseKey(presented: string | null | undefined): { prefix: string; secret: string } | null {
  if (!presented) return null;
  const match = KEY_PATTERN.exec(presented.trim());
  return match ? { prefix: match[2], secret: match[3] } : null;
}

export function hashSecret(secret: string): string {
  return createHash("sha256").update(secret).digest("hex");
}

/** Constant-time comparison of a presented secret against the stored hash. */
export function secretMatches(secret: string, storedHash: string): boolean {
  const a = Buffer.from(hashSecret(secret), "hex");
  const b = Buffer.from(storedHash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** A stable fingerprint of a request body, for replay detection when no key is sent. */
export function bodyFingerprint(body: string): string {
  return createHash("sha256").update(body).digest("hex");
}

export const RATE_LIMIT_PER_MINUTE = 60;
