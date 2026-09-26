import { beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

/**
 * Cross-tenant attacks, deliberately, against the database API — the way
 * anyone with the publishable key can call it. Two reference businesses
 * (Omega Infra, Shelter Xperts), an owner and a member in each, a customer
 * of Shelter, and an anonymous caller. Every sensitive table is read and
 * written across the boundary; every answer must be empty or refused.
 *
 * Requires the local stack and `npx jiti scripts/local/seed-platform.ts`.
 */
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(URL)) throw new Error(`Refusing to run against ${URL || "(no URL)"}: not a local stack.`);
const PASSWORD = "waakya-platform-pass";

type Client = SupabaseClient<Database>;
const anon = () => createClient<Database>(URL, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
const admin = createClient<Database>(URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });

async function signIn(email: string): Promise<Client> {
  const client = anon();
  const { error } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw new Error(`sign in ${email}: ${error.message} — run scripts/local/seed-platform.ts first`);
  return client;
}

const TENANT_TABLES = [
  "crm_contacts", "crm_opportunities", "crm_activities", "crm_pipelines", "crm_pipeline_stages",
  "record_types", "record_fields", "records",
  "projects", "project_milestones", "project_updates", "customer_access", "customer_project_access", "customer_decisions", "customer_messages",
  "vendors", "vendor_assignments", "vendor_payments",
  "campaigns", "campaign_recipients", "inbound_messages", "message_templates",
  "automation_rules", "automation_runs", "integration_keys", "integration_requests",
  "organization_modules", "organization_domains", "domain_events",
  "tasks", "task_events", "proofs", "documents", "notifications", "memberships", "invites", "approvals", "conversations", "messages",
] as const;

let omega: { id: string; owner: Client; member: Client };
let shelter: { id: string; owner: Client; member: Client; customer: Client; projectId: string };
let anonClient: Client;

beforeAll(async () => {
  const { data: orgs } = await admin.from("orgs").select("id, name").in("name", ["Omega Infra", "Shelter Xperts"]);
  const omegaId = orgs?.find((o) => o.name === "Omega Infra")?.id;
  const shelterId = orgs?.find((o) => o.name === "Shelter Xperts")?.id;
  if (!omegaId || !shelterId) throw new Error("Run scripts/local/seed-platform.ts first");
  omega = { id: omegaId, owner: await signIn("vikram@omega.test"), member: await signIn("pooja@omega.test") };
  const { data: project } = await admin.from("projects").select("id").eq("org_id", shelterId).limit(1).single();
  const customer = await signIn("sterling@customer.test");
  // The customer claims their invite so the principal exists for these tests.
  const { data: access } = await admin.from("customer_access").select("invite_token, user_id").eq("org_id", shelterId).single();
  if (!access?.user_id) {
    const { error } = await customer.rpc("accept_customer_invite", { p_token: access!.invite_token });
    if (error) throw new Error(`accept invite: ${error.message}`);
  }
  shelter = { id: shelterId, owner: await signIn("priya@shelter.test"), member: await signIn("rahul@shelter.test"), customer, projectId: project!.id };
  anonClient = anon();
});

describe("reads never cross the tenant boundary", () => {
  for (const table of TENANT_TABLES) {
    it(`Omega's owner sees none of Shelter's ${table}`, async () => {
      const { data, error } = await omega.owner.from(table).select("*").eq("org_id", shelter.id).limit(5);
      // Some tables hide the hash column from clients; a column error is still "nothing seen".
      if (error && error.code === "42501") return;
      expect(error, table).toBeNull();
      expect(data, table).toEqual([]);
    });
  }
  it("an anonymous caller sees nothing at all", async () => {
    for (const table of ["crm_contacts", "records", "projects", "customer_decisions", "domain_events", "organization_modules", "automation_rules"] as const) {
      const { data } = await anonClient.from(table).select("id").limit(1);
      expect(data ?? [], table).toEqual([]);
    }
  });
  it("Omega's owner cannot resolve Shelter's rows by id either", async () => {
    const { data: contact } = await admin.from("crm_contacts").select("id").eq("org_id", shelter.id).limit(1).single();
    const { data } = await omega.owner.from("crm_contacts").select("id").eq("id", contact!.id);
    expect(data).toEqual([]);
  });
});

