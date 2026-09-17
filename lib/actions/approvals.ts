"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth/session";
import { fail, ok, uuidSchema, type ActionResult } from "@/lib/validation";

/**
 * Approvals go through database functions: who may request, who may decide,
 * and "a request that is no longer pending comes back unchanged" are all
 * enforced there, so a double click or a forged id changes nothing.
 */

function explain(message: string | undefined): string {
  const text = (message ?? "").toLowerCase();
  if (text.includes("your own request")) return "Somebody else has to decide your request.";
  if (text.includes("only the approver")) return "Only the chosen approver can decide this.";
  if (text.includes("choose somebody else")) return "Choose somebody else to approve.";
  if (text.includes("cannot approve")) return "That person cannot approve requests.";
  if (text.includes("not in this business")) return "That item is not in this business.";
  if (text.includes("title")) return "Say what needs approving.";
  return "That did not go through. Please try again.";
}

const requestSchema = z.object({
  title: z.string().trim().min(2).max(160),
  details: z.string().trim().max(2000).optional(),
  approverId: uuidSchema.nullable().optional(),
  taskId: uuidSchema.nullable().optional(),
  projectId: uuidSchema.nullable().optional(),
  documentId: uuidSchema.nullable().optional(),
});

export async function requestApproval(input: unknown): Promise<ActionResult> {
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) return fail("Say what needs approving.");

  const viewer = await requireOrg();
  const supabase = await createClient();
  const { error } = await supabase.rpc("request_approval", {
    p_org: viewer.org.id,
    p_title: parsed.data.title,
    p_details: parsed.data.details || undefined,
    p_approver: parsed.data.approverId ?? undefined,
    p_task: parsed.data.taskId ?? undefined,
    p_project: parsed.data.projectId ?? undefined,
    p_document: parsed.data.documentId ?? undefined,
  });
  if (error) return fail(explain(error.message));

  revalidatePath("/approvals");
  return ok();
}

const decideSchema = z.object({
  id: uuidSchema,
  approve: z.boolean(),
  note: z.string().trim().max(1000).optional(),
});

export async function decideApproval(input: unknown): Promise<ActionResult> {
  const parsed = decideSchema.safeParse(input);
  if (!parsed.success) return fail("That approval could not be read.");

  await requireOrg();
  const supabase = await createClient();
  const { error } = await supabase.rpc("decide_approval", {
    p_approval: parsed.data.id,
    p_approve: parsed.data.approve,
    p_note: parsed.data.note || undefined,
  });
  if (error) return fail(explain(error.message));

  revalidatePath("/approvals");
  revalidatePath("/aaj");
  return ok();
}
