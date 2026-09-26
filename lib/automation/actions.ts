"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { requireOrg, viewerCan, hasModule } from "@/lib/auth/session";
import { getAutomation } from "@/lib/i18n/automation";
import { fail, ok, uuidSchema, type ActionResult } from "@/lib/validation";
import type { Json } from "@/lib/supabase/types";
import { ruleSchema } from "./engine";
import { RULE_EXAMPLES } from "./queries";

async function automationViewer() {
  const viewer = await requireOrg();
  const t = getAutomation(viewer.org.language);
  if (!hasModule(viewer, "automation")) return { viewer, t, refused: fail(t.errors.moduleOff) as ActionResult<never> };
  if (!viewerCan(viewer, "automation.manage")) return { viewer, t, refused: fail(t.errors.notAllowed) as ActionResult<never> };
  return { viewer, t, refused: null };
}

const saveSchema = ruleSchema.extend({ id: uuidSchema.optional() });

export async function saveRule(input: unknown): Promise<ActionResult<{ id: string }>> {
  const { viewer, t, refused } = await automationViewer();
  if (refused) return refused;
  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) return fail(t.errors.badInput, String(parsed.error.issues[0]?.path.join(".") ?? ""));
  const d = parsed.data;
  const supabase = await createClient();
  const row = {
    name: d.name,
    trigger_event: d.triggerEvent,
    conditions: d.conditions as unknown as Json,
    actions: d.actions as unknown as Json,
    enabled: d.enabled,
  };
  if (d.id) {
    const { error } = await supabase.from("automation_rules").update(row).eq("id", d.id).eq("org_id", viewer.org.id);
    if (error) return fail(error.code === "42501" ? t.errors.notAllowed : t.errors.generic);
    revalidatePath("/automations", "layout");
    return ok({ id: d.id });
  }
  const { data, error } = await supabase.from("automation_rules").insert({ org_id: viewer.org.id, created_by: viewer.userId, ...row }).select("id").single();
  if (error || !data) return fail(error?.code === "42501" ? t.errors.notAllowed : t.errors.generic);
  revalidatePath("/automations", "layout");
  return ok({ id: data.id });
}

export async function setRuleEnabled(input: unknown): Promise<ActionResult> {
  const { viewer, t, refused } = await automationViewer();
  if (refused) return refused;
  const parsed = z.object({ id: uuidSchema, enabled: z.boolean() }).safeParse(input);
  if (!parsed.success) return fail(t.errors.badInput);
  const supabase = await createClient();
  const { error } = await supabase.from("automation_rules").update({ enabled: parsed.data.enabled }).eq("id", parsed.data.id).eq("org_id", viewer.org.id);
  if (error) return fail(t.errors.generic);
  revalidatePath("/automations", "layout");
  return ok();
}

export async function deleteRule(input: unknown): Promise<ActionResult> {
  const { viewer, t, refused } = await automationViewer();
  if (refused) return refused;
  const parsed = uuidSchema.safeParse(input);
  if (!parsed.success) return fail(t.errors.badInput);
  const supabase = await createClient();
  const { error } = await supabase.from("automation_rules").delete().eq("id", parsed.data).eq("org_id", viewer.org.id);
  if (error) return fail(t.errors.generic);
  revalidatePath("/automations", "layout");
  return ok();
}

export async function installExampleRule(input: unknown): Promise<ActionResult<{ id: string }>> {
  const { t, refused } = await automationViewer();
  if (refused) return refused;
  const parsed = z.enum(Object.keys(RULE_EXAMPLES) as [string, ...string[]]).safeParse(input);
  if (!parsed.success) return fail(t.errors.badInput);
  const example = RULE_EXAMPLES[parsed.data];
  const name = t.examples[parsed.data as keyof typeof t.examples] as string;
  return saveRule({ name, triggerEvent: example.triggerEvent, conditions: example.conditions, actions: example.actions, enabled: true });
}
