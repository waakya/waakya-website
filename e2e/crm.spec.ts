import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { signInAs, signOut, TEST_USERS } from "./support/auth";

/**
 * The CRM as a connected flow: a capability the owner switches on, a person
 * who arrives once however many times they are typed in, an owner's name on
 * them, a deal that moves, work that carries the customer's name, and a
 * history that says who did what. Then the doors: a member cannot manage the
 * pipeline, an outsider sees nothing, and a switched-off module is Today.
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

async function signInApi(who: keyof typeof TEST_USERS) {
  const supabase = api();
  const { error } = await supabase.auth.signInWithPassword({ email: TEST_USERS[who].email, password: TEST_USERS[who].password });
  expect(error).toBeNull();
  return supabase;
}

const run = Date.now();
const phone = `98${String(run).slice(-8)}`;
const name = `Meera Joshi ${run}`;

test("the owner switches the CRM on, and it appears in More", async ({ page }) => {
  await signInAs(page, "owner");
  await page.goto("/settings/modules");
  await expect(page.getByRole("heading", { name: "Capabilities" })).toBeVisible();
  const toggle = page.getByRole("switch", { name: "Customers (CRM)" });
  if ((await toggle.getAttribute("aria-checked")) !== "true") {
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-checked", "true");
  }
  await page.goto("/more");
  await expect(page.getByRole("link", { name: "Customers", exact: true })).toBeVisible();
});

test("a new enquiry is one record however often it is typed in", async ({ page }) => {
  await signInAs(page, "owner");
  await page.goto("/crm");
  await page.getByRole("button", { name: "Naya customer" }).click();
  await page.getByLabel("Naam", { exact: true }).fill(name);
  await page.getByLabel("Phone", { exact: true }).fill(phone);
  await page.getByLabel("Kahan se aaye").selectOption("website");
  await page.getByLabel("Kya chahiye").fill("2,400 sq ft office");
  await page.getByRole("button", { name: "Save karein" }).click();
  await expect(page).toHaveURL(/\/crm\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { name })).toBeVisible();
  // The deal opened itself in the first stage.
  await expect(page.getByText("2,400 sq ft office", { exact: true })).toBeVisible();
  await expect(page.getByText("New", { exact: true }).filter({ visible: true }).first()).toBeVisible();
  const url = page.url();

  // The same phone again lands on the same person.
  await page.goto("/crm");
  await page.getByRole("button", { name: "Naya customer" }).click();
  await page.getByLabel("Naam", { exact: true }).fill("Somebody Else");
  await page.getByLabel("Phone", { exact: true }).fill(`+91 ${phone}`);
  await page.getByRole("button", { name: "Save karein" }).click();
  await expect(page).toHaveURL(url);
  await expect(page.getByRole("heading", { name })).toBeVisible();

  // The list counts exactly, and finds by a fragment of the phone.
  await page.goto(`/crm?q=${phone.slice(2, 8)}`);
  await expect(page.getByRole("link", { name, exact: true })).toBeVisible();
});

test("the owner hands the customer to Raju, who logs a call and moves the deal", async ({ page, browser }) => {
  await signInAs(page, "owner");
  // Found by search rather than the "no owner" filter: a rule left on by the
  // automation suite may already have given a website enquiry an owner.
  await page.goto(`/crm?q=${phone.slice(2, 8)}`);
  await page.getByRole("link", { name, exact: true }).click();
  await page.getByLabel("Kiske paas").selectOption({ label: "Raju" });
  await expect(page.getByLabel("Kiske paas").locator("option:checked")).toHaveText("Raju");

  const staffContext = await browser.newContext();
  const staff = await staffContext.newPage();
  await signInAs(staff, "staff");
  await staff.goto("/crm?f=mine");
  await staff.getByRole("link", { name, exact: true }).click();
  await staff.getByRole("button", { name: "Call likhein" }).click();
  await staff.getByPlaceholder("Kya baat hui, aage kya").fill("Wants a quotation by Thursday");
  await staff.getByRole("button", { name: "Save karein" }).click();
  await expect(staff.getByText("Wants a quotation by Thursday")).toBeVisible();

  await staff.getByLabel("Stage badlein").selectOption({ label: "Proposal" });
  await expect(staff.getByText("Proposal", { exact: true }).filter({ visible: true }).first()).toBeVisible();
  // Raju cannot manage the pipeline's stages.
  await staff.goto("/crm/settings");
  await expect(staff).toHaveURL(/\/crm$/);
  await staffContext.close();
});

test("work made for a customer says so, and the history keeps the whole story", async ({ page }) => {
  await signInAs(page, "owner");
  await page.goto("/crm?f=customers");
  // Not a customer yet: the enquiry is still open.
  await expect(page.getByRole("link", { name, exact: true })).toHaveCount(0);
  await page.goto("/crm");
  await page.getByRole("link", { name, exact: true }).click();

  await page.getByRole("button", { name: "Kaam banayein" }).click();
  await page.getByLabel(`${name} ke liye`).fill("Quotation bhejo");
  await page.getByRole("button", { name: "Kaam banayein" }).last().click();
  await expect(page.getByRole("link", { name: "Quotation bhejo" }).first()).toBeVisible();
  await page.getByRole("link", { name: "Quotation bhejo" }).first().click();
  await expect(page).toHaveURL(/\/kaam\//);
  // On a phone the task's context waits behind one line.
  await page.getByRole("button", { name: /Project aur documents/ }).click();
  await expect(page.getByText(`Customer se · ${name}`)).toBeVisible();

  // Won closes the deal and makes the person a customer.
  await page.goBack();
  await page.getByLabel("Stage badlein").selectOption({ label: "Won" });
  await expect(page.getByText("Customer", { exact: true }).filter({ visible: true }).first()).toBeVisible();

  await page.goto("/settings/history");
  await expect(page.getByText(`Nayi enquiry: ${name}`)).toBeVisible();
  await expect(page.getByText(`${name}: Proposal → Won`)).toBeVisible();
  await expect(page.getByText(`${name} customer bane`)).toBeVisible();
});

test("an outsider sees no customers, and cannot write one into the business", async () => {
  const owner = await signInApi("owner");
  const { data: orgs } = await owner.from("orgs").select("id");
  const orgId = orgs![0].id;
  const outsider = await signInApi("noorg");
  const { data } = await outsider.from("crm_contacts").select("id");
  expect(data).toEqual([]);
  const { error } = await outsider.from("crm_contacts").insert({ org_id: orgId, full_name: "Intruder", phone_e164: "+919999999999", created_by: (await outsider.auth.getUser()).data.user!.id });
  expect(error).not.toBeNull();
  // A member cannot hand out a customer either: assignment is a manager's call.
  const staff = await signInApi("staff");
  const { data: mine } = await staff.from("crm_contacts").select("id, owner_id").eq("full_name", name).maybeSingle();
  const { error: reassign } = await staff.from("crm_contacts").update({ owner_id: orgs![0].id }).eq("id", mine!.id);
  expect(reassign).not.toBeNull();
});

test("switched off, the CRM is Today and the data stays", async ({ page }) => {
  await signInAs(page, "owner");
  await page.goto("/settings/modules");
  // Campaigns and website leads are built on the CRM, so they go first: the
  // catalogue refuses to switch off something another module still needs.
  for (const dependent of ["Campaigns", "Website leads"]) {
    const dep = page.getByRole("switch", { name: dependent });
    if ((await dep.count()) && (await dep.getAttribute("aria-checked")) === "true") {
      await dep.click();
      await expect(dep).toHaveAttribute("aria-checked", "false");
    }
  }
  const toggle = page.getByRole("switch", { name: "Customers (CRM)" });
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-checked", "false");
  await page.goto("/crm");
  await expect(page).toHaveURL(/\/aaj$/);
  await page.goto("/more");
  await expect(page.getByRole("link", { name: "Customers", exact: true })).toHaveCount(0);

  await toggle.waitFor({ state: "detached" }).catch(() => {});
  await page.goto("/settings/modules");
  const again = page.getByRole("switch", { name: "Customers (CRM)" });
  await again.click();
  await expect(again).toHaveAttribute("aria-checked", "true");
  await page.goto("/crm?f=customers");
  await expect(page.getByRole("link", { name, exact: true })).toBeVisible();
});
