import { expect, test } from "@playwright/test";

import { signInAs, signOut } from "./support/auth";

/**
 * WHEN → IF → DO, proven end to end: a rule on website enquiries assigns
 * the lead to whoever has the fewest and creates a follow-up task; a new
 * website enquiry then arrives as an owned lead with a task that says it
 * came from that rule; the run log records it; an enquiry from another
 * source leaves the rule untouched.
 */
test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ page }) => {
  await signOut(page);
});

const run = Date.now();
const leadName = `Website lead ${run}`;
const otherName = `Walk-in lead ${run}`;

test("the owner switches automation on and installs the website rule", async ({ page }) => {
  await signInAs(page, "owner", "en");
  await page.goto("/settings/modules");
  for (const name of ["Customers (CRM)", "Automation"]) {
    const toggle = page.getByRole("switch", { name });
    if ((await toggle.getAttribute("aria-checked")) !== "true") {
      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-checked", "true");
    }
  }
  await page.goto("/automations");
  // Older runs may have left the rule behind; one copy is enough.
  // The rule's name is business data, written in the business's language.
  const existing = page.getByRole("link", { name: /^Website enquiry/ });
  if ((await existing.count()) === 0) {
    await page.getByRole("button", { name: /Add: Website enquiry/ }).click();
    await expect(page).toHaveURL(/\/automations\/[0-9a-f-]{36}$/);
  } else {
    await existing.first().click();
  }
  await expect(page.getByLabel("Rule name")).toHaveValue(/^Website enquiry/);
  await expect(page.getByRole("checkbox", { name: "On" })).toBeChecked();
});

test("a website enquiry is assigned and gets a follow-up task, with the rule named on it", async ({ page }) => {
  await signInAs(page, "owner", "en");
  await page.goto("/crm");
  await page.getByRole("button", { name: "New customer" }).click();
  await page.getByLabel("Name", { exact: true }).fill(leadName);
  await page.getByLabel("Phone", { exact: true }).fill(`97${String(run).slice(-8)}`);
  await page.getByLabel("Source").selectOption("website");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page).toHaveURL(/\/crm\/[0-9a-f-]{36}$/);

  // The engine runs after the request; the page catches up on refresh.
  await expect
    .poll(async () => {
      await page.reload();
      return page.getByRole("link", { name: `Call ${leadName}` }).count();
    }, { timeout: 30_000, intervals: [1000, 2000, 3000] })
    .toBeGreaterThan(0);
  await expect(page.getByText("Nobody yet").filter({ visible: true })).toHaveCount(0);

  await page.getByRole("link", { name: `Call ${leadName}` }).first().click();
  await expect(page).toHaveURL(/\/kaam\//);
  await page.getByRole("button", { name: /Project and documents/ }).click();
  await expect(page.getByText(/From an automation · Website enquiry/)).toBeVisible();
});

test("the run is on record, and an enquiry from elsewhere leaves the rule alone", async ({ page }) => {
  await signInAs(page, "owner", "en");
  await page.goto("/automations");
  await page.getByRole("link", { name: /^Website enquiry/ }).first().click();
  await expect(page.getByText("Done", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(`lead.created · ${leadName}`)).toBeVisible();

  await page.goto("/crm");
  await page.getByRole("button", { name: "New customer" }).click();
  await page.getByLabel("Name", { exact: true }).fill(otherName);
  await page.getByLabel("Phone", { exact: true }).fill(`96${String(run).slice(-8)}`);
  await page.getByLabel("Source").selectOption("walk_in");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page).toHaveURL(/\/crm\/[0-9a-f-]{36}$/);
  await page.waitForTimeout(4000);
  await page.reload();
  await expect(page.getByRole("link", { name: `Call ${otherName}` })).toHaveCount(0);
  await expect(page.getByText("Nobody yet").filter({ visible: true }).first()).toBeVisible();
});
