"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { requireOrg, viewerCan, hasModule } from "@/lib/auth/session";
import { getIntegrations } from "@/lib/i18n/integrations";
import { fail, ok, uuidSchema, type ActionResult } from "@/lib/validation";
import { recordEvent } from "@/lib/events/emit";
import { generateKey } from "./keys";

async function integrationsViewer() {
  const viewer = await requireOrg();
  const t = getIntegrations(viewer.org.language);
  if (!hasModule(viewer, "website_integration")) return { viewer, t, refused: fail(t.errors.moduleOff) as ActionResult<never> };
  if (!viewerCan(viewer, "integrations.manage")) return { viewer, t, refused: fail(t.errors.notAllowed) as ActionResult<never> };
  return { viewer, t, refused: null };
}

/** Mint a key. The full key is returned once and never stored. */
export async function createIntegrationKey(input: unknown): Promise<ActionResult<{ key: string; prefix: string }>> {
  const { viewer, t, refused } = await integrationsViewer();
  if (refused) return refused;
  const parsed = z.object({ name: z.string().trim().min(1).max(80) }).safeParse(input);
  if (!parsed.success) return fail(t.errors.badInput, "name");
  const generated = generateKey(process.env.NODE_ENV === "production" ? "live" : "test");
  const supabase = await createClient();
  const { error } = await supabase.from("integration_keys").insert({
    org_id: viewer.org.id,
    name: parsed.data.name,
    key_prefix: generated.prefix,
    key_hash: generated.hash,
    created_by: viewer.userId,
  });
  if (error) return fail(error.code === "42501" ? t.errors.notAllowed : t.errors.generic);
  await recordEvent(supabase, { orgId: viewer.org.id, type: "integration.key_created", entityType: "integration_key", entityId: null, payload: { title: parsed.data.name, prefix: generated.prefix } });
  revalidatePath("/settings/integrations");
  return ok({ key: generated.key, prefix: generated.prefix });
}

export async function revokeIntegrationKey(input: unknown): Promise<ActionResult> {
  const { viewer, t, refused } = await integrationsViewer();
  if (refused) return refused;
  const parsed = uuidSchema.safeParse(input);
  if (!parsed.success) return fail(t.errors.badInput);
  const supabase = await createClient();
  const { data, error } = await supabase.from("integration_keys").update({ revoked_at: new Date().toISOString() }).eq("id", parsed.data).eq("org_id", viewer.org.id).select("name").maybeSingle();
  if (error) return fail(t.errors.generic);
  await recordEvent(supabase, { orgId: viewer.org.id, type: "integration.key_revoked", entityType: "integration_key", entityId: parsed.data, payload: { title: data?.name ?? "" } });
  revalidatePath("/settings/integrations");
  return ok();
}
