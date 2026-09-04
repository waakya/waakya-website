import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { signInAs, signOut, TEST_USERS } from "./support/auth";

/**
 * The differentiator: clocks that run out, and an escalation that reaches the
 * owner. Time is moved by backdating the task rather than by waiting, which is
 * the only honest way to test a fifteen-minute SLA in a test suite.
 */
test.describe.configure({ mode: "serial" });

async function asOwner() {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  await supabase.auth.signInWithPassword({
    email: TEST_USERS.owner.email,
    password: TEST_USERS.owner.password,
  });
  return supabase;
}

async function createTask(page: Page, title: string) {
  await page.goto("/naya");
  await page.getByRole("button", { name: /^Kisko/ }).click();
  await page.getByRole("button", { name: "Raju" }).click();
  await page.getByRole("button", { name: /^Kya/ }).click();
  await page.getByRole("textbox", { name: "Kya" }).fill(title);
  await page.getByRole("button", { name: "Save" }).click();
  await page.getByRole("button", { name: "Bhejo" }).click();
  await expect(page).toHaveURL(/\/aaj$/);
}

test.beforeAll(async () => {
  // Quiet hours are covered exhaustively in the unit tests; here they would
  // only make the suite depend on what time of day it is run.
  const supabase = await asOwner();
  const { data: orgs } = await supabase.from("orgs").select("id");
  await supabase
    .from("orgs")
    .update({ quiet_start: "00:00", quiet_end: "00:00" })
    .eq("id", orgs![0].id);
});

test("an unacknowledged task past its SLA reaches the owner", async ({ page }) => {
  const title = `Unseen ${Date.now()}`;
  await signOut(page);
  await signInAs(page, "owner");
  await createTask(page, title);

  const supabase = await asOwner();
  const { data: task } = await supabase
    .from("tasks")
    .select("id")
    .eq("title", title)
    .single();

  // Delivered half an hour ago, with a 15-minute acknowledge SLA.
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60_000).toISOString();
  await supabase
    .from("tasks")
    .update({ delivered_at: thirtyMinutesAgo })
    .eq("id", task!.id);

  // The row already says so, before any job runs: the chip is derived from
  // the clock, not from a flag somebody has to remember to set.
  await page.goto("/aaj");
  const row = page
    .getByRole("list", { name: "Aaj" })
    .locator("li", { hasText: title })
    .first();
  await expect(row.getByText("Dekha nahi")).toBeVisible();

  // Now the job runs, and the owner is told.
  const tick = await page.request.post("/api/cron/sla");
  expect(tick.ok()).toBeTruthy();

  const { data: escalations } = await supabase
    .from("escalations")
    .select("reason")
    .eq("task_id", task!.id);
  expect(escalations?.map((e) => e.reason)).toContain("ack_sla");

  await page.goto("/khabar");
  await expect(
    page.getByRole("list", { name: "Khabar" }).getByText(title).first(),
  ).toBeVisible();
});

test("running the job again sends nothing twice", async ({ page }) => {
  await signOut(page);
  await signInAs(page, "owner");

  const first = await (await page.request.post("/api/cron/sla")).json();
  const second = await (await page.request.post("/api/cron/sla")).json();
  const third = await (await page.request.post("/api/cron/sla")).json();

  // By the third pass there is nothing left owed, and everything the job
  // still sees is reported as already sent rather than sent again.
  expect(third.summary.remindersSent).toBe(0);
  expect(third.summary.escalationsRaised).toBe(0);
  expect(third.summary.errors).toEqual([]);
  expect(second.summary.alreadySent).toBeGreaterThan(0);
  expect(first.summary.errors).toEqual([]);

  // And the inbox has no duplicate rows.
  const supabase = await asOwner();
  const { data } = await supabase
    .from("notifications")
    .select("dedupe_key")
    .not("dedupe_key", "is", null);
  const keys = (data ?? []).map((row) => row.dedupe_key);
  expect(new Set(keys).size).toBe(keys.length);
});

test("an overdue task reads Late, in words and in red", async ({ page }) => {
  const title = `Overdue ${Date.now()}`;
  await signOut(page);
  await signInAs(page, "owner");
  await createTask(page, title);

  const supabase = await asOwner();
  const { data: task } = await supabase
    .from("tasks")
    .select("id")
    .eq("title", title)
    .single();

  await supabase
    .from("tasks")
    .update({
      delivered_at: new Date(Date.now() - 120 * 60_000).toISOString(),
      due_at: new Date(Date.now() - 40 * 60_000).toISOString(),
      acknowledged_at: new Date(Date.now() - 118 * 60_000).toISOString(),
      state: "accepted",
    })
    .eq("id", task!.id);

  await page.goto("/aaj");
  const row = page
    .getByRole("list", { name: "Aaj" })
    .locator("li", { hasText: title })
    .first();
  await expect(row.getByText("Late 40 min")).toBeVisible();
  // The row never shows the glyph as well as the chip (D-11).
  await expect(row.locator("[data-slot='ticks']")).toHaveCount(0);

  await page.request.post("/api/cron/sla");
  const { data: escalations } = await supabase
    .from("escalations")
    .select("reason")
    .eq("task_id", task!.id);
  expect(escalations?.map((e) => e.reason)).toContain("completion_sla");
});

test("the clock bars say what they are doing, not just what colour they are", async ({
  page,
}) => {
  const title = `Clocks ${Date.now()}`;
  await signOut(page);
  await signInAs(page, "owner");
  await createTask(page, title);

  const supabase = await asOwner();
  const { data: task } = await supabase
    .from("tasks")
    .select("id")
    .eq("title", title)
    .single();

  // Two thirds through the completion window: past 50%, not yet 90%.
  await supabase
    .from("tasks")
    .update({
      delivered_at: new Date(Date.now() - 120 * 60_000).toISOString(),
      due_at: new Date(Date.now() + 60 * 60_000).toISOString(),
      acknowledged_at: new Date(Date.now() - 119 * 60_000).toISOString(),
      state: "accepted",
    })
    .eq("id", task!.id);

  await page.goto(`/kaam/${task!.id}`);
  const completion = page.getByRole("progressbar", { name: "Khatam karna" });
  await expect(completion).toBeVisible();
  await expect(completion).toHaveAttribute("aria-valuenow", "67");
  await expect(completion).toHaveAttribute("aria-valuetext", /67% gaya/);

  const ack = page.getByRole("progressbar", { name: /Dekhna/ });
  await expect(ack).toHaveAttribute("aria-valuetext", /Dekha/);
});

test("staff cannot run the job, and neither can a stranger", async ({ page }) => {
  await signOut(page);
  await signInAs(page, "staff");
  expect((await page.request.post("/api/cron/sla")).status()).toBe(404);

  await signOut(page);
  expect((await page.request.post("/api/cron/sla")).status()).toBe(404);
});
