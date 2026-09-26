/**
 * The two reference tenants on the LOCAL Supabase stack, configured only
 * through data — the same modules, record types and pipelines any business
 * could set up from its own settings screens:
 *
 *   Omega Infra      property sales: CRM, property inventory, campaigns,
 *                    website leads, automation, attendance.
 *   Shelter Xperts   interior projects: CRM, work packages, vendors, the
 *                    customer portal, automation, website leads, attendance.
 *
 * Run:  npx jiti scripts/local/seed-platform.ts
 * Re-runnable: it deletes both businesses and rebuilds them.
 * Sign in as anyone below with the password `waakya-platform-pass`
 * (through /api/test-login locally, or dev:login).
 */
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

import { RECORD_TEMPLATES } from "../../lib/records/templates";
import { MODULE_PRESETS, presetEnableOrder } from "../../lib/modules/presets";

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(URL)) throw new Error(`Refusing to seed: ${URL || "(no URL)"} is not a local Supabase stack.`);

export const PASSWORD = "waakya-platform-pass";
const db = createClient(URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });
const DAY = 24 * 3600 * 1000;
const now = Date.now();
const at = (ms: number) => new Date(now + ms).toISOString();
const istDate = (days: number) => new Date(now + days * DAY + 5.5 * 3600 * 1000).toISOString().slice(0, 10);

async function must<R extends { data: unknown; error: unknown }>(label: string, p: PromiseLike<R>): Promise<NonNullable<R["data"]>> {
  const { data, error } = await p;
  if (error) throw new Error(`${label}: ${JSON.stringify(error)}`);
  return data as NonNullable<R["data"]>;
}

type Person = { email: string; name: string; language: string; role: "owner" | "admin" | "manager" | "member"; id?: string };

const TENANTS = {
  omega: {
    name: "Omega Infra",
    language: "hi-Latn",
    preset: "real_estate_sales" as const,
    people: [
      { email: "vikram@omega.test", name: "Vikram Rao", language: "en", role: "owner" as const },
      { email: "sunil@omega.test", name: "Sunil Patil", language: "hi-Latn", role: "manager" as const },
      { email: "pooja@omega.test", name: "Pooja Kulkarni", language: "hi-Latn", role: "member" as const },
    ],
  },
  shelter: {
    name: "Shelter Xperts",
    language: "en",
    preset: "interior_projects" as const,
    people: [
      { email: "priya@shelter.test", name: "Priya Sharma", language: "en", role: "owner" as const },
      { email: "neha@shelter.test", name: "Neha Singh", language: "en", role: "manager" as const },
      { email: "rahul@shelter.test", name: "Rahul Verma", language: "hi-Latn", role: "member" as const },
    ],
  },
};
const CUSTOMER = { email: "sterling@customer.test", name: "Sterling Group" };

async function upsertUser(email: string, name: string, language: string): Promise<string> {
  const { data: list } = await db.auth.admin.listUsers({ perPage: 1000 });
  const existing = list?.users.find((u) => u.email === email);
  let id: string;
  if (existing) {
    id = existing.id;
    await must("update user", db.auth.admin.updateUserById(id, { password: PASSWORD, email_confirm: true }));
  } else {
    const created = await must("create user", db.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true, user_metadata: { full_name: name } }));
    if (!created.user) throw new Error("create user returned no user");
    id = created.user.id;
  }
  await must("profile", db.from("profiles").upsert({ id, full_name: name, language, phone: null }));
  return id;
}

async function removeTenant(name: string) {
  const { data: orgs } = await db.from("orgs").select("id").eq("name", name);
  for (const o of orgs ?? []) await must("delete org", db.from("orgs").delete().eq("id", o.id));
}

