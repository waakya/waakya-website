"use server";

import { randomBytes } from "node:crypto";
import { promises as dns } from "node:dns";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireOrg, viewerCan, hasModule } from "@/lib/auth/session";
import { getDomains } from "@/lib/i18n/domains";
import { fail, ok, uuidSchema, type ActionResult } from "@/lib/validation";
import { normalizeHostname, txtSatisfies, verificationRecord } from "./hostname";

async function domainsViewer() {
  const viewer = await requireOrg();
  const t = getDomains(viewer.org.language);
  if (!hasModule(viewer, "custom_domains")) return { viewer, t, refused: fail(t.errors.moduleOff) as ActionResult<never> };
  if (!viewerCan(viewer, "domains.manage")) return { viewer, t, refused: fail(t.errors.notAllowed) as ActionResult<never> };
  return { viewer, t, refused: null };
}

export async function addDomain(input: unknown): Promise<ActionResult<{ id: string; record: { name: string; value: string } }>> {
  const { viewer, t, refused } = await domainsViewer();
  if (refused) return refused;
  const parsed = z.object({ hostname: z.string().trim().min(3).max(253) }).safeParse(input);
  const hostname = parsed.success ? normalizeHostname(parsed.data.hostname) : null;
  if (!hostname) return fail(t.errors.badHost, "hostname");
  const token = randomBytes(16).toString("hex");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_domains")
    .insert({ org_id: viewer.org.id, hostname, verification_token: token, created_by: viewer.userId })
    .select("id")
    .single();
  if (error || !data) return fail(error?.code === "23505" ? t.errors.taken : error?.code === "42501" ? t.errors.notAllowed : t.errors.generic);
  revalidatePath("/settings/domains");
  return ok({ id: data.id, record: verificationRecord(hostname, token) });
}

/** Look the record up for real. Verified only when DNS says so. */
export async function verifyDomain(input: unknown): Promise<ActionResult<{ verified: boolean; reason?: string }>> {
  const { viewer, t, refused } = await domainsViewer();
  if (refused) return refused;
  const parsed = uuidSchema.safeParse(input);
  if (!parsed.success) return fail(t.errors.badInput);
  const supabase = await createClient();
  const { data: domain } = await supabase.from("organization_domains").select("id, hostname, verification_token, status").eq("id", parsed.data).eq("org_id", viewer.org.id).maybeSingle();
  if (!domain) return fail(t.errors.notFound);
  const record = verificationRecord(domain.hostname, domain.verification_token);
  let answers: string[][] = [];
  let reason: string | undefined;
  try {
    answers = await dns.resolveTxt(record.name);
  } catch (error) {
    reason = error instanceof Error && "code" in error ? String((error as { code?: string }).code) : "lookup_failed";
  }
  const verified = txtSatisfies(answers, domain.verification_token);
  const admin = createAdminClient();
  if (!admin) return fail(t.errors.generic);
  await admin
    .from("organization_domains")
    .update({ last_checked_at: new Date().toISOString(), last_error: verified ? null : (reason ?? "record_not_found"), ...(verified ? { status: "verified", verified_at: new Date().toISOString() } : {}) })
    .eq("id", domain.id);
  revalidatePath("/settings/domains");
  return ok({ verified, reason: verified ? undefined : (reason ?? "record_not_found") });
}

export async function removeDomain(input: unknown): Promise<ActionResult> {
  const { viewer, t, refused } = await domainsViewer();
  if (refused) return refused;
  const parsed = uuidSchema.safeParse(input);
  if (!parsed.success) return fail(t.errors.badInput);
  const supabase = await createClient();
  const { error } = await supabase.from("organization_domains").update({ status: "removed", removed_at: new Date().toISOString() }).eq("id", parsed.data).eq("org_id", viewer.org.id);
  if (error) return fail(t.errors.generic);
  revalidatePath("/settings/domains");
  return ok();
}
