/**
 * Guest login: one button on the login screen that signs the visitor in as a
 * fixed guest account, skipping the email OTP, so every feature can be tried
 * without an inbox.
 *
 * Off unless `ALLOW_GUEST_LOGIN` is exactly "true". With the flag off the
 * button is not rendered and the server action refuses, so shipping this
 * changes nothing about the normal login. Nothing in `lib/auth/session.ts`
 * knows it exists: once signed in, a guest is an ordinary user under RLS.
 *
 * This module has no `server-only` marker because it holds no secrets — the
 * guest account exists only where the flag has been turned on — but it is only
 * imported from server code (the login page and its server action).
 */
export const GUEST_USER = {
  email: "guest@waakya.test",
  password: "waakya-guest-login-pass",
} as const;

export const GUEST_NAME = "Guest";

export function guestLoginEnabled(): boolean {
  return process.env.ALLOW_GUEST_LOGIN === "true";
}
