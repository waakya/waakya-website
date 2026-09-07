/**
 * Development-only: skip the login screen entirely.
 *
 * With `DEV_DISABLE_AUTH=true` the proxy signs the visitor in as a seeded user,
 * so every screen is reachable without an inbox or a password. Turning the flag
 * off restores normal login with **no code change** — nothing in `app/` or
 * `lib/auth/session.ts` knows this exists; it is a short-circuit in front of
 * the real path, not a replacement for it.
 *
 * Two guards, both of which must hold, exactly as for `/api/test-login`:
 *   - NODE_ENV must not be production, and
 *   - DEV_DISABLE_AUTH must be exactly "true".
 *
 * This module has no `server-only` marker because `proxy.ts` imports it, and
 * it holds no secrets: the seeded credentials only exist in a development
 * database, and the flag is refused in production regardless.
 */
export const DEV_ROLE_COOKIE = "waakya_dev_role";

/** Which side of the product to look at. */
export const DEV_USERS = {
  owner: { email: "owner@waakya.test", password: "waakya-e2e-owner-pass" },
  staff: { email: "staff@waakya.test", password: "waakya-e2e-staff-pass" },
} as const;

export type DevRole = keyof typeof DEV_USERS;

export const DEV_ROLES: readonly DevRole[] = ["owner", "staff"];

export function devAuthDisabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.DEV_DISABLE_AUTH === "true"
  );
}

export function toDevRole(value: string | undefined): DevRole {
  return value === "staff" ? "staff" : "owner";
}
