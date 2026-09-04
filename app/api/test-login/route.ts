import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { emailSchema } from "@/lib/validation";

/**
 * Dev-only sign-in for the Playwright e2e.
 *
 * The MVP signs in with an email OTP, which means a real inbox. The e2e cannot
 * wait on one, so it signs in with a password against the two seeded test users
 * in `supabase/seed-e2e.sql`. Those users exist only in the development project.
 *
 * Two guards, both of which must hold:
 *   - NODE_ENV must not be production, and
 *   - ALLOW_TEST_LOGIN must be exactly "true".
 * ALLOW_TEST_LOGIN is never set in Vercel. In production this route 404s, the
 * same as a path that does not exist.
 */
const bodySchema = z.object({
  email: emailSchema,
  password: z.string().min(8).max(128),
});

function enabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.ALLOW_TEST_LOGIN === "true"
  );
}

export async function POST(request: Request) {
  if (!enabled()) {
    return new NextResponse("Not found", { status: 404 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return NextResponse.json(
      { ok: false, reason: error.message },
      { status: 401 },
    );
  }

  return NextResponse.json({ ok: true });
}
