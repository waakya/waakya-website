import "server-only";

import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/types";
import { normalizeEmail, normalizePhone } from "@/lib/crm/model";
import { bodyFingerprint, parseKey, secretMatches, RATE_LIMIT_PER_MINUTE } from "./keys";

/**
 * The inbound lead: what a website may send, and what Waakya does with it.
 * Validation, key check, rate limit, replay, identity, record, event,
 * automation, audit — in that order, every time.
 */
export const leadPayloadSchema = z
  .object({
    full_name: z.string().trim().min(1).max(120),
    phone: z.string().trim().max(30).optional().or(z.literal("")),
    email: z.string().trim().max(254).optional().or(z.literal("")),
    source: z.string().trim().min(1).max(40).default("website"),
    message: z.string().trim().max(4000).optional().or(z.literal("")),
    interest: z.string().trim().max(140).optional().or(z.literal("")),
    project: z.string().trim().max(120).optional().or(z.literal("")),
    metadata: z.record(z.string().max(60), z.union([z.string().max(500), z.number(), z.boolean(), z.null()])).optional(),
  })
  .strict();

export type LeadPayload = z.infer<typeof leadPayloadSchema>;

export type LeadResult =
  | { status: 202; body: { ok: true; contact_id: string; opportunity_id: string | null; deduplicated: boolean; replayed?: boolean } }
  | { status: 400 | 401 | 403 | 409 | 422 | 429 | 500; body: { ok: false; error: string; details?: unknown } };

export async function handleInboundLead(
  admin: SupabaseClient<Database>,
  input: { authorization: string | null; idempotencyKey: string | null; rawBody: string },
): Promise<LeadResult> {
  const presented = input.authorization?.startsWith("Bearer ") ? input.authorization.slice(7) : input.authorization;
  const parsedKey = parseKey(presented);
  if (!parsedKey) return { status: 401, body: { ok: false, error: "invalid_key" } };

  const { data: key } = await admin
    .from("integration_keys")
    .select("id, org_id, key_hash, scopes, revoked_at")
    .eq("key_prefix", parsedKey.prefix)
    .maybeSingle();
  if (!key || !secretMatches(parsedKey.secret, key.key_hash)) return { status: 401, body: { ok: false, error: "invalid_key" } };
  if (key.revoked_at) return { status: 401, body: { ok: false, error: "key_revoked" } };
  if (!key.scopes.includes("leads:write")) return { status: 403, body: { ok: false, error: "scope" } };

  const { data: recent } = await admin.rpc("integration_requests_last_minute", { p_key: key.id });
  if ((recent ?? 0) >= RATE_LIMIT_PER_MINUTE) return { status: 429, body: { ok: false, error: "rate_limited" } };

  const fingerprint = bodyFingerprint(input.rawBody);
  const idempotencyKey = (input.idempotencyKey?.trim().slice(0, 120) || `body:${fingerprint}`).replace(/[^\w:.-]/g, "_");

  // A retry with the same key answers exactly as the first request did.
  const { data: previous } = await admin
    .from("integration_requests")
    .select("status, response, request_hash")
    .eq("key_id", key.id)
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();
  if (previous) {
    if (previous.request_hash !== fingerprint) return { status: 409, body: { ok: false, error: "idempotency_key_reused" } };
    const stored = previous.response as Record<string, unknown>;
    return { status: previous.status as 202, body: { ...(stored as LeadResult["body"] & { ok: true }), replayed: true } };
  }

  let json: unknown;
  try {
    json = JSON.parse(input.rawBody);
  } catch {
    return await record(admin, key, idempotencyKey, fingerprint, { status: 400, body: { ok: false, error: "invalid_json" } });
  }
  const parsed = leadPayloadSchema.safeParse(json);
  if (!parsed.success) {
    return await record(admin, key, idempotencyKey, fingerprint, {
      status: 422,
      body: { ok: false, error: "invalid_payload", details: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) },
    });
  }
  const phone = parsed.data.phone ? normalizePhone(parsed.data.phone) : null;
  const email = parsed.data.email ? normalizeEmail(parsed.data.email) : null;
  if (!phone && !email) {
    return await record(admin, key, idempotencyKey, fingerprint, { status: 422, body: { ok: false, error: "phone_or_email_required" } });
  }

  const metadata: Record<string, Json> = { ...(parsed.data.metadata ?? {}) };
  if (parsed.data.project) metadata.project = parsed.data.project;
  const { data, error } = await admin.rpc("crm_upsert_lead", {
    p_org: key.org_id,
    p_full_name: parsed.data.full_name,
    p_phone: phone ?? undefined,
    p_email: email ?? undefined,
    p_source: parsed.data.source,
    p_message: parsed.data.message || undefined,
    p_interest: parsed.data.interest || parsed.data.project || undefined,
    p_metadata: metadata,
    p_actor_kind: "integration",
    p_idempotency: `lead:${key.id}:${idempotencyKey}`,
  });
  const row = Array.isArray(data) ? data[0] : null;
  if (error || !row) {
    const reason = error?.message.includes("not switched on") ? "module_off" : "not_recorded";
    return await record(admin, key, idempotencyKey, fingerprint, { status: reason === "module_off" ? 403 : 500, body: { ok: false, error: reason } });
  }
  await admin.from("integration_keys").update({ last_used_at: new Date().toISOString() }).eq("id", key.id);
  return await record(admin, key, idempotencyKey, fingerprint, {
    status: 202,
    body: { ok: true, contact_id: row.contact_id, opportunity_id: row.opportunity_id ?? null, deduplicated: row.deduplicated },
  });
}

async function record(
  admin: SupabaseClient<Database>,
  key: { id: string; org_id: string },
  idempotencyKey: string,
  fingerprint: string,
  result: LeadResult,
): Promise<LeadResult> {
  await admin.from("integration_requests").insert({
    org_id: key.org_id,
    key_id: key.id,
    endpoint: "leads",
    idempotency_key: idempotencyKey,
    request_hash: fingerprint,
    status: result.status,
    response: result.body as unknown as Json,
  });
  return result;
}
