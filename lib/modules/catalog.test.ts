import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import {
  CORE_MODULES,
  DEFAULT_ENABLED_MODULES,
  MODULE_CATALOG,
  checkModuleChange,
  dependentsOf,
  resolveEnabledModules,
} from "./catalog";

const SQL = readFileSync("supabase/migrations/0030_platform_foundation.sql", "utf8");

function sqlList(fn: string): string[] {
  const match = new RegExp(`function ${fn}\\(p_key text\\) returns boolean as \\$\\$\\s*select p_key in \\(([^)]*)\\)`).exec(SQL);
  if (!match) throw new Error(`${fn} not found in 0030`);
  return match[1].split(",").map((s) => s.trim().replace(/'/g, "")).sort();
}

describe("the module catalogue", () => {
  it("agrees with the database about which modules are core", () => {
    expect([...CORE_MODULES].sort()).toEqual(sqlList("module_is_core"));
  });

  it("agrees with the database about which optional modules are on by default", () => {
    expect([...DEFAULT_ENABLED_MODULES].sort()).toEqual(sqlList("module_default_enabled"));
  });

  it("only depends on modules that exist, and never on itself", () => {
    for (const m of MODULE_CATALOG) {
      for (const dep of m.requires) {
        expect(MODULE_CATALOG.some((d) => d.key === dep), `${m.key} → ${dep}`).toBe(true);
        expect(dep).not.toBe(m.key);
      }
    }
  });

  it("resolves an untouched business to core plus defaults", () => {
    const on = resolveEnabledModules([]);
    expect(on.has("today")).toBe(true);
    expect(on.has("attendance")).toBe(true);
    expect(on.has("crm")).toBe(false);
  });

  it("honours a row over the default, but never for a core module", () => {
    const on = resolveEnabledModules([
      { module_key: "attendance", enabled: false },
      { module_key: "crm", enabled: true },
      { module_key: "work", enabled: false },
    ]);
    expect(on.has("attendance")).toBe(false);
    expect(on.has("crm")).toBe(true);
    expect(on.has("work")).toBe(true);
  });

  it("refuses to enable a module before what it needs", () => {
    const on = resolveEnabledModules([]);
    expect(checkModuleChange("campaigns", true, on)).toEqual({
      ok: false,
      reason: "missing_dependency",
      modules: ["crm"],
    });
    on.add("crm");
    expect(checkModuleChange("campaigns", true, on)).toEqual({ ok: true });
  });

  it("refuses to disable a module something else still uses", () => {
    const on = resolveEnabledModules([
      { module_key: "crm", enabled: true },
      { module_key: "campaigns", enabled: true },
    ]);
    expect(checkModuleChange("crm", false, on)).toEqual({ ok: false, reason: "has_dependents", modules: ["campaigns"] });
  });

  it("never lets a core module be switched", () => {
    expect(checkModuleChange("work", false, resolveEnabledModules([]))).toMatchObject({ ok: false, reason: "core" });
    expect(checkModuleChange("nonsense", true, resolveEnabledModules([]))).toMatchObject({ ok: false, reason: "unknown" });
  });

  it("walks dependents transitively", () => {
    expect(dependentsOf("projects")).toEqual(expect.arrayContaining(["vendors", "customer_experience", "custom_domains"]));
    expect(dependentsOf("crm")).toEqual(expect.arrayContaining(["website_integration", "campaigns"]));
  });
});
