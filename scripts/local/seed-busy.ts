/**
 * A genuinely busy business for Design V3's Today contract (progressive
 * disclosure, never hidden work), on the LOCAL Supabase stack only:
 *
 *   Gupta Logistics   an owner, a manager and 24 staff; hundreds of tasks in
 *                     every state (late, not seen, escalated, waiting to be
 *                     verified, open, finished), a dozen approvals and leave
 *                     requests waiting, and unread conversations.
 *
 * Run:  npx jiti scripts/local/seed-busy.ts
 * Re-runnable: it deletes Gupta Logistics and rebuilds it. Sign in with
 * owner@busy.test / manager@busy.test / staff01@busy.test, password
 * "waakya-design-pass" (development sign-in only).
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(URL)) {
  throw new Error(`Refusing to seed ${URL || "(no URL)"}: local stack only.`);
}
const PASSWORD = "waakya-design-pass";
const ORG = "Gupta Logistics";
const db = createClient(URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const now = Date.now();
const iso = (ms: number) => new Date(ms).toISOString();
const istDate = (days: number) =>
  new Date(now + days * DAY + 5.5 * HOUR).toISOString().slice(0, 10);

async function must<R extends { data: unknown; error: unknown }>(label: string, p: PromiseLike<R>): Promise<NonNullable<R["data"]>> {
  const { data, error } = await p;
  if (error) throw new Error(`${label}: ${JSON.stringify(error)}`);
  return data as NonNullable<R["data"]>;
}

type Person = { email: string; name: string; phone: string; language: string; id?: string };

const FIRST = ["Ramesh", "Suresh", "Pooja", "Anjali", "Vikas", "Deepa", "Manoj", "Kiran", "Sanjay", "Meena", "Arvind", "Lakshmi"];
const LAST = ["Yadav", "Patel", "Iyer", "Khan", "Nair", "Chauhan", "Reddy", "Das", "Joshi", "Bose", "Pillai", "Saxena"];
const owner: Person = { email: "owner@busy.test", name: "Vikram Gupta", phone: "9876600001", language: "en" };
const manager: Person = { email: "manager@busy.test", name: "Farah Siddiqui", phone: "9876600002", language: "en" };
const staff: Person[] = Array.from({ length: 24 }, (_, i) => ({
  email: `staff${String(i + 1).padStart(2, "0")}@busy.test`,
  // A few very long names, and two near-identical ones, on purpose.
  name:
    i === 0
      ? "Venkata Satya Sai Ramakrishna Subrahmanyam Chowdary"
      : i === 1
        ? "Ramesh Yadav"
        : i === 2
          ? "Ramesh Yaadav"
          : `${FIRST[i % FIRST.length]} ${LAST[(i * 5) % LAST.length]}`,
  phone: `98766${String(10 + i).padStart(5, "0")}`,
  language: i % 3 === 0 ? "hi" : "hi-Latn",
}));

async function upsertUser(p: Person, existing: { id: string; email?: string }[]) {
  const found = existing.find((u) => u.email === p.email);
  if (found) {
    await must("updateUser", db.auth.admin.updateUserById(found.id, { password: PASSWORD, email_confirm: true }));
    p.id = found.id;
  } else {
    const created = await must("createUser", db.auth.admin.createUser({ email: p.email, password: PASSWORD, email_confirm: true }));
    p.id = created.user!.id;
  }
  await must("profile", db.from("profiles").upsert({ id: p.id, full_name: p.name, phone: p.phone, language: p.language }));
}

const ORDER = ["delivered", "acknowledged", "accepted", "in_progress", "done", "verified"] as const;
type State = (typeof ORDER)[number] | "escalated";

const TITLES = [
  "Deliver 40 cartons to Bhiwandi warehouse",
  "Collect POD from Sharma Traders",
  "Fix the loading dock shutter",
  "Reconcile yesterday's fuel slips",
  "Call the Nashik transporter about the delayed truck",
  "Get the e-way bill for consignment 7781",
  "Photograph the damaged pallets before insurance claim",
  "Update the dispatch register",
  "Confirm tomorrow's pickups with the Andheri client",
  "Arrange a replacement driver for route 12",
  "Send the monthly freight invoice to Patel Exports",
  "Check tyre pressure on all three tempos",
];

async function main() {
  const list = await must("listUsers", db.auth.admin.listUsers({ perPage: 1000 }));
  for (const p of [owner, manager, ...staff]) await upsertUser(p, list.users);

  for (const o of (await must("orgs", db.from("orgs").select("id").eq("name", ORG))) as { id: string }[]) {
    await must("delete org", db.from("orgs").delete().eq("id", o.id));
  }
  const org = ((await must("org", db.from("orgs").insert({ name: ORG, created_by: owner.id, language: "en" }).select("id").single())) as { id: string }).id;
  await must(
    "memberships",
    db.from("memberships").insert([
      { org_id: org, user_id: owner.id, role: "owner" },
      { org_id: org, user_id: manager.id, role: "manager" },
      ...staff.map((p) => ({ org_id: org, user_id: p.id, role: "member" })),
    ]),
  );

  // ---- tasks: the mix a busy owner actually faces
  type Spec = { state: State; sentAgo: number; due: number; ack?: number; by?: Person };
  const specs: Spec[] = [];
  const add = (n: number, make: (i: number) => Spec) => {
    for (let i = 0; i < n; i++) specs.push(make(i));
  };
  add(60, (i) => ({ state: i % 2 ? "accepted" : "in_progress", sentAgo: (i + 2) * 5 * HOUR, due: -(i + 1) * 47 * MIN })); // late
  add(25, (i) => ({ state: "delivered", sentAgo: (i + 1) * 35 * MIN, due: (i + 4) * HOUR, ack: 15 })); // not seen
  add(6, (i) => ({ state: "escalated", sentAgo: (i + 3) * HOUR, due: (i + 2) * HOUR })); // escalated
  add(14, (i) => ({ state: "done", sentAgo: (i + 5) * HOUR, due: (i + 1) * HOUR })); // to verify
  add(150, (i) => ({ state: i % 3 === 0 ? "acknowledged" : i % 3 === 1 ? "accepted" : "in_progress", sentAgo: (i % 20 + 1) * HOUR, due: (i + 2) * 53 * MIN, by: i % 4 === 0 ? manager : owner })); // waiting
  add(80, (i) => ({ state: "verified", sentAgo: (i + 10) * HOUR, due: -(i + 2) * HOUR })); // finished

  const rows = specs.map((spec, i) => {
    const sent = now - spec.sentAgo;
    const reached = spec.state === "escalated" ? 0 : ORDER.indexOf(spec.state);
    const step = (k: number) => iso(sent + ((spec.sentAgo * 0.8) / 6) * k);
    const to = staff[i % staff.length];
    return {
      org_id: org,
      title: `${TITLES[i % TITLES.length]}${i >= TITLES.length ? ` (${Math.floor(i / TITLES.length) + 1})` : ""}`,
      created_by: (spec.by ?? owner).id,
      assigned_to: to.id,
      state: spec.state,
      priority: i % 17 === 0 ? "urgent" : "normal",
      ack_minutes: spec.ack ?? 60,
      due_at: iso(now + spec.due),
      created_at: iso(sent),
      delivered_at: iso(sent),
      acknowledged_at: reached >= 1 ? step(1) : null,
      accepted_at: reached >= 2 ? step(2) : null,
      started_at: reached >= 3 ? step(3) : null,
      done_at: reached >= 4 ? step(4) : null,
      verified_at: reached >= 5 ? step(5) : null,
    };
  });

  const ids: string[] = [];
  for (let i = 0; i < rows.length; i += 100) {
    const chunk = (await must("tasks", db.from("tasks").insert(rows.slice(i, i + 100)).select("id"))) as { id: string }[];
    ids.push(...chunk.map((r) => r.id));
  }
  // The audit trail for each: sent, then every step reached.
  const events: Record<string, unknown>[] = [];
  rows.forEach((row, i) => {
    const spec = specs[i];
    const reached = spec.state === "escalated" ? 0 : ORDER.indexOf(spec.state);
    const sent = now - spec.sentAgo;
    events.push({ task_id: ids[i], org_id: org, from_state: "created", to_state: "delivered", actor_id: row.created_by, created_at: iso(sent) });
    for (let k = 1; k <= reached; k++) {
      events.push({
        task_id: ids[i],
        org_id: org,
        from_state: ORDER[k - 1],
        to_state: ORDER[k],
        actor_id: k >= 5 ? row.created_by : row.assigned_to,
        created_at: iso(sent + ((spec.sentAgo * 0.8) / 6) * k),
      });
    }
    if (spec.state === "escalated") {
      events.push({ task_id: ids[i], org_id: org, from_state: "delivered", to_state: "escalated", actor_id: row.created_by, created_at: iso(sent + 30 * MIN) });
    }
  });
  for (let i = 0; i < events.length; i += 500) await must("events", db.from("task_events").insert(events.slice(i, i + 500)));

  // ---- decisions waiting on the owner
  await must(
    "approvals",
    db.from("approvals").insert(
      Array.from({ length: 12 }, (_, i) => ({
        org_id: org,
        title: [`Diesel advance ₹${(i + 2) * 1500}`, `Replace tempo battery — ₹${7800 + i * 100}`, `Hire two loaders for Saturday`][i % 3],
        details: i % 2 ? "Needed before the Monday dispatch." : null,
        status: "pending",
        requested_by: staff[(i * 3) % staff.length].id,
        approver_id: owner.id,
        created_at: iso(now - (i + 1) * 40 * MIN),
      })),
    ),
  );
  await must(
    "balances",
    db.from("leave_balances").insert(staff.map((p) => ({ org_id: org, user_id: p.id, balance_days: 12 }))),
  );
  await must(
    "leave",
    db.from("leave_requests").insert(
      Array.from({ length: 8 }, (_, i) => ({
        org_id: org,
        user_id: staff[(i * 2 + 1) % staff.length].id,
        start_date: istDate(i + 2),
        end_date: istDate(i + 2),
        request_type: "full_day",
        days_requested: 1,
        reason: i % 2 ? "Family function." : null,
        status: "pending",
        created_at: iso(now - (i + 1) * HOUR),
      })),
    ),
  );
  // The manager's own request: must not be offered to the manager to decide.
  await must(
    "own leave",
    db.from("leave_requests").insert({
      org_id: org,
      user_id: manager.id,
      start_date: istDate(10),
      end_date: istDate(10),
      request_type: "full_day",
      days_requested: 1,
      reason: "Manager's own request",
      status: "pending",
      created_at: iso(now - 2 * HOUR),
    }),
  );

  // ---- a dozen chats, each with something the owner has not read
  for (let c = 0; c < 12; c++) {
    const members = [owner, manager, staff[c], staff[(c + 7) % staff.length]];
    const conv = (await must(
      "conversation",
      db
        .from("conversations")
        .insert({ org_id: org, kind: "group", title: `Route ${c + 1} team`, created_by: owner.id, created_at: iso(now - 3 * DAY), last_message_at: iso(now - c * 7 * MIN) })
        .select("id")
        .single(),
    )) as { id: string };
    await must(
      "participants",
      db.from("conversation_participants").insert(
        members.map((p) => ({ conversation_id: conv.id, org_id: org, user_id: p.id, last_read_at: iso(p === owner ? now - 2 * DAY : now) })),
      ),
    );
    await must(
      "messages",
      db.from("messages").insert(
        Array.from({ length: 4 }, (_, m) => ({
          conversation_id: conv.id,
          org_id: org,
          author_id: members[1 + (m % 3)].id,
          body: ["Truck nikal gaya.", "POD mil gaya, photo bhej raha hoon.", "Kal subah 7 baje loading hai.", "Driver ka number bhejo please."][m],
          created_at: iso(now - c * 7 * MIN - (4 - m) * 3 * MIN),
        })),
      ),
    );
  }

  const count = (s: State) => specs.filter((x) => x.state === s).length;
  console.log(
    `${ORG}: ${staff.length + 2} people, ${rows.length} tasks (${count("delivered")} sent, ${count("escalated")} escalated, ${count("done")} to verify, ${count("verified")} verified), 12 approvals, 9 leave requests, 12 chats with unread.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
