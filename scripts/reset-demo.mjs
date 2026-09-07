/**
 * Seed one realistic day, and report what is left over from the e2e.
 *
 * Run against a *development* project only:
 *   node --env-file=.env.local scripts/reset-demo.mjs
 *
 * **It cannot delete tasks, and that is deliberate.** There is no DELETE
 * policy on `tasks`: a task is *cancelled*, never removed, because the audit
 * trail is the product. So this script counts the debris and tells you how to
 * clear it with elevated access, rather than pretending to have done it —
 * PostgREST returns success for a delete that RLS silently matched no rows.
 *
 * To actually clear it, in the Supabase SQL editor:
 *   delete from tasks where title ~ '\s1[0-9]{12}$';
 *
 * What it seeds: the day from screens/Dashboard.png — one task nobody has
 * looked at, one that has gone late, one waiting to be verified, and two in
 * flight — so the app has something true to show on first open.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const owner = { email: "owner@waakya.test", password: "waakya-e2e-owner-pass" };

if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY are not set.");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { error: signInError } = await supabase.auth.signInWithPassword(owner);
if (signInError) {
  console.error(`Could not sign in as ${owner.email}: ${signInError.message}`);
  console.error("Run supabase/seed-e2e.sql against this project first.");
  process.exit(1);
}

const { data: me } = await supabase.auth.getUser();
const { data: orgs } = await supabase.from("orgs").select("id, name").limit(1);
if (!orgs?.length) {
  console.error("No org. Create one in the app first.");
  process.exit(1);
}
const org = orgs[0];

const { data: members } = await supabase
  .from("memberships")
  .select("user_id, role")
  .eq("org_id", org.id);
const staff = members?.find((m) => m.role === "member")?.user_id;
if (!staff) {
  console.error("No staff member. Invite one in the app first.");
  process.exit(1);
}

// --- Report the debris ------------------------------------------------------
const { data: all } = await supabase.from("tasks").select("id, title");
const debris = (all ?? []).filter((task) => /\s1[0-9]{12}$/.test(task.title));

if (debris.length > 0) {
  console.warn(
    `${debris.length} test tasks are still here. This script cannot remove ` +
      `them: there is no DELETE policy on tasks, because a task is cancelled, ` +
      `never deleted.`,
  );
  console.warn(
    `To clear them, run in the Supabase SQL editor:\n` +
      `  delete from tasks where title ~ '\\s1[0-9]{12}$';`,
  );
}

// --- Seed one true day ------------------------------------------------------
const now = Date.now();
const minutes = (n) => new Date(now + n * 60_000).toISOString();

const demo = [
  {
    title: "Sector 62 wale 3BHK ki photo le aao",
    details: "Client kal aa raha hai",
    priority: "urgent",
    proof_required: true,
    state: "delivered",
    delivered_at: minutes(-25),
    due_at: minutes(150),
  },
  {
    title: "Godown stock count",
    priority: "normal",
    state: "accepted",
    delivered_at: minutes(-180),
    acknowledged_at: minutes(-176),
    accepted_at: minutes(-176),
    due_at: minutes(-40),
  },
  {
    title: "Sharma ji ko call karo",
    priority: "normal",
    state: "done",
    delivered_at: minutes(-200),
    acknowledged_at: minutes(-198),
    accepted_at: minutes(-198),
    done_at: minutes(-30),
    due_at: minutes(60),
  },
  {
    title: "Verma ji ko brochure bhejo",
    priority: "normal",
    state: "in_progress",
    delivered_at: minutes(-90),
    acknowledged_at: minutes(-88),
    accepted_at: minutes(-88),
    started_at: minutes(-40),
    due_at: minutes(120),
  },
  {
    title: "Site board ki photo",
    priority: "normal",
    state: "verified",
    delivered_at: minutes(-300),
    acknowledged_at: minutes(-296),
    accepted_at: minutes(-296),
    done_at: minutes(-120),
    verified_at: minutes(-110),
    due_at: minutes(-100),
  },
];

const { data: created, error: insertError } = await supabase
  .from("tasks")
  .insert(
    demo.map((task) => ({
      proof_required: false,
      ...task,
      org_id: org.id,
      created_by: me.user.id,
      assigned_to: staff,
    })),
  )
  .select("id, state, delivered_at, acknowledged_at, accepted_at, started_at, done_at, verified_at");

if (insertError) {
  console.error(`Could not seed: ${insertError.message}`);
  process.exit(1);
}

// Every task needs the trail that explains it; the stepper reads this, not the
// current state.
const LADDER = [
  ["created", null],
  ["delivered", "delivered_at"],
  ["acknowledged", "acknowledged_at"],
  ["accepted", "accepted_at"],
  ["in_progress", "started_at"],
  ["done", "done_at"],
  ["verified", "verified_at"],
];

const events = [];
for (const task of created ?? []) {
  let previous = null;
  for (const [state, column] of LADDER) {
    const at = column ? task[column] : task.delivered_at;
    if (!at) continue;
    events.push({
      task_id: task.id,
      org_id: org.id,
      from_state: previous,
      to_state: state,
      actor_id: state === "verified" || state === "created" || state === "delivered"
        ? me.user.id
        : staff,
      created_at: at,
    });
    previous = state;
    if (state === task.state) break;
  }
}

const { error: eventError } = await supabase.from("task_events").insert(events);
if (eventError) console.error(`Events: ${eventError.message}`);

console.log(`Seeded ${created?.length ?? 0} demo tasks and ${events.length} events in "${org.name}".`);
