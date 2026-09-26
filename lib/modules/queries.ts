import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { MODULE_CATALOG, resolveEnabledModules, type ModuleDefinition, type ModuleKey } from "./catalog";

export interface ModuleStatus extends ModuleDefinition {
  enabled: boolean;
  enabledAt: string | null;
  disabledAt: string | null;
  configuration: Record<string, unknown>;
}

/** Every module in the catalogue with its state for this business. */
export const getModuleStatuses = cache(async (orgId: string): Promise<ModuleStatus[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("organization_modules")
    .select("module_key, enabled, enabled_at, disabled_at, configuration")
    .eq("org_id", orgId);
  const rows = data ?? [];
  const enabled = resolveEnabledModules(rows);
  return MODULE_CATALOG.map((definition) => {
    const row = rows.find((r) => r.module_key === definition.key);
    return {
      ...definition,
      enabled: enabled.has(definition.key),
      enabledAt: row?.enabled_at ?? null,
      disabledAt: row?.disabled_at ?? null,
      configuration: (row?.configuration as Record<string, unknown>) ?? {},
    };
  });
});

export const getEnabledModules = cache(async (orgId: string): Promise<Set<ModuleKey>> => {
  const supabase = await createClient();
  const { data } = await supabase.from("organization_modules").select("module_key, enabled").eq("org_id", orgId);
  return resolveEnabledModules(data ?? []);
});
