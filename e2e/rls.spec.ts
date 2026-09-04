import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { TEST_USERS } from "./support/auth";

/**
 * RLS, checked against the database rather than through the app.
 *
 * The app could be perfect and still leak if a policy is wrong, because
 * anyone with the publishable key can call PostgREST directly. These tests do
 * exactly that, as a signed-in user who belongs to no org.
 */
function client() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

async function signIn(who: keyof typeof TEST_USERS) {
  const supabase = client();
  const { error } = await supabase.auth.signInWithPassword({
    email: TEST_USERS[who].email,
    password: TEST_USERS[who].password,
  });
  expect(error, `sign-in for ${who}`).toBeNull();
  return supabase;
}

test("an outsider cannot read another org's rows", async () => {
  const owner = await signIn("owner");
  const { data: orgs } = await owner.from("orgs").select("id, name");
  expect(orgs?.length, "the owner sees their own business").toBeGreaterThan(0);
  const orgId = orgs![0].id;

  const outsider = await signIn("noorg");

  // Every table is scoped by org membership, so an outsider sees nothing.
  for (const table of [
    "orgs",
    "memberships",
    "tasks",
    "task_events",
    "task_messages",
    "proofs",
    "escalations",
    "invites",
  ] as const) {
    const { data, error } = await outsider.from(table).select("*");
    expect(error, `${table} should not error`).toBeNull();
    expect(data, `${table} should be empty for an outsider`).toEqual([]);
  }

  // Asking for the org by id explicitly is no better.
  const { data: byId } = await outsider.from("orgs").select("*").eq("id", orgId);
  expect(byId).toEqual([]);
});

test("an outsider cannot make themselves a member", async () => {
  const owner = await signIn("owner");
  const { data: orgs } = await owner.from("orgs").select("id");
  const orgId = orgs![0].id;

  const outsider = await signIn("noorg");
  const {
    data: { user },
  } = await outsider.auth.getUser();

  // This is the hole that migration 0003 closed: 0001 allowed a self-insert,
  // which let any signed-in user join any org and read all of its work.
  const { error } = await outsider
    .from("memberships")
    .insert({ org_id: orgId, user_id: user!.id, role: "member" });

  expect(error, "self-insert into someone else's org must be refused").not.toBeNull();
  expect(error?.code).toBe("42501");
});

test("an outsider cannot write a task into another org", async () => {
  const owner = await signIn("owner");
  const { data: orgs } = await owner.from("orgs").select("id");
  const orgId = orgs![0].id;

  const outsider = await signIn("noorg");
  const {
    data: { user },
  } = await outsider.auth.getUser();

  const { error } = await outsider.from("tasks").insert({
    org_id: orgId,
    title: "chori ka kaam",
    created_by: user!.id,
  });
  expect(error).not.toBeNull();
});

test("the OTP rate-limit table is unreadable, and its function is guarded", async () => {
  const outsider = await signIn("noorg");

  const { data } = await outsider.from("otp_requests" as never).select("*");
  expect(data ?? []).toEqual([]);

  const { error } = await outsider.rpc("record_otp_request", {
    p_identifier_hash: "not-a-sha-256-digest",
  });
  expect(error, "a malformed digest is rejected").not.toBeNull();
});

test("an invite preview leaks nothing but the business and invitee name", async () => {
  const owner = await signIn("owner");
  const { data: invites } = await owner
    .from("invites")
    .select("token")
    .limit(1);

  if (!invites?.length) return; // no pending invite in this run

  const outsider = await signIn("noorg");
  const { data } = await outsider.rpc("invite_preview", {
    p_token: invites[0].token,
  });

  expect(Object.keys(data?.[0] ?? {}).sort()).toEqual([
    "already_accepted",
    "full_name",
    "org_language",
    "org_name",
  ]);
});
