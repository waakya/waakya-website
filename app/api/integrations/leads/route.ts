import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { handleInboundLead } from "@/lib/integrations/leads";
import { processAutomation } from "@/lib/automation/run";

/**
 * POST /api/integrations/leads — a website's way in.
 *
 * `Authorization: Bearer wk_live_…` names the business through a key it
 * issued; `Idempotency-Key` makes a retry harmless. The body is validated,
 * the person is found or made, the enquiry is recorded, and the business's
 * automations run before the answer goes back. Everything else about the
 * request is a row the business can read.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(request: Request) {
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  const rawBody = await request.text();
  if (rawBody.length > 64 * 1024) return NextResponse.json({ ok: false, error: "payload_too_large" }, { status: 413 });

  const result = await handleInboundLead(admin, {
    authorization: request.headers.get("authorization"),
    idempotencyKey: request.headers.get("idempotency-key"),
    rawBody,
  });
  if (result.status === 202 && result.body.ok && !result.body.replayed) {
    const { data: key } = await admin.from("crm_contacts").select("org_id").eq("id", result.body.contact_id).maybeSingle();
    if (key?.org_id) await processAutomation(admin, { orgId: key.org_id, limit: 20 }).catch(() => null);
  }
  return NextResponse.json(result.body, {
    status: result.status,
    headers: { "cache-control": "no-store", ...(result.status === 429 ? { "retry-after": "60" } : {}) },
  });
}

export async function GET() {
  return NextResponse.json({ ok: false, error: "method_not_allowed" }, { status: 405 });
}
