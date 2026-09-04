import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import {
  pinLocale,
  signInAs,
  signOut,
  TEST_LOCALE,
  TEST_USERS,
} from "./support/auth";

/**
 * Daily routines. The template is set up once; the tasks it produces are
 * ordinary tasks, so everything downstream works on them unchanged.
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

test.beforeAll(async () => {
  // Start from a clean slate so counts in this file mean something.
  const supabase = await asOwner();
  await supabase.from("checklists").delete().not("id", "is", null);
});

test("an owner sets up a routine and it sends itself", async ({ page, browser }) => {
  const name = `Opening ${Date.now()}`;

  await signOut(page);
  await signInAs(page, "owner");
  await page.goto("/checklists");
  await expect(page.getByRole("heading", { name: "Roz ka kaam" })).toBeVisible();
  await expect(page.getByText("Abhi koi checklist nahi")).toBeVisible();

  await page.getByRole("button", { name: "Nayi checklist" }).click();
  await page.getByLabel("Naam").fill(name);
  // Early enough that today's instance is already due.
  await page.getByLabel("Kitne baje").fill("00:01");
  await page.getByRole("button", { name: "Raju" }).click();

  await page.getByLabel("Kaam 1").fill("Shutter kholo");
  await page.getByRole("button", { name: "Kaam jodein" }).click();
  await page.getByLabel("Kaam 2").fill("Board lagao");

  await page.getByRole("button", { name: "Save karein" }).click();
  await expect(page.getByText(name)).toBeVisible();
  await expect(page.getByText(/2 Kaam/)).toBeVisible();

  // The job brings today's tasks into being.
  const tick = await page.request.post("/api/cron/sla");
  const body = await tick.json();
  expect(body.summary.checklistTasksCreated).toBeGreaterThanOrEqual(2);

  // Running it again makes nothing new: one task per item per day.
  const again = await (await page.request.post("/api/cron/sla")).json();
  expect(again.summary.checklistTasksCreated).toBe(0);

  // The staff member sees one card with progress, not two loose tasks.
  const staffContext = await browser.newContext();
  const staff = await staffContext.newPage();
  await staff.request.post("/api/test-login", {
    data: { email: TEST_USERS.staff.email, password: TEST_USERS.staff.password },
  });
  await pinLocale(staff, TEST_LOCALE);
  await staff.goto("/aaj");

  const card = staff.getByRole("progressbar", { name });
  await expect(card).toBeVisible();
  await expect(card).toHaveAttribute("aria-valuetext", "0/2");
  await expect(card).toHaveAttribute("aria-valuemax", "2");

  // Its tasks are real tasks: opening one walks the same ladder.
  await staff.getByText(name).click();
  await expect(staff).toHaveURL(/\/checklist\/[0-9a-f-]{36}$/);
  await staff.getByText("Shutter kholo").click();
  await staff.getByRole("button", { name: "Dekh liya, ho jayega" }).click();
  await expect(staff.getByRole("list", { name: "Timeline" })).toContainText(
    "Maana",
  );
  await staff.getByRole("button", { name: "Ho gaya" }).click();
  await staff.getByRole("button", { name: "Bina proof ke" }).click();
  await expect(staff.getByRole("list", { name: "Timeline" })).toContainText(
    "Ho gaya",
  );

  // And the card's progress moves.
  await staff.goto("/aaj");
  await expect(staff.getByRole("progressbar", { name })).toHaveAttribute(
    "aria-valuetext",
    "1/2",
  );
  await staffContext.close();
});

test("a paused routine stops producing work", async ({ page }) => {
  await signOut(page);
  await signInAs(page, "owner");
  await page.goto("/checklists");

  await page.getByRole("button", { name: "Rokein" }).click();
  await expect(page.getByText("Ruka hua")).toBeVisible();

  const supabase = await asOwner();
  const { data: before } = await supabase
    .from("tasks")
    .select("id")
    .not("checklist_item_id", "is", null);

  await page.request.post("/api/cron/sla");

  const { data: after } = await supabase
    .from("tasks")
    .select("id")
    .not("checklist_item_id", "is", null);
  expect(after?.length).toBe(before?.length);
});

test("staff cannot edit routines", async ({ page }) => {
  await signOut(page);
  await signInAs(page, "staff");
  await page.goto("/checklists");
  await expect(page).toHaveURL(/\/aaj$/);
});
