"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { getLocale } from "@/lib/i18n/server";
import { getPortal } from "@/lib/i18n/portal";
import { fail, ok, uuidSchema, type ActionResult } from "@/lib/validation";
import { customerProject, getCustomerPrincipal } from "./principal";

/**
 * What a customer can do: claim their invite, choose, write. Every action
 * checks the principal here and the database checks it again.
 */

const decideSchema = z.object({
  decisionId: uuidSchema,
  optionKey: z.string().min(1).max(40),
  note: z.string().trim().max(500).optional().or(z.literal("")),
});

export async function decide(input: unknown): Promise<ActionResult<{ optionKey: string; alreadyDecided: boolean }>> {
  const t = getPortal(await getLocale()).portal;
  const principal = await getCustomerPrincipal();
  if (!principal) return fail(t.errors.notYours);
  const parsed = decideSchema.safeParse(input);
  if (!parsed.success) return fail(t.errors.badOption);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("record_customer_decision", {
    p_decision: parsed.data.decisionId,
    p_option: parsed.data.optionKey,
    p_note: parsed.data.note || undefined,
  });
  if (error) {
    if (error.code === "42501") return fail(t.errors.notYours);
    if (error.message.includes("closed")) return fail(t.errors.closed);
    if (error.message.includes("not offered")) return fail(t.errors.badOption);
    return fail(t.errors.generic);
  }
  const row = Array.isArray(data) ? data[0] : null;
  if (!row) return fail(t.errors.generic);
  revalidatePath("/portal", "layout");
  return ok({ optionKey: row.option_key ?? parsed.data.optionKey, alreadyDecided: row.already_decided });
}

const messageSchema = z.object({ projectId: uuidSchema, body: z.string().trim().min(1).max(4000) });

export async function sendMessage(input: unknown): Promise<ActionResult> {
  const t = getPortal(await getLocale()).portal;
  const principal = await getCustomerPrincipal();
  if (!principal) return fail(t.errors.notYours);
  const parsed = messageSchema.safeParse(input);
  if (!parsed.success) return fail(t.errors.empty, "body");
  if (!customerProject(principal, parsed.data.projectId)) return fail(t.errors.notYours);
  const supabase = await createClient();
  const { error } = await supabase.rpc("post_customer_message", { p_project: parsed.data.projectId, p_body: parsed.data.body });
  if (error) return fail(error.code === "42501" ? t.errors.notYours : t.errors.generic);
  revalidatePath(`/portal/projects/${parsed.data.projectId}`);
  return ok();
}

export async function acceptCustomerInvite(input: unknown): Promise<ActionResult<{ projectId: string | null }>> {
  const t = getPortal(await getLocale()).portal;
  const parsed = z.string().regex(/^[0-9a-f]{32}$/).safeParse(input);
  if (!parsed.success) return fail(t.invite.notFound);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("accept_customer_invite", { p_token: parsed.data });
  if (error) {
    if (error.message.includes("someone else")) return fail(t.invite.used);
    if (error.message.includes("address")) return fail(t.invite.wrongAccount);
    if (error.code === "P0002") return fail(t.invite.notFound);
    return fail(t.errors.generic);
  }
  // One project opens itself; several are listed.
  const { data: projects } = await supabase.from("customer_project_access").select("project_id").eq("customer_access_id", data.id).limit(2);
  revalidatePath("/portal", "layout");
  return ok({ projectId: projects?.length === 1 ? projects[0].project_id : null });
}
