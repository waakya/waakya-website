/**
 * The module catalogue: what Waakya can do, in one list the whole product
 * reads. A business turns optional capabilities on and off; core ones are
 * always there. The database mirrors the two fixed lists below
 * (module_is_core, module_default_enabled in 0030) and a test keeps them equal.
 */

export type ModuleKey =
  | "today"
  | "conversations"
  | "work"
  | "projects"
  | "documents"
  | "approvals"
  | "team"
  | "search"
  | "notifications"
  | "attendance"
  | "checklists"
  | "crm"
  | "records"
  | "vendors"
  | "customer_experience"
  | "automation"
  | "website_integration"
  | "campaigns"
  | "custom_domains";

export interface ModuleDefinition {
  key: ModuleKey;
  /** Core modules are always on and cannot be switched. */
  core: boolean;
  /** Optional modules that are on unless a business turns them off. */
  defaultEnabled: boolean;
  /** Must be enabled before this one can be. */
  requires: ModuleKey[];
  /** Where in the product it lives; used to group the settings screen. */
  area: "core" | "operations" | "customers" | "growth" | "platform";
}

export const MODULE_CATALOG: readonly ModuleDefinition[] = [
  { key: "today", core: true, defaultEnabled: true, requires: [], area: "core" },
  { key: "conversations", core: true, defaultEnabled: true, requires: [], area: "core" },
  { key: "work", core: true, defaultEnabled: true, requires: [], area: "core" },
  { key: "projects", core: true, defaultEnabled: true, requires: [], area: "core" },
  { key: "documents", core: true, defaultEnabled: true, requires: [], area: "core" },
  { key: "approvals", core: true, defaultEnabled: true, requires: [], area: "core" },
  { key: "team", core: true, defaultEnabled: true, requires: [], area: "core" },
  { key: "search", core: true, defaultEnabled: true, requires: [], area: "core" },
  { key: "notifications", core: true, defaultEnabled: true, requires: [], area: "core" },
  { key: "attendance", core: false, defaultEnabled: true, requires: [], area: "operations" },
  { key: "checklists", core: false, defaultEnabled: true, requires: ["work"], area: "operations" },
  { key: "crm", core: false, defaultEnabled: false, requires: [], area: "customers" },
  { key: "records", core: false, defaultEnabled: false, requires: [], area: "operations" },
  { key: "vendors", core: false, defaultEnabled: false, requires: ["records", "projects"], area: "operations" },
  { key: "customer_experience", core: false, defaultEnabled: false, requires: ["projects"], area: "customers" },
  { key: "automation", core: false, defaultEnabled: false, requires: [], area: "platform" },
  { key: "website_integration", core: false, defaultEnabled: false, requires: ["crm"], area: "growth" },
  { key: "campaigns", core: false, defaultEnabled: false, requires: ["crm"], area: "growth" },
  { key: "custom_domains", core: false, defaultEnabled: false, requires: ["customer_experience"], area: "platform" },
];

export const MODULE_KEYS: readonly ModuleKey[] = MODULE_CATALOG.map((m) => m.key);

export function moduleDefinition(key: string): ModuleDefinition | undefined {
  return MODULE_CATALOG.find((m) => m.key === key);
}

export function isModuleKey(value: string): value is ModuleKey {
  return MODULE_CATALOG.some((m) => m.key === value);
}

export const CORE_MODULES: readonly ModuleKey[] = MODULE_CATALOG.filter((m) => m.core).map((m) => m.key);
export const DEFAULT_ENABLED_MODULES: readonly ModuleKey[] = MODULE_CATALOG.filter(
  (m) => !m.core && m.defaultEnabled,
).map((m) => m.key);

/** A row of organization_modules, reduced to what the resolver needs. */
export interface ModuleRow {
  module_key: string;
  enabled: boolean;
}

/**
 * The set of modules a business has on: core, plus defaults, plus whatever it
 * switched. The same rule as org_module_enabled() in the database.
 */
export function resolveEnabledModules(rows: readonly ModuleRow[]): Set<ModuleKey> {
  const enabled = new Set<ModuleKey>();
  for (const definition of MODULE_CATALOG) {
    const row = rows.find((r) => r.module_key === definition.key);
    const on = definition.core ? true : row ? row.enabled : definition.defaultEnabled;
    if (on) enabled.add(definition.key);
  }
  return enabled;
}

/** Every module that depends, directly or through others, on `key`. */
export function dependentsOf(key: ModuleKey): ModuleKey[] {
  const out: ModuleKey[] = [];
  const visit = (k: ModuleKey) => {
    for (const m of MODULE_CATALOG) {
      if (m.requires.includes(k) && !out.includes(m.key)) {
        out.push(m.key);
        visit(m.key);
      }
    }
  };
  visit(key);
  return out;
}

export type ModuleChangeCheck =
  | { ok: true }
  | { ok: false; reason: "core" | "unknown" | "missing_dependency" | "has_dependents"; modules: ModuleKey[] };

/** Can this module be switched to `enabled`, given what is on right now? */
export function checkModuleChange(
  key: string,
  enabled: boolean,
  current: ReadonlySet<ModuleKey>,
): ModuleChangeCheck {
  const definition = moduleDefinition(key);
  if (!definition) return { ok: false, reason: "unknown", modules: [] };
  if (definition.core) return { ok: false, reason: "core", modules: [] };
  if (enabled) {
    const missing = definition.requires.filter((dep) => !current.has(dep));
    if (missing.length) return { ok: false, reason: "missing_dependency", modules: missing };
    return { ok: true };
  }
  const blocking = dependentsOf(definition.key).filter((dep) => current.has(dep));
  if (blocking.length) return { ok: false, reason: "has_dependents", modules: blocking };
  return { ok: true };
}
