import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

/**
 * Exchanges an emailed link for a session.
 *
 * Supabase's email templates can carry a link as well as the six-digit code,
 * and `scripts/dev-login.mjs` uses the same route to sign in without an inbox.
 * Either way the token hash is verified **on the server**, so the session
 * lands in cookies that `@supabase/ssr` can read — a link that returns tokens
 * in the URL fragment would never reach the server at all.
 *
 * The hash is single-use and short-lived, and only Supabase can mint one, so
 * this route is exactly as safe as the email it came in.
 */
const paramsSchema = z.object({
  token_hash: z.string().min(16).max(512),
  type: z.enum(["magiclink", "email", "signup", "recovery", "invite"]),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = paramsSchema.safeParse({
    token_hash: url.searchParams.get("token_hash"),
    type: url.searchParams.get("type"),
  });

  if (!parsed.success) {
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    type: parsed.data.type,
    token_hash: parsed.data.token_hash,
  });

  if (error) {
    // Expired or already used. The login screen is the way back.
    return NextResponse.redirect(new URL("/login?link=expired", url.origin));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    // First sign-in through a link still needs the profile row that the OTP
    // path creates.
    await supabase
      .from("profiles")
      .upsert({ id: user.id }, { onConflict: "id", ignoreDuplicates: true });
  }

  // Same-site paths only: an open redirect here would turn a sign-in link into
  // a way to land someone on another site already authenticated.
  const next = url.searchParams.get("next");
  const safeNext = next && /^\/[^/\\]/.test(next) ? next : "/aaj";

  return NextResponse.redirect(new URL(safeNext, url.origin));
}
