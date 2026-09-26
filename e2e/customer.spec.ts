import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { signInAs, signOut, TEST_USERS } from "./support/auth";

/**
 * The customer experience as one transaction, not theatre: the business
 * links a customer, gives them a door, asks them to choose; the customer
 * signs in with that address, sees only what was published, chooses; the
 * choice closes the question, opens the blocked work, tells the business,
 * and lands in the history. Then the doors hold: a second choice is refused,
 * an outsider cannot decide, and revoking access closes the page.
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
const projectName = `Sterling office ${run}`;
let customerName = `Sterling Group ${run}`;
let inviteUrl = "";
let projectId = "";

test("the business turns the portal on, makes the project and its customer", async ({ page }) => {
  await signInAs(page, "owner", "en");
  await page.goto("/settings/modules");
  for (const name of ["Customers (CRM)", "Customer portal"]) {
    const toggle = page.getByRole("switch", { name });
    if ((await toggle.getAttribute("aria-checked")) !== "true") {
      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-checked", "true");
    }
  }
  // The customer, with the address the invite will be bound to.
  await page.goto("/crm");
  await page.getByRole("button", { name: "New customer" }).click();
  await page.getByLabel("Name", { exact: true }).fill(customerName);
  await page.getByLabel("Email", { exact: true }).fill(TEST_USERS.customer.email);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page).toHaveURL(/\/crm\//);
  // The address is the identity: a second run lands on the same person.
  customerName = (await page.locator("h1").first().innerText()).trim();

  await page.goto("/projects");
  await page.getByRole("button", { name: "New project" }).click();
  await page.getByLabel("Project name").fill(projectName);
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page).toHaveURL(/\/projects\/[0-9a-f-]{36}$/);
  projectId = page.url().split("/").pop()!;

  await page.getByLabel("Choose customer").selectOption({ label: customerName });
  await expect(page.getByRole("link", { name: customerName })).toBeVisible();
  await page.getByRole("button", { name: "Give portal access" }).click();
  const link = page.locator("code").filter({ hasText: "/portal/join/" });
  await expect(link).toBeVisible();
  inviteUrl = (await link.innerText()).trim();

  // A milestone the customer will see, and a customer-visible update.
  await page.getByLabel("Milestone name").fill("Reception");
  await page.getByRole("button", { name: "Add milestone" }).click();
  await expect(page.getByLabel("Milestone name")).toHaveValue("");
  await expect(page.getByText("Reception", { exact: true })).toBeVisible();
  const updateBox = page.getByLabel("What happened");
  await updateBox.fill("False ceiling complete");
  await page.getByRole("button", { name: "Show the customer", exact: true }).click();
  // The box empties only once the server has the update.
  await expect(updateBox).toHaveValue("");
  await expect(page.getByRole("paragraph").filter({ hasText: "False ceiling complete" })).toBeVisible();
});

test("the business asks the customer to choose, and the work waits", async ({ page }) => {
  await signInAs(page, "owner", "en");
  // Work that waits on the answer: made on the Confirm card, attached to the project.
  await page.goto("/naya");
  await page.getByRole("button", { name: /^Who/ }).click();
  await page.getByRole("button", { name: "Raju" }).click();
  await page.getByRole("button", { name: /^What/ }).click();
  await page.getByRole("textbox", { name: "What" }).fill(`Shutter order ${run}`);
  await page.getByRole("button", { name: "Save" }).click();
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page).toHaveURL(/\/aaj/);

  await page.goto(`/projects/${projectId}`);
  await page.getByText("Manage project").click();
  await page.getByLabel("Add a task to this project").selectOption({ label: `Shutter order ${run}` });
  await expect(page.getByRole("link", { name: `Shutter order ${run}` })).toBeVisible();

  await page.getByRole("button", { name: "Ask the customer" }).click();
  await page.getByLabel("What to choose").fill("Laminate");
  await page.getByLabel("Options").fill("Walnut, Oak, Teak");
  await page.getByLabel("Blocks this task").selectOption({ label: `Shutter order ${run}` });
  await page.getByRole("button", { name: "Ask", exact: true }).click();
  await expect(page.getByText("Waiting on the customer")).toBeVisible();
});

test("the customer signs in with that address, sees only what was published, and chooses", async ({ page }) => {
  await signInAs(page, "customer", "en");
  await page.goto(inviteUrl);
  await page.getByRole("button", { name: "Open my project" }).click();
  await expect(page).toHaveURL(/\/portal/);
  if (!page.url().endsWith(projectId)) {
    // Several projects from earlier runs: pick this one from the list.
    await page.goto("/portal");
    await page.getByRole("link", { name: projectName }).click();
  }
  await expect(page).toHaveURL(`/portal/projects/${projectId}`);
  await expect(page.getByRole("heading", { name: projectName })).toBeVisible();
  await expect(page.getByText("False ceiling complete").first()).toBeVisible();
  await expect(page.getByText("Reception", { exact: true }).first()).toBeVisible();
  // Nothing of the business's own navigation is here.
  await expect(page.getByRole("link", { name: "Today" })).toHaveCount(0);

  const walnut = page.getByRole("button", { name: "Walnut", exact: true });
  const oak = page.getByRole("button", { name: "Oak", exact: true });
  await oak.click();
  await expect(oak).toHaveAttribute("aria-pressed", "true");
  await walnut.click();
  await expect(walnut).toHaveAttribute("aria-pressed", "true");
  await expect(oak).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "Confirm: Walnut" }).click();
  await expect(page.getByText("You chose Walnut").first()).toBeVisible();
  await page.reload();
  await expect(page.getByText("You chose Walnut").first()).toBeVisible();
  await expect(page.getByText("Laminate: Walnut").first()).toBeVisible();

  // A word to the business.
  const box = page.getByLabel("Write to us");
  await box.fill("When does the lighting start?");
  await page.getByRole("button", { name: "Send" }).click();
  // The box empties only once the server has the message.
  await expect(box).toHaveValue("");
  await expect(page.getByRole("paragraph").filter({ hasText: "When does the lighting start?" })).toBeVisible();
});

test("the choice reached the business: the work opened, Today and the history say so", async ({ page }) => {
  await signInAs(page, "owner", "en");
  await page.goto(`/projects/${projectId}`);
  await expect(page.getByText("Laminate: Chose Walnut").first()).toBeVisible();
  await expect(page.getByText("When does the lighting start?").first()).toBeVisible();
  // The blocked task is free: the customer's answer sits on its timeline.
  await page.getByRole("link", { name: `Shutter order ${run}` }).first().click();
  await expect(page.getByText("decision:Walnut")).toBeVisible();
  await page.goto("/aaj");
  await expect(page.getByRole("link", { name: /customer messages unanswered/ }).first()).toBeVisible();
  await page.goto("/settings/history");
  await expect(page.getByText("Customer chose Walnut (Laminate)").first()).toBeVisible();
  await expect(page.getByText(`Customer message · ${projectName}`).first()).toBeVisible();
});

test("deciding twice, or as an outsider, changes nothing", async () => {
  const customer = api();
  await customer.auth.signInWithPassword({ email: TEST_USERS.customer.email, password: TEST_USERS.customer.password });
  const { data: decisions } = await customer.from("customer_decisions").select("id, decided_option_key").eq("project_id", projectId);
  expect(decisions?.length).toBe(1);
  const { data: again } = await customer.rpc("record_customer_decision", { p_decision: decisions![0].id, p_option: "oak" });
  expect(again?.[0]?.already_decided).toBe(true);
  expect(again?.[0]?.option_key).toBe("walnut");
  // The customer cannot read what was not published, nor anything of the team.
  const { data: tasks } = await customer.from("tasks").select("id");
  expect(tasks).toEqual([]);
  const { data: members } = await customer.from("memberships").select("id");
  expect(members).toEqual([]);
  const { data: internal } = await customer.from("project_updates").select("id").eq("customer_visible", false);
  expect(internal).toEqual([]);

  const staff = api();
  await staff.auth.signInWithPassword({ email: TEST_USERS.staff.email, password: TEST_USERS.staff.password });
  const { error } = await staff.rpc("record_customer_decision", { p_decision: decisions![0].id, p_option: "oak" });
  expect(error).not.toBeNull();
});

test("revoking access closes the page, and the person is a visitor again", async ({ page }) => {
  await signInAs(page, "owner", "en");
  await page.goto(`/projects/${projectId}`);
  await page.getByRole("button", { name: "Revoke access" }).click();
  await expect(page.getByRole("button", { name: "Give portal access" })).toBeVisible();

  await signOut(page);
  await signInAs(page, "customer");
  await page.goto(`/portal/projects/${projectId}`);
  await expect(page).toHaveURL(/\/setup$/);
  await page.goto("/aaj");
  await expect(page).toHaveURL(/\/setup$/);
});
