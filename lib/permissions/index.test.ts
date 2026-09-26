import { describe, expect, it } from "vitest";
import { CAPABILITIES, can } from "./index";

describe("the permission matrix", () => {
  it("gives customers exactly their own doors and nothing of the business", () => {
    const customerCan = CAPABILITIES.filter((c) => can("customer", c));
    expect(customerCan.sort()).toEqual(["portal.decision.decide", "portal.project.read"]);
  });

  it("keeps money, modules and integrations with the owner and admin", () => {
    for (const c of ["modules.manage", "vendors.payment.record", "integrations.manage", "automation.manage", "domains.manage"] as const) {
      expect(can("owner", c), c).toBe(true);
      expect(can("admin", c), c).toBe(true);
      expect(can("manager", c), c).toBe(false);
      expect(can("member", c), c).toBe(false);
    }
  });

  it("lets a manager run the work but not change who owns the business", () => {
    expect(can("manager", "tasks.verify")).toBe(true);
    expect(can("manager", "crm.assign")).toBe(true);
    expect(can("manager", "team.role.change")).toBe(false);
  });

  it("lets a member work records and the CRM but not verify", () => {
    expect(can("member", "records.write")).toBe(true);
    expect(can("member", "crm.write")).toBe(true);
    expect(can("member", "tasks.verify")).toBe(false);
    expect(can("member", "vendors.verify")).toBe(false);
  });

  it("answers no for nobody", () => {
    expect(can(null, "crm.read")).toBe(false);
    expect(can(undefined, "audit.read")).toBe(false);
  });
});