describe("writes are refused across the boundary and above one's role", () => {
  it("cannot insert into another business's CRM, records, vendors, campaigns or rules", async () => {
    const uid = (await omega.owner.auth.getUser()).data.user!.id;
    const attempts: Promise<{ error: unknown }>[] = [
      omega.owner.from("crm_contacts").insert({ org_id: shelter.id, full_name: "Intruder", phone_e164: "+919999999999", created_by: uid }),
      omega.owner.from("records").insert({ org_id: shelter.id, record_type_id: (await admin.from("record_types").select("id").eq("org_id", shelter.id).single()).data!.id, title: "Intruder", created_by: uid }),
      omega.owner.from("vendors").insert({ org_id: shelter.id, name: "Intruder", created_by: uid }),
      omega.owner.from("campaigns").insert({ org_id: shelter.id, name: "Intruder", channel: "email", created_by: uid }),
      omega.owner.from("automation_rules").insert({ org_id: shelter.id, name: "Intruder", trigger_event: "lead.created", created_by: uid }),
      omega.owner.from("project_updates").insert({ org_id: shelter.id, project_id: shelter.projectId, body: "Intruder", customer_visible: true, created_by: uid }),
      omega.owner.from("customer_decisions").insert({ org_id: shelter.id, project_id: shelter.projectId, title: "Intruder", options: [{ key: "a", label: "A" }], requested_by: uid }),
      omega.owner.from("organization_domains").insert({ org_id: shelter.id, hostname: "evil.example.com", verification_token: "x", created_by: uid }),
    ];
    for (const attempt of attempts) expect((await attempt).error, "cross-tenant insert").not.toBeNull();
  });
  it("cannot update another business's rows, even naming their ids", async () => {
    const { data: contact } = await admin.from("crm_contacts").select("id").eq("org_id", shelter.id).limit(1).single();
    const { data, error } = await omega.owner.from("crm_contacts").update({ full_name: "Hijacked" }).eq("id", contact!.id).select("id");
    expect(error).toBeNull();
    expect(data).toEqual([]);
    const { data: record } = await admin.from("records").select("id").eq("org_id", shelter.id).limit(1).single();
    const { data: touched } = await omega.owner.from("records").update({ status_key: "planned" }).eq("id", record!.id).select("id");
    expect(touched).toEqual([]);
  });
  it("a member cannot switch modules, define record types, mint keys or manage rules", async () => {
    const uid = (await omega.member.auth.getUser()).data.user!.id;
    expect((await omega.member.rpc("set_org_module", { p_org: omega.id, p_key: "vendors", p_enabled: true })).error).not.toBeNull();
    expect((await omega.member.rpc("install_record_type", { p_org: omega.id, p_key: "sneaky", p_name: "S", p_name_plural: "S", p_icon: null as never, p_description: null as never, p_statuses: [{ key: "a", label: "A" }] as never, p_default_status: "a", p_customer_visible_default: false, p_template_key: null as never, p_fields: [] as never })).error).not.toBeNull();
    expect((await omega.member.from("integration_keys").insert({ org_id: omega.id, name: "x", key_prefix: "deadbeef", key_hash: "0".repeat(64), created_by: uid })).error).not.toBeNull();
    expect((await omega.member.from("automation_rules").insert({ org_id: omega.id, name: "x", trigger_event: "lead.created", created_by: uid })).error).not.toBeNull();
    expect((await omega.member.from("vendor_payments").select("id")).data).toEqual([]);
  });
  it("a member cannot reassign a lead, verify vendor work or send a campaign", async () => {
    const uid = (await omega.member.auth.getUser()).data.user!.id;
    const { data: contact } = await admin.from("crm_contacts").select("id").eq("org_id", omega.id).not("owner_id", "is", null).neq("owner_id", uid).limit(1).single();
    expect((await omega.member.from("crm_contacts").update({ owner_id: uid }).eq("id", contact!.id)).error).not.toBeNull();
    // A refusal is either an error or a policy that lets nothing through.
    const { data: assignment } = await admin.from("vendor_assignments").select("id").eq("org_id", shelter.id).limit(1).single();
    const verify = await shelter.member.from("vendor_assignments").update({ execution_status: "verified" }).eq("id", assignment!.id).select("id");
    expect(verify.error !== null || (verify.data ?? []).length === 0).toBe(true);
    const { data: after } = await admin.from("vendor_assignments").select("execution_status").eq("id", assignment!.id).single();
    expect(after!.execution_status).not.toBe("verified");
    const { data: campaign } = await admin.from("campaigns").select("id").eq("org_id", omega.id).limit(1).maybeSingle();
    if (campaign) {
      const { data } = await omega.member.from("campaigns").update({ status: "sent" }).eq("id", campaign.id).select("id");
      expect(data).toEqual([]);
    }
  });
});

