/**
 * Guest login: a short form on the login screen (name, email, reason) that
 * signs the visitor in as a guest without an OTP, so every feature can be
 * tried without an inbox.
 *
 * It uses Supabase's anonymous sign-in with the public key the site already
 * has, so it needs no service-role key anywhere. The one prerequisite is
 * "Allow anonymous sign-ins" being on in the Supabase project's Authentication
 * settings; the action says so when it is not.
 *
 * Off unless `ALLOW_GUEST_LOGIN` is exactly "true". With the flag off the
 * button is not rendered and the server action refuses, so shipping this
 * changes nothing about the normal login. Nothing in `lib/auth/session.ts`
 * knows it exists: once signed in, a guest is an ordinary user under RLS.
 */
export const GUEST_NAME_MAX = 80;
export const GUEST_REASON_MAX = 280;

export function guestLoginEnabled(): boolean {
  return process.env.ALLOW_GUEST_LOGIN === "true";
}
