import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getViewer, canManage } from "@/lib/auth/session";
import { runSlaTick } from "@/lib/sla/run";

/**
 * One tick of the SLA and escalation job.
 *
 * Two ways in, and they do different amounts:
 *
 *  1. **The scheduler**, with `Authorization: Bearer $CRON_SECRET`. It uses the
 *     service-role client, so it sees every org. This is the real job.
 *  2. **An owner**, signed in. It runs for *their org only*, through their own
 *     session and therefore through RLS. This exists so the job is testable
 *     and so an owner can force a check; it can never reach another business.
 *
 * The work itself is idempotent (unique escalations, keyed notifications), so
 * a scheduler that retries, or an owner who taps twice, changes nothing.
 */
export const dynamic = "force-dynamic";
/** A tick across every org can take a while; do not let the platform cut it short. */
export const maxDuration = 60;

/**
 * Vercel Cron calls the path with GET and presents `Authorization: Bearer
 * $CRON_SECRET` on its own (vercel.json → crons). Only the scheduler path is
 * open on GET: an owner's tick is a deliberate POST, never a link.
 */
export async function GET(request: Request) {
  const scheduled = await runAsScheduler(request);
  return scheduled ?? new NextResponse("Not found", { status: 404 });
}

export async function POST(request: Request) {
  const scheduled = await runAsScheduler(request);
  if (scheduled) return scheduled;

  // Fall back to the signed-in owner, for their own org.
  const viewer = await getViewer();
  if (!viewer?.org || !canManage(viewer.role)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const client = await createClient();
  const startedAt = Date.now();
  const summary = await runSlaTick(client, new Date(), viewer.org.id);
  return NextResponse.json({ ok: true, scope: "org", durationMs: Date.now() - startedAt, summary });
}

/** The scheduler's path; null when the request did not present the secret. */
async function runAsScheduler(request: Request): Promise<NextResponse | null> {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization") ?? "";
  const presented = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (secret && presented && safeEqual(presented, secret)) {
    const admin = createAdminClient();
    if (!admin) {
      // Documented in BLOCKERS.md as B1.
      return NextResponse.json(
        {
          ok: false,
          reason:
            "SUPABASE_SERVICE_ROLE_KEY is not set, so the job cannot see every org.",
        },
        { status: 503 },
      );
    }
    // The scheduler stores this reply, so the run time is on record.
    const startedAt = Date.now();
    const summary = await runSlaTick(admin);
    return NextResponse.json({ ok: true, scope: "all", durationMs: Date.now() - startedAt, summary });
  }
  return null;
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
