"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { requireOrg, viewerCan } from "@/lib/auth/session";
import { getPlatform } from "@/lib/i18n/platform";
import { fail, ok, type ActionResult } from "@/lib/validation";
import { checkModuleChange, isModuleKey, moduleDefinition, type ModuleKey } from "./catalog";
import { MODULE_PRESETS, presetEnableOrder, type PresetKey } from "./presets";
import { getEnabledModules } from "./queries";

const toggleSchema = z.object({
  key: z.string().min(2).max(40),
  enabled: z.boolean(),
});

/**
 * Turn one capability on or off for the business. Dependencies are checked
 * here against the catalogue and again in the database; turning a module off
 * never deletes its data (§6 of the spec).
 */
export async function setModule(input: unknown): Promise<ActionResult> {
  const viewer = await requireOrg();
  const t = getPlatform(viewer.org.language).modules;
  if (!viewerCan(viewer, "modules.manage")) return fail(t.errors.notAllowed);

  const parsed = toggleSchema.safeParse(input);
  if (!parsed.success || !isModuleKey(parsed.data.key)) return fail(t.errors.unknown);
  const key = parsed.data.key;

  const current = await getEnabledModules(viewer.org.id);
  const check = checkModuleChange(key, parsed.data.enabled, current);
  if (!check.ok) {
    const names = check.modules.map((m) => t.names[m]).join(", ");
    if (check.reason === "core") return fail(t.errors.core);
    if (check.reason === "missing_dependency") return fail(t.errors.needsFirst(names));
    if (check.reason === "has_dependents") return fail(t.errors.stillUsedBy(names));
    return fail(t.errors.unknown);
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_org_module", {
    p_org: viewer.org.id,
    p_key: key,
    p_enabled: parsed.data.enabled,
    p_requires: moduleDefinition(key)?.requires ?? [],
  });
  if (error) return fail(error.code === "42501" ? t.errors.notAllowed : t.errors.generic);

  revalidatePath("/", "layout");
  return ok();
}

const presetSchema = z.object({ preset: z.enum(["real_estate_sales", "interior_projects", "minimal"]) });

/**
 * Apply a reference configuration: the modules a kind of business uses, in
 * dependency order. Record types and pipelines are installed by the modules
 * themselves when they come on (lib/records, lib/crm).
 */
export async function applyPreset(input: unknown): Promise<ActionResult<{ enabled: ModuleKey[] }>> {
  const viewer = await requireOrg();
  const t = getPlatform(viewer.org.language).modules;
  if (!viewerCan(viewer, "modules.manage")) return fail(t.errors.notAllowed);
  const parsed = presetSchema.safeParse(input);
  if (!parsed.success) return fail(t.errors.unknown);

  const preset = MODULE_PRESETS[parsed.data.preset as PresetKey];
  const supabase = await createClient();
  const enabled: ModuleKey[] = [];
  for (const key of presetEnableOrder(preset)) {
    const { error } = await supabase.rpc("set_org_module", {
      p_org: viewer.org.id,
      p_key: key,
      p_enabled: true,
      p_requires: moduleDefinition(key)?.requires ?? [],
    });
    if (error) return fail(t.errors.generic);
    enabled.push(key);
  }
  revalidatePath("/", "layout");
  return ok({ enabled });
}