describe("internal-only functions stay internal", () => {
  it("anon cannot call the definer functions that write or reveal", async () => {
    for (const fn of ["resolve_request_notifications", "push_notification", "display_name", "automation_apply", "notify_automation_failure", "set_org_module", "record_customer_decision", "crm_upsert_lead"]) {
      const { error } = await anonClient.rpc(fn as never, {} as never);
      expect(error, fn).not.toBeNull();
      expect(String(error!.message), fn).not.toMatch(/^$/);
    }
  });
  it("a signed-in member cannot run automation_apply or push a cross-business notification", async () => {
    expect((await omega.member.rpc("automation_apply", { p_org: omega.id, p_run: "00000000-0000-0000-0000-000000000000", p_depth: 1, p_action: {}, p_event: {} })).error).not.toBeNull();
    const { data: victim } = await admin.from("memberships").select("user_id").eq("org_id", shelter.id).limit(1).single();
    expect((await omega.member.rpc("push_user_notification", { p_org: shelter.id, p_user: victim!.user_id, p_event: "task_assigned", p_body: "phish", p_href: "/kaam/x" })).error).not.toBeNull();
    expect((await omega.member.rpc("push_user_notification", { p_org: omega.id, p_user: victim!.user_id, p_event: "task_assigned", p_body: "phish" })).error).not.toBeNull();
    expect((await omega.member.rpc("push_user_notification", { p_org: omega.id, p_user: (await omega.member.auth.getUser()).data.user!.id, p_event: "task_assigned", p_body: "x", p_href: "https://evil.example" })).error).not.toBeNull();
  });
  it("a lead cannot be pushed into another business through the CRM door", async () => {
    expect((await omega.owner.rpc("crm_upsert_lead", { p_org: shelter.id, p_full_name: "Intruder", p_phone: "+919999999998" })).error).not.toBeNull();
  });
});

describe("the customer principal is a window, not a door", () => {
  it("sees their project and only what was published, nothing of the team", async () => {
    const { data: projects } = await shelter.customer.from("projects").select("id, name");
    expect(projects?.map((p) => p.id)).toEqual([shelter.projectId]);
    for (const table of ["tasks", "memberships", "vendors", "vendor_assignments", "vendor_payments", "crm_contacts", "automation_rules", "integration_keys", "domain_events", "notifications"] as const) {
      const { data } = await shelter.customer.from(table).select("id").limit(5);
      expect(data ?? [], table).toEqual([]);
    }
    const { data: internal } = await shelter.customer.from("project_updates").select("id").eq("customer_visible", false);
    expect(internal).toEqual([]);
    const { data: hidden } = await shelter.customer.from("records").select("id").eq("customer_visible", false);
    expect(hidden).toEqual([]);
  });
  it("cannot write into the business or decide for another project", async () => {
    const uid = (await shelter.customer.auth.getUser()).data.user!.id;
    expect((await shelter.customer.from("project_updates").insert({ org_id: shelter.id, project_id: shelter.projectId, body: "x", created_by: uid })).error).not.toBeNull();
    expect((await shelter.customer.from("tasks").insert({ org_id: shelter.id, title: "x", created_by: uid, assigned_to: uid })).error).not.toBeNull();
    const { data: omegaProject } = await admin.from("projects").select("id").eq("org_id", omega.id).limit(1).single();
    expect((await shelter.customer.from("projects").select("id").eq("id", omegaProject!.id)).data).toEqual([]);
    const { data: decisions } = await admin.from("customer_decisions").select("id").eq("org_id", omega.id).limit(1);
    if (decisions?.length) expect((await shelter.customer.rpc("record_customer_decision", { p_decision: decisions[0].id, p_option: "x" })).error).not.toBeNull();
    expect((await shelter.customer.rpc("post_customer_message", { p_project: omegaProject!.id, p_body: "hi" })).error).not.toBeNull();
  });
  it("Omega's owner cannot see Shelter's customer, and vice versa", async () => {
    expect((await omega.owner.from("customer_access").select("id").eq("org_id", shelter.id)).data).toEqual([]);
    expect((await shelter.member.from("customer_access").select("id").eq("org_id", omega.id)).data).toEqual([]);
  });
});

describe("storage stays inside the business", () => {
  it("lists nothing under another business's prefix and cannot write there", async () => {
    for (const bucket of ["proofs", "documents"]) {
      const { data } = await omega.owner.storage.from(bucket).list(`orgs/${shelter.id}`);
      expect(data ?? [], bucket).toEqual([]);
      const { error } = await omega.owner.storage.from(bucket).upload(`orgs/${shelter.id}/intruder-${Date.now()}.txt`, new Blob(["x"], { type: "text/plain" }));
      expect(error, bucket).not.toBeNull();
    }
    const { data } = await shelter.customer.storage.from("proofs").list(`orgs/${shelter.id}`);
    expect(data ?? []).toEqual([]);
  });
});
