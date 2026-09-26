import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";
import { recordInboundWhatsApp, recordWhatsAppStatus } from "@/lib/campaigns/inbound";
import { processAutomation } from "@/lib/automation/run";

/**
 * WhatsApp Cloud API webhook. GET answers Meta's verification challenge with
 * WHATSAPP_VERIFY_TOKEN; POST accepts signed events (X-Hub-Signature-256
 * over the raw body with WHATSAPP_APP_SECRET). Replies become CRM activity
 * and campaign responses; receipts update recipients. Unsigned or
 * mis-signed bodies are refused before anything is read.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = process.env.WHATSAPP_VERIFY_TOKEN;
  if (token && url.searchParams.get("hub.mode") === "subscribe" && url.searchParams.get("hub.verify_token") === token) {
    return new NextResponse(url.searchParams.get("hub.challenge") ?? "", { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(request: Request) {
  const secret = process.env.WHATSAPP_APP_SECRET;
  const raw = await request.text();
  if (!secret) return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  const signature = request.headers.get("x-hub-signature-256") ?? "";
  const expected = `sha256=${createHmac("sha256", secret).update(raw).digest("hex")}`;
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return NextResponse.json({ ok: false, error: "bad_signature" }, { status: 401 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const orgs = new Set<string>();
  const entries = ((body as { entry?: unknown[] })?.entry ?? []) as { changes?: { value?: Record<string, unknown> }[] }[];
  for (const entry of entries) {
    for (const change of entry.changes ?? []) {
      const value = change.value ?? {};
      const phoneNumberId = String((value.metadata as { phone_number_id?: string } | undefined)?.phone_number_id ?? "");
      for (const m of (value.messages as { id: string; from: string; type: string; text?: { body: string }; timestamp?: string }[] | undefined) ?? []) {
        if (m.type !== "text" || !m.text?.body) continue;
        const result = await recordInboundWhatsApp(admin, {
          phoneNumberId,
          from: m.from,
          messageId: m.id,
          body: m.text.body,
          raw: m as never,
          receivedAt: m.timestamp ? new Date(Number(m.timestamp) * 1000).toISOString() : undefined,
        });
        if (result.ok && result.orgId) orgs.add(result.orgId);
      }
      for (const s of (value.statuses as { id: string; status: string; errors?: { title?: string }[] }[] | undefined) ?? []) {
        await recordWhatsAppStatus(admin, { messageId: s.id, status: s.status, error: s.errors?.[0]?.title });
      }
    }
  }
  for (const orgId of orgs) await processAutomation(admin, { orgId, limit: 20 }).catch(() => null);
  return NextResponse.json({ ok: true });
}
