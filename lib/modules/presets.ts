import type { ModuleKey } from "./catalog";

/**
 * Reference configurations. A preset is nothing but a list of modules and the
 * record types and pipeline it installs; no code path ever asks which preset
 * a business came from.
 */
export type PresetKey = "real_estate_sales" | "interior_projects" | "minimal";

export interface ModulePreset {
  key: PresetKey;
  modules: ModuleKey[];
  /** Record type templates from lib/records/templates.ts to install. */
  recordTemplates: string[];
}

export const MODULE_PRESETS: Record<PresetKey, ModulePreset> = {
  // Omega Infra: sell property inventory to customers found by campaigns.
  real_estate_sales: {
    key: "real_estate_sales",
    modules: ["attendance", "checklists", "crm", "records", "campaigns", "website_integration", "automation"],
    recordTemplates: ["property_unit"],
  },
  // Shelter Xperts: run interior projects with vendors, show customers progress.
  interior_projects: {
    key: "interior_projects",
    modules: [
      "attendance",
      "checklists",
      "crm",
      "records",
      "vendors",
      "customer_experience",
      "automation",
      "website_integration",
    ],
    recordTemplates: ["work_package"],
  },
  minimal: { key: "minimal", modules: ["attendance", "checklists"], recordTemplates: [] },
};

/** Enable order that satisfies every dependency in the catalogue. */
export function presetEnableOrder(preset: ModulePreset): ModuleKey[] {
  const order: ModuleKey[] = [];
  const wanted = new Set(preset.modules);
  // Dependencies in the catalogue are shallow, so two passes settle it.
  const first: ModuleKey[] = ["attendance", "checklists", "crm", "records", "projects"];
  for (const k of first) if (wanted.has(k) && !order.includes(k)) order.push(k);
  for (const k of preset.modules) if (!order.includes(k)) order.push(k);
  return order.filter((k) => k !== "projects");
}
