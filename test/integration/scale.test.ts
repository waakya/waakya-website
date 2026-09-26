import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

/**
 * Realistic Phase-1 volume, and the 200-item class of bug specifically: a
 * business with 1,500 open tasks and 600 customers must count exactly and
 * page correctly, whatever any list cap does.
 */
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(URL)) throw new Error(`Refusing to run against ${URL || "(no URL)"}: not a local stack.`);
const admin = createClient<Database>(URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });

let orgId = "";
let ownerId = "";
let staffId = "";

beforeAll(async () => {
  const { data: users } = await admin.auth.admin.listUsers({ perPage: 1000 });
  ownerId = users!.users.find((u) => u.email === "owner@waakya.test")!.id;
  staffId = users!.users.find((u) => u.email === "staff@waakya.test")!.id;
  await admin.from("orgs").delete().eq("name", "Scale QA");
  const { data: org } = await admin.from("orgs").insert({ name: "Scale QA", language: "en", created_by: ownerId }).select("id").single();
  orgId = org!.id;
  await admin.from("memberships").insert([{ org_id: orgId, user_id: ownerId, role: "owner" }, { org_id: orgId, user_id: staffId, role: "member" }]);
  await admin.from("organization_modules").insert({ org_id: orgId, module_key: "crm", enabled: true });
  const now = Date.now();
  const tasks = Array.from({ length: 1500 }, (_, i) => ({
    org_id: orgId,
    title: `Scale task ${i}`,
    created_by: ownerId,
    assigned_to: staffId,
    state: (i % 10 === 0 ? "done" : "delivered") as "done" | "delivered",
    priority: "normal" as const,
    // A third late, a third due tomorrow, a third far out; all delivered two hours ago.
    due_at: new Date(now + (i % 3 === 0 ? -3600_000 : i % 3 === 1 ? 24 * 3600_000 : 7 * 24 * 3600_000)).toISOString(),
    delivered_at: new Date(now - 2 * 3600_000).toISOString(),
  }));
  for (let i = 0; i < tasks.length; i += 500) {
    const { error } = await admin.from("tasks").insert(tasks.slice(i, i + 500));
    if (error) throw new Error(error.message);
  }
  const contacts = Array.from({ length: 600 }, (_, i) => ({ org_id: orgId, full_name: `Scale contact ${i}`, phone_e164: `+9180000${String(i).padStart(5, "0")}`, kind: i % 4 === 0 ? "customer" : "lead", created_by: ownerId }));
  for (let i = 0; i < contacts.length; i += 300) {
    const { error } = await admin.from("crm_contacts").insert(contacts.slice(i, i + 300));
    if (error) throw new Error(error.message);
  }
}, 240_000);

afterAll(async () => {
  await admin.from("orgs").delete().eq("id", orgId);
});

describe("counts at scale", () => {
  it("the day's numbers come from the database and match a direct count", async () => {
    const { data, error } = await admin.rpc("org_task_counts", { p_org: orgId });
    expect(error).toBeNull();
    const row = data![0];
    const { count: late } = await admin.from("tasks").select("id", { count: "exact", head: true }).eq("org_id", orgId).lt("due_at", new Date().toISOString()).not("state", "in", '("done","verified","cancelled")');
    const { count: unseen } = await admin.from("tasks").select("id", { count: "exact", head: true }).eq("org_id", orgId).eq("state", "delivered");
    const { count: sent } = await admin.from("tasks").select("id", { count: "exact", head: true }).eq("org_id", orgId);
    expect(row.late).toBe(late);
    expect(row.unseen).toBe(unseen); // delivered two hours ago, past the 15-minute default
    expect(row.sent_today).toBe(sent);
    expect(row.late).toBeGreaterThan(400);
  });
  it("PostgREST's own row cap is below the data, so a plain list would have undercounted", async () => {
    const { data } = await admin.from("tasks").select("id").eq("org_id", orgId).limit(5000);
    expect(data!.length).toBeLessThan(1500);
  });
  it("customers page with an exact total that never depends on the page", async () => {
    const { count: total } = await admin.from("crm_contacts").select("id", { count: "exact", head: true }).eq("org_id", orgId);
    expect(total).toBe(600);
    const { data: page24, count } = await admin.from("crm_contacts").select("id", { count: "exact" }).eq("org_id", orgId).order("full_name").range(575, 599);
    expect(count).toBe(600);
    expect(page24!.length).toBe(25);
    const { count: leads } = await admin.from("crm_contacts").select("id", { count: "exact", head: true }).eq("org_id", orgId).eq("kind", "lead");
    expect(leads).toBe(450);
  });
});
