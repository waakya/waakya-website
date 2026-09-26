import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { signInAs, signOut, TEST_USERS } from "./support/auth";

/**
 * Vendor work as a connected flow: the business gives a vendor work on a
 * project with an owner inside; that owner gets a real task and submits
 * with proof; a manager verifies; the project tells the customer; a payment
 * moves the payment status. Doors: a member cannot verify or see payments.
 */
test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ page }) => {
  await signOut(page);
});

function api() {
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const run = Date.now();
const vendorName = `Deccan Shutters ${run}`;
const projectName = `Kharadi office ${run}`;
const work = `12 shutters ${run}`;
let assignmentUrl = "";

test("the owner switches vendors on and adds a vendor", async ({ page }) => {
  await signInAs(page, "owner", "en");
  await page.goto("/settings/modules");
  for (const name of ["Records", "Vendors"]) {
    const toggle = page.getByRole("switch", { name });
    if ((await toggle.getAttribute("aria-checked")) !== "true") {
      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-checked", "true");
    }
  }
  await page.goto("/vendors");
  await page.getByRole("button", { name: "New vendor" }).click();
  await page.getByLabel("Name", { exact: true }).fill(vendorName);
  await page.getByLabel("Phone", { exact: true }).fill("9811111111");
  await page.getByLabel("Kind of work").fill("Shutters");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page).toHaveURL(/\/vendors\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { name: vendorName })).toBeVisible();
});

test("work is assigned on a project with Raju as the owner inside, and Raju gets a task", async ({ page, browser }) => {
  await signInAs(page, "owner", "en");
  await page.goto("/projects");
  await page.getByRole("button", { name: "New project" }).click();
  await page.getByLabel("Project name").fill(projectName);
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page).toHaveURL(/\/projects\/[0-9a-f-]{36}$/);

  await page.getByRole("button", { name: "Assign work" }).click();
  await page.getByLabel("Vendors").selectOption({ label: vendorName });
  await page.getByLabel("What", { exact: true }).fill(work);
  await page.getByLabel("Amount").fill("110000");
  await page.getByLabel("Owner inside the business").selectOption({ label: "Raju" });
  await page.getByLabel("Tell the customer when verified").check();
  await page.getByRole("button", { name: "Assign work" }).last().click();
  await expect(page).toHaveURL(/\/vendors\/assignments\/[0-9a-f-]{36}$/);
  assignmentUrl = new URL(page.url()).pathname;
  await expect(page.getByRole("heading", { name: work })).toBeVisible();
  await expect(page.getByText("Assigned", { exact: true }).filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByText("Raju").first()).toBeVisible();

  const staffContext = await browser.newContext();
  const staff = await staffContext.newPage();
  await signInAs(staff, "staff", "en");
  await staff.goto("/aaj");
  await expect(staff.getByRole("link", { name: new RegExp(`${vendorName}: ${work}`) }).first()).toBeVisible();
  await staffContext.close();
});

test("Raju submits the work; a member cannot verify it or see the money", async ({ page }) => {
  await signInAs(page, "staff", "en");
  await page.goto(assignmentUrl);
  await expect(page.getByRole("button", { name: "Verify", exact: true })).toHaveCount(0);
  await expect(page.getByText("Payments")).toHaveCount(0);
  await page.getByLabel("What was done (attach proof on the task)").fill("Delivered to site, 12 units");
  await page.getByRole("button", { name: "Submit for verification" }).click();
  await expect(page.getByText("Submitted, to verify", { exact: true }).filter({ visible: true }).first()).toBeVisible();

  const staff = api();
  await staff.auth.signInWithPassword({ email: TEST_USERS.staff.email, password: TEST_USERS.staff.password });
  const id = assignmentUrl.split("/").pop()!;
  const { error } = await staff.from("vendor_assignments").update({ execution_status: "verified" }).eq("id", id);
  expect(error).not.toBeNull();
  const { data: payments } = await staff.from("vendor_payments").select("id");
  expect(payments).toEqual([]);
});

test("the owner sees it on Today, verifies, records a payment; the project tells the customer", async ({ page }) => {
  await signInAs(page, "owner", "en");
  await page.goto("/aaj");
  await expect(page.getByRole("link", { name: work }).first()).toBeVisible();
  await page.goto(assignmentUrl);
  await page.getByRole("button", { name: "Verify", exact: true }).click();
  await expect(page.getByText("Verified", { exact: true }).filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByText("Unpaid", { exact: true }).filter({ visible: true }).first()).toBeVisible();

  await page.getByLabel("Record a payment").fill("110000");
  await page.getByRole("button", { name: "Record a payment" }).click();
  await expect(page.getByText("Paid", { exact: true }).filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByText("₹1,10,000 of ₹1,10,000 paid")).toBeVisible();

  await page.goto("/projects");
  await page.getByRole("link", { name: projectName }).first().click();
  await expect(page.getByRole("paragraph").filter({ hasText: work }).first()).toBeVisible();
  await expect(page.getByText("Customer can see").first()).toBeVisible();

  await page.goto("/settings/history");
  await expect(page.getByText(`${vendorName} submitted: ${work}`)).toBeVisible();
  await expect(page.getByText(`${work} · verified`)).toBeVisible();
  await expect(page.getByText(`Payment 110000.00: ${work}`).or(page.getByText(`Payment 110000: ${work}`))).toBeVisible();
});
