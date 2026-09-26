import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { PASSWORD, PEOPLE, admin, sharmaId } from "./support";

/**
 * Security regression for the design pass: the redesign changed screens and
 * two read queries, never a rule. Checked the way a browser would reach the
 * data — signed in with the public key as a real person — so row level
 * security and the task guard are what answer.
 */
async function as(who: keyof typeof PEOPLE) {
  const c = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await c.auth.signInWithPassword({ email: PEOPLE[who], password: PASSWORD });
  expect(error).toBeNull();
  return c;
}

test("another business sees none of Sharma Interiors", async () => {
  const { data: org } = await admin().from("orgs").select("id").eq("name", "Sharma Interiors").single();
  const outsider = await as("anil");
  for (const table of [
    "tasks",
    "task_events",
    "messages",
    "conversations",
    "documents",
    "approvals",
    "leave_requests",
    "attendance_records",
    "projects",
    "notifications",
    "proofs",
  ]) {
    const { data, error } = await outsider.from(table).select("id").eq("org_id", org!.id);
    expect(error, table).toBeNull();
    expect(data, table).toEqual([]);
  }
});

test("staff cannot verify work or reassign someone else's task", async () => {
  const rahul = await as("rahul");
  // A task Rahul did and that waits for verification — only a manager verifies.
  const done = await sharmaId("task", "Photograph the chipped tile boxes");
  const verify = await rahul.from("tasks").update({ state: "verified" }).eq("id", done).select("id");
  // Refused by the task guard ("that step is not yours to take").
  expect(verify.error).not.toBeNull();
  // Someone else's task: changing its owner or deadline is a manager's call.
  const neha = await sharmaId("task", "Send the revised Kapoor quotation");
  const reassign = await rahul.from("tasks").update({ due_at: new Date().toISOString() }).eq("id", neha).select("id");
  expect(reassign.error).not.toBeNull();

  const { data } = await admin().from("tasks").select("state").eq("id", done).single();
  expect(data!.state).toBe("done");
  const { data: other } = await admin().from("tasks").select("due_at").eq("id", neha).single();
  expect(Date.parse(other!.due_at!)).toBeLessThan(Date.now() - 60_000);
});

test("staff cannot approve leave or decide approvals addressed to someone else", async () => {
  const rahul = await as("rahul");
  const { data: pending } = await admin().from("leave_requests").select("id").eq("status", "pending").limit(1).single();
  const leave = await rahul.from("leave_requests").update({ status: "approved" }).eq("id", pending!.id).select("id");
  expect((leave.data ?? []).length === 0 || !!leave.error).toBe(true);
  const { data: after } = await admin().from("leave_requests").select("status").eq("id", pending!.id).single();
  expect(after!.status).toBe("pending");

  // An approval addressed to Priya: Rahul cannot decide it, directly or by RPC.
  const { data: approval } = await admin()
    .from("approvals")
    .select("id")
    .eq("title", "Purchase matte laminate sheets for the Kapoor kitchen — ₹48,000")
    .single();
  const direct = await rahul.from("approvals").update({ status: "approved" }).eq("id", approval!.id).select("id");
  expect((direct.data ?? []).length === 0 || !!direct.error).toBe(true);
  const { data: still } = await admin().from("approvals").select("status").eq("id", approval!.id).single();
  expect(still!.status).toBe("pending");
});
