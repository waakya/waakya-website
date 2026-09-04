import "server-only";

import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

/**
 * The MVP signs people in with an email OTP because phone OTP in India needs
 * DLT registration, which must not block the build (STACK.md §"The two real
 * decisions"). Everything above this interface is channel-agnostic, so the
 * MSG91 phone provider drops in by adding a second implementation and changing
 * `activeAuthProvider()` — no caller changes.
 */
export type OtpChannel = "email" | "phone";

export interface OtpProvider {
  readonly channel: OtpChannel;
  /** Send a six-digit code to the identifier. */
  sendCode(
    client: SupabaseClient<Database>,
    identifier: string,
  ): Promise<{ ok: true } | { ok: false; reason: OtpFailure }>;
  /** Exchange a code for a session. */
  verifyCode(
    client: SupabaseClient<Database>,
    identifier: string,
    code: string,
  ): Promise<{ ok: true } | { ok: false; reason: OtpFailure }>;
}

export type OtpFailure = "rate_limited" | "bad_code" | "expired" | "unknown";

/** Supabase's built-in email OTP. */
const emailOtpProvider: OtpProvider = {
  channel: "email",

  async sendCode(client, identifier) {
    const { error } = await client.auth.signInWithOtp({
      email: identifier,
      options: { shouldCreateUser: true },
    });
    if (!error) return { ok: true };
    return { ok: false, reason: classify(error.message, error.status) };
  },

  async verifyCode(client, identifier, code) {
    const { error } = await client.auth.verifyOtp({
      email: identifier,
      token: code,
      type: "email",
    });
    if (!error) return { ok: true };
    return { ok: false, reason: classify(error.message, error.status) };
  },
};

export function activeAuthProvider(): OtpProvider {
  return emailOtpProvider;
}

/** Never store or log a raw identifier next to a rate-limit counter. */
export function hashIdentifier(identifier: string): string {
  return createHash("sha256").update(identifier.toLowerCase()).digest("hex");
}

function classify(message: string, status?: number): OtpFailure {
  const text = message.toLowerCase();
  if (status === 429 || text.includes("rate limit")) return "rate_limited";
  if (text.includes("expired")) return "expired";
  if (text.includes("invalid") || text.includes("token")) return "bad_code";
  return "unknown";
}