async function buildTenant(key: keyof typeof TENANTS) {
  const t = TENANTS[key];
  await removeTenant(t.name);
  const people: Person[] = [];
  for (const p of t.people) people.push({ ...p, id: await upsertUser(p.email, p.name, p.language) });
  const owner = people.find((p) => p.role === "owner")!;
  const org = await must("org", db.from("orgs").insert({ name: t.name, language: t.language, created_by: owner.id!, address: key === "omega" ? "Nashik" : "Pune" }).select("id").single());
  const orgId = org.id;
  await must("memberships", db.from("memberships").insert(people.map((p) => ({ org_id: orgId, user_id: p.id!, role: p.role }))));

  // Modules from the preset, in dependency order — data, not code.
  const preset = MODULE_PRESETS[t.preset];
  await must(
    "modules",
    db.from("organization_modules").upsert(presetEnableOrder(preset).map((k) => ({ org_id: orgId, module_key: k, enabled: true, enabled_at: at(0), enabled_by: owner.id })), { onConflict: "org_id,module_key" }),
  );
  for (const templateKey of preset.recordTemplates) {
    const tpl = RECORD_TEMPLATES[templateKey];
    await must(
      `record type ${templateKey}`,
      db.rpc("install_record_type", {
        p_org: orgId,
        p_key: tpl.key,
        p_name: tpl.name,
        p_name_plural: tpl.namePlural,
        p_icon: tpl.icon,
        p_description: tpl.description,
        p_statuses: tpl.statuses as never,
        p_default_status: tpl.defaultStatus,
        p_customer_visible_default: tpl.customerVisibleDefault,
        p_template_key: tpl.key,
        p_fields: tpl.fields.map((f, position) => ({ key: f.key, label: f.label, field_type: f.fieldType, options: f.options, required: f.required, position, show_in_list: f.showInList, customer_visible: f.customerVisible, unit: f.unit })) as never,
      }),
    );
  }
  await must("pipeline", db.rpc("crm_install_default_pipeline", { p_org: orgId }));
  const stages = await must("stages", db.from("crm_pipeline_stages").select("id, key").eq("org_id", orgId));
  const stage = (k: string) => stages.find((s) => s.key === k)!.id;
  const { data: type } = await db.from("record_types").select("id").eq("org_id", orgId).limit(1).maybeSingle();
  const manager = people.find((p) => p.role === "manager")!;
  const member = people.find((p) => p.role === "member")!;

  if (key === "omega") {
    const project = await must("project", db.from("projects").insert({ org_id: orgId, name: "Omega Heights · Tower A", status: "active", created_by: owner.id! }).select("id").single());
    const units = [
      ["101", "3bhk", 1, 1420, 8500000, "available"],
      ["102", "3bhk", 1, 1420, 8600000, "held"],
      ["103", "4bhk", 1, 1860, 11200000, "sold"],
      ["201", "2bhk", 2, 1040, 6200000, "available"],
      ["202", "2bhk", 2, 1040, 6200000, "booked"],
    ] as const;
    await must(
      "units",
      db.from("records").insert(
        units.map(([unit, kind, floor, area, price, status]) => ({
          org_id: orgId,
          record_type_id: type!.id,
          title: `A-${unit}`,
          status_key: status,
          values: { tower: "A", unit_number: unit, unit_type: kind, floor, area_sqft: area, price, facing: "east" },
          project_id: project.id,
          created_by: owner.id!,
        })),
      ),
    );
    const contacts = [
      ["Meera Joshi", "+919876511001", "meera@example.com", "website", "lead", manager.id],
      ["Ravi Deshmukh", "+919876511002", null, "referral", "lead", null],
      ["Anjali Kulkarni", null, "anjali@example.com", "campaign", "customer", member.id],
      ["Suresh Gaikwad", "+919876511004", "suresh@example.com", "walk_in", "customer", manager.id],
    ] as const;
    for (const [name, phone, email, source, kind, ownerId] of contacts) {
      const c = await must("contact", db.from("crm_contacts").insert({ org_id: orgId, full_name: name, phone_e164: phone, email, source, kind, owner_id: ownerId, tags: kind === "customer" ? ["tower-a"] : ["launch"], created_by: owner.id!, next_action_at: kind === "lead" ? at(2 * 3600 * 1000) : null, next_action_note: kind === "lead" ? "Call about Tower A" : null }).select("id").single());
      await must("deal", db.from("crm_opportunities").insert({ org_id: orgId, contact_id: c.id, pipeline_id: stages.length ? (await must("p", db.from("crm_pipelines").select("id").eq("org_id", orgId).single())).id : "", stage_id: stage(kind === "customer" ? "won" : source === "website" ? "contacted" : "new"), title: kind === "customer" ? "3 BHK · Tower A" : "Enquiry · Tower A", value: 8500000, owner_id: ownerId, created_by: owner.id!, project_id: project.id }));
    }
    await must("template", db.from("message_templates").insert({ org_id: orgId, channel: "email", name: "Tower B launch", subject: "Tower B opens for booking", body: "Hello {{name}}, Tower B at Omega Heights opens for booking on Saturday. Reply to book a site visit.", status: "approved", created_by: owner.id! }));
    await must("rule", db.from("automation_rules").insert({ org_id: orgId, name: "Website enquiry: assign and follow up", trigger_event: "lead.created", conditions: { all: [{ field: "source", op: "eq", value: "website" }] }, actions: [{ type: "assign_contact", member_id: "" }, { type: "create_task", title: "Call {{title}}", due_in_minutes: 120, priority: "high" }], created_by: owner.id! }));
    const prefix = randomBytes(4).toString("hex");
    await must("key", db.from("integration_keys").insert({ org_id: orgId, name: "omegainfra.com", key_prefix: prefix, key_hash: "0".repeat(64), created_by: owner.id! }));
  } else {
    const customer = await must("customer", db.from("crm_contacts").insert({ org_id: orgId, full_name: CUSTOMER.name, email: CUSTOMER.email, phone_e164: "+919876522001", source: "referral", kind: "customer", owner_id: manager.id, created_by: owner.id! }).select("id").single());
    const pashan = await must("lead", db.from("crm_contacts").insert({ org_id: orgId, full_name: "Pashan Clinic", phone_e164: "+919876522002", source: "website", kind: "lead", owner_id: manager.id, created_by: owner.id!, next_action_at: at(3 * 3600 * 1000), next_action_note: "Send revised quotation" }).select("id").single());
    const pipeline = await must("p", db.from("crm_pipelines").select("id").eq("org_id", orgId).single());
    await must("deal", db.from("crm_opportunities").insert({ org_id: orgId, contact_id: pashan.id, pipeline_id: pipeline.id, stage_id: stage("proposal"), title: "Clinic fit-out", value: 1940000, owner_id: manager.id, created_by: owner.id! }));
    const project = await must("project", db.from("projects").insert({ org_id: orgId, name: "Sterling Group · Kharadi office", status: "active", contact_id: customer.id, customer_summary: "Reception complete. Shutters ordered in Walnut. Lighting next.", created_by: owner.id!, start_date: istDate(-40), end_date: istDate(60) }).select("id").single());
    await must("members", db.from("project_members").insert([owner, manager, member].map((p) => ({ project_id: project.id, org_id: orgId, user_id: p.id! }))));
    await must(
      "milestones",
      db.from("project_milestones").insert(
        [["Reception", "done", -5], ["False ceiling", "done", -2], ["Shutters", "in_progress", 6], ["Conference-room lighting", "planned", 12], ["Handover", "planned", 60]].map(([name, status, d], i) => ({ org_id: orgId, project_id: project.id, name: String(name), status: String(status), due_date: istDate(Number(d)), done_at: status === "done" ? at(Number(d) * DAY) : null, position: i, customer_visible: true, created_by: owner.id! })),
      ),
    );
    await must("update", db.from("project_updates").insert({ org_id: orgId, project_id: project.id, kind: "progress", body: "Reception complete: false ceiling and lighting in place.", customer_visible: true, actor_kind: "user", created_by: manager.id }));
    const packages = [
      ["Reception false ceiling", "false_ceiling", 1, 180000, "complete", "paid"],
      ["Shutters · 12 units", "carpentry", 12, 110000, "ordered", "advance"],
      ["Conference-room lighting", "lighting", 1, 65000, "planned", "unpaid"],
    ] as const;
    const recordIds: string[] = [];
    for (const [item, category, qty, cost, status, pay] of packages) {
      const r = await must("package", db.from("records").insert({ org_id: orgId, record_type_id: type!.id, title: item, status_key: status, values: { area: "Reception", category, item, quantity: qty, cost, payment_status: pay, target_date: istDate(10) }, project_id: project.id, contact_id: customer.id, customer_visible: true, created_by: owner.id! }).select("id").single());
      recordIds.push(r.id);
    }
    const vendor = await must("vendor", db.from("vendors").insert({ org_id: orgId, name: "Deccan Shutters", phone_e164: "+919876533001", category: "Shutters", created_by: owner.id! }).select("id").single());
    await must("assignment", db.from("vendor_assignments").insert({ org_id: orgId, vendor_id: vendor.id, project_id: project.id, record_id: recordIds[1], title: "12 shutters, Walnut laminate", amount: 110000, due_date: istDate(6), customer_visible: true, record_status_on_verify: "complete", created_by: owner.id! }));
    const access = await must("access", db.from("customer_access").insert({ org_id: orgId, contact_id: customer.id, email: CUSTOMER.email, status: "invited", invite_token: randomBytes(16).toString("hex"), invited_by: owner.id! }).select("id, invite_token").single());
    await must("project access", db.from("customer_project_access").insert({ org_id: orgId, customer_access_id: access.id, project_id: project.id, granted_by: owner.id! }));
    await must("decision", db.from("customer_decisions").insert({ org_id: orgId, project_id: project.id, title: "Laminate for the shutters", description: "Deccan needs the choice before cutting.", options: [{ key: "walnut", label: "Walnut" }, { key: "oak", label: "Oak" }, { key: "teak", label: "Teak" }], blocks_record_id: recordIds[1], unblock_record_status: "in_progress", requested_by: manager.id }));
    await must("rule", db.from("automation_rules").insert({ org_id: orgId, name: "Vendor work submitted: ask a manager to verify", trigger_event: "vendor_work.submitted", conditions: { all: [] }, actions: [{ type: "request_verification", title: "" }], created_by: owner.id! }));
    console.log(`  Sterling Group invite: /portal/join/${access.invite_token} (sign in as ${CUSTOMER.email})`);
  }
  console.log(`✓ ${t.name}: ${people.map((p) => `${p.email} (${p.role})`).join(", ")}`);
}

async function main() {
  await upsertUser(CUSTOMER.email, CUSTOMER.name, "en");
  await buildTenant("omega");
  await buildTenant("shelter");
  console.log(`Password for everyone: ${PASSWORD}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
