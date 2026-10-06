import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { signInAs, signOut, TEST_USERS } from "./support/auth";

/**
 * Configurable records as a connected flow: a template becomes a type, a
 * type becomes a list, a record moves through the statuses the type
 * declares (and no others), work made on it carries its name, and the
 * doors hold: a member cannot archive, an outsider sees nothing, a value
 * that does not fit its field is refused by the server.
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
const unit = `A-${String(run).slice(-4)}`;

test("the owner switches records on and installs the property template", async ({ page }) => {
  await signInAs(page, "owner");
  await page.goto("/settings/modules");
  const toggle = page.getByRole("switch", { name: "Records" });
  if ((await toggle.getAttribute("aria-checked")) !== "true") {
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-checked", "true");
  }
  await page.goto("/records/types");
  const install = page.getByRole("button", { name: /Property inventory/ });
  if (!(await install.isDisabled())) {
    await install.click();
    await expect(page).toHaveURL(/\/records\/property_unit$/);
  }
  await page.goto("/records");
  await expect(page.getByRole("link", { name: /Property inventory/ })).toBeVisible();
});

test("a unit is created with typed fields and listed with its status", async ({ page }) => {
  await signInAs(page, "owner");
  await page.goto("/records/property_unit");
  await page.getByRole("button", { name: /^Naya: Property unit/ }).click();
  await page.getByLabel("Property unit", { exact: true }).fill(unit);
  await page.getByLabel(/^Unit number/).fill(unit);
  await page.getByLabel(/^Type/).selectOption("bhk_3");
  await page.getByLabel(/^Area/).fill("1420");
  await page.getByLabel(/^Price/).fill("8500000");
  await page.getByRole("button", { name: "Save karein" }).click();
  await expect(page).toHaveURL(/\/records\/property_unit\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { name: unit })).toBeVisible();
  // The price is in the record's one-line summary and in its ledger.
  await expect(page.getByText("₹85,00,000").first()).toBeVisible();
  await expect(page.getByText("1,420 sq ft").first()).toBeVisible();
  await expect(page.getByText("Available", { exact: true }).filter({ visible: true }).first()).toBeVisible();

  await page.goto("/records/property_unit?status=available");
  await expect(page.getByRole("link", { name: unit, exact: true })).toBeVisible();
  await page.goto("/records/property_unit?status=sold");
  await expect(page.getByRole("link", { name: unit, exact: true })).toHaveCount(0);
});

test("a bad value is refused, and the status moves only to one the type declares", async ({ page }) => {
  await signInAs(page, "owner");
  await page.goto("/records/property_unit");
  await page.getByRole("link", { name: unit, exact: true }).click();
  await page.getByRole("button", { name: "Badlein", exact: true }).click();
  await page.getByLabel(/^Price/).fill("-5");
  await page.getByRole("button", { name: "Save karein" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Kuch jaankari sahi nahi hai" })).toBeVisible();
  await page.getByLabel(/^Price/).fill("8500000");
  await page.getByLabel(/^Area/).fill("1500");
  await page.getByRole("button", { name: "Save karein" }).click();
  await expect(page.getByText("1,500 sq ft").first()).toBeVisible();

  // Visual V2: moving the status opens a drawer with the allowed next states.
  await page.getByRole("button", { name: "Status badlein" }).click();
  await page.getByRole("dialog").getByLabel("Held").check();
  await page.getByLabel("Kyon (optional)").fill("Token received from Meera");
  await page.getByRole("button", { name: "Save karein" }).click();
  await expect(page.getByText("Held", { exact: true }).filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByText(`${unit}: Available → Held`)).toBeVisible();
});

test("work made on a unit says which unit it is for", async ({ page }) => {
  await signInAs(page, "owner");
  await page.goto("/records/property_unit");
  await page.getByRole("link", { name: unit, exact: true }).click();
  await page.getByRole("button", { name: "Kaam banayein" }).first().click();
  await page.getByLabel("Kaam", { exact: true }).fill("Site visit karwao");
  await page.getByRole("button", { name: "Kaam banayein" }).last().click();
  await expect(page.getByRole("link", { name: "Site visit karwao" })).toBeVisible();
  await page.getByRole("link", { name: "Site visit karwao" }).click();
  await page.getByRole("button", { name: /Project aur documents/ }).click();
  await expect(page.getByText(`Project se · ${unit}`)).toBeVisible();
});

test("a member can add a unit but not archive it; an outsider sees nothing", async ({ page }) => {
  await signInAs(page, "staff");
  await page.goto("/records/property_unit");
  await expect(page.getByRole("button", { name: /^Naya: Property unit/ })).toBeVisible();
  await page.getByRole("link", { name: unit, exact: true }).click();
  await expect(page.getByRole("button", { name: "Archive" })).toHaveCount(0);

  const staff = api();
  await staff.auth.signInWithPassword({ email: TEST_USERS.staff.email, password: TEST_USERS.staff.password });
  const { data: row } = await staff.from("records").select("id, org_id").eq("title", unit).maybeSingle();
  const { error: archive } = await staff.from("records").update({ archived_at: new Date().toISOString() }).eq("id", row!.id);
  expect(archive).not.toBeNull();
  const { error: badStatus } = await staff.from("records").update({ status_key: "vanished" }).eq("id", row!.id);
  expect(badStatus).not.toBeNull();

  const outsider = api();
  await outsider.auth.signInWithPassword({ email: TEST_USERS.noorg.email, password: TEST_USERS.noorg.password });
  const { data } = await outsider.from("records").select("id");
  expect(data).toEqual([]);
  const { data: types } = await outsider.from("record_types").select("id");
  expect(types).toEqual([]);
});

test("the owner adds a field to the type and the form grows", async ({ page }) => {
  await signInAs(page, "owner");
  await page.goto("/records/types?edit=property_unit");
  await page.getByRole("button", { name: "Field jodein" }).click();
  const labels = page.getByLabel("Field ka naam");
  await labels.last().fill(`Parking slots ${String(run).slice(-4)}`);
  await labels.last().press("Tab");
  await page.getByLabel("Kis tarah ka").last().selectOption("number");
  await page.getByRole("button", { name: "Save karein" }).click();
  await expect(page).toHaveURL(/\/records\/property_unit$/);
  await page.getByRole("button", { name: /^Naya: Property unit/ }).click();
  await expect(page.getByLabel(new RegExp(`^Parking slots ${String(run).slice(-4)}`))).toBeVisible();
});
