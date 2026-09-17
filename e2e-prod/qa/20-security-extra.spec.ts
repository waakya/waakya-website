import { expect, test } from "@playwright/test";
import { admin, as, loadState, scenario } from "./kit";

/** TEST 20 (continued) — Direct-API abuse checks added during the fix cycle. */
test.describe.configure({ mode: "default" });

scenario(
  { id: "T20.2", area: "Data integrity", scenario: "Nobody can address a notification outside their business or write leave/attendance rows directly", initiator: "Rahul (direct API)", receiver: "Vikram (Org B)", expected: "Notification to an Org B person refused; direct inserts into leave balances and attendance refused", desktop: "API", mobile: "—", persistence: "Checked after", permission: "RLS" },
  async () => {
    const state = loadState();
    const rahul = await as("rahul");
    const spoof = await rahul.from("notifications").insert({ org_id: state.orgA, user_id: state.users.vikram.id, event: "approval_requested", body: "Fake request" });
    expect(spoof.error, "cross-org notification").not.toBeNull();
    const balance = await rahul.from("leave_balances").upsert({ org_id: state.orgA, user_id: state.users.rahul.id, balance_days: 99 });
    expect(balance.error, "self-credited leave").not.toBeNull();
    const attendance = await rahul.from("attendance_records").insert({ org_id: state.orgA, user_id: state.users.rahul.id, work_date: "2026-12-31", status: "present" });
    expect(attendance.error, "forged attendance").not.toBeNull();
    const { data } = await admin().from("leave_balances").select("balance_days").eq("org_id", state.orgA!).eq("user_id", state.users.rahul.id!).maybeSingle();
    expect(Number(data?.balance_days ?? 0)).toBeLessThan(99);
  },
);

scenario(
  { id: "T20.3", area: "Data integrity", scenario: "Manager cannot add himself or anyone else to the business directly", initiator: "Arjun (direct API)", receiver: "—", expected: "Membership insert refused (joining only through invites)", desktop: "API", mobile: "—", persistence: "Checked after", permission: "RLS" },
  async () => {
    const state = loadState();
    const arjun = await as("arjun");
    const add = await arjun.from("memberships").insert({ org_id: state.orgA, user_id: state.users.vikram.id, role: "owner" });
    expect(add.error, "manager inserted a membership").not.toBeNull();
    const { data } = await admin().from("memberships").select("role").eq("org_id", state.orgA!).eq("user_id", state.users.vikram.id!);
    expect(data ?? []).toEqual([]);
  },
);
