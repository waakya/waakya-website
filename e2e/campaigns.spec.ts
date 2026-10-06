import { createHmac } from "node:crypto";
import { expect, test } from "@playwright/test";

import { signInAs, signOut } from "./support/auth";

/**
 * Campaigns, responsibly: a segment previewed before anything goes, one
 * message per person through a mock provider, opt-outs and missing
 * addresses left out and said so, every send in the customer's timeline;
 * then a WhatsApp reply through the signed webhook lands on the customer,
 * marks the campaign reply, and STOP is honoured.
 */
test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ page }) => {
  await signOut(page);
});

const run = Date.now();
const willing = `Campaign yes ${run}`;
const optedOut = `Campaign no ${run}`;
const phone = `93${String(run).slice(-8)}`;
const phoneNumberId = String(run).slice(-10);

test("the owner sets up campaigns and two contacts, one of whom said no", async ({ page }) => {
  await signInAs(page, "owner", "en");
  await page.goto("/settings/modules");
  for (const name of ["Customers (CRM)", "Campaigns"]) {
    const toggle = page.getByRole("switch", { name });
    if ((await toggle.getAttribute("aria-checked")) !== "true") {
      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-checked", "true");
    }
  }
  for (const [name, email, tag] of [[willing, `yes${run}@example.com`, "launch"], [optedOut, `no${run}@example.com`, "launch"]] as const) {
    await page.goto("/crm");
    await page.getByRole("button", { name: "New customer" }).click();
    await page.getByLabel("Name", { exact: true }).fill(name);
    await page.getByLabel("Email", { exact: true }).fill(email);
    if (name === willing) await page.getByLabel("Phone", { exact: true }).fill(phone);
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page).toHaveURL(/\/crm\/[0-9a-f-]{36}$/);
    void tag;
  }
  // The second one said no to email.
  // Message preferences live behind one action on the customer (Visual V2).
  await page.getByRole("button", { name: "Messages and archive" }).click();
  await page.getByRole("checkbox", { name: "No email" }).check();
  await expect(page.getByRole("checkbox", { name: "No email" })).toBeChecked();

  await page.goto("/campaigns");
  await page.getByLabel("WhatsApp phone number id").fill(phoneNumberId);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByLabel("WhatsApp phone number id")).toHaveValue(phoneNumberId);
});

test("an email campaign to all leads reaches the willing one and says who was left out", async ({ page }) => {
  await signInAs(page, "owner", "en");
  await page.goto("/campaigns/new");
  await page.getByLabel("Name", { exact: true }).fill(`Launch ${run}`);
  await page.getByLabel("Subject").fill("New tower launching");
  await page.getByLabel("Message").fill("Hello {{name}}, Tower B opens for booking on Saturday.");
  await page.getByLabel("Kind").selectOption("lead");
  await page.getByRole("button", { name: "Reach" }).click();
  await expect(page.getByRole("status")).toContainText(/Reaches \d+ · \d+ left out/);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page).toHaveURL(/\/campaigns\/[0-9a-f-]{36}$/);

  await page.getByRole("button", { name: "Send now" }).click();
  await page.getByRole("button", { name: "Send now" }).last().click();
  await expect(page.getByText("Sent", { exact: true }).first()).toBeVisible({ timeout: 30_000 });
  const yesRow = page.getByRole("listitem").filter({ hasText: willing });
  await expect(yesRow.getByText("Sent", { exact: true })).toBeVisible();
  const noRow = page.getByRole("listitem").filter({ hasText: optedOut });
  await expect(noRow.getByText("Left out")).toBeVisible();
  await expect(noRow.getByText("opted_out")).toBeVisible();

  // The send is on the customer's timeline.
  await yesRow.getByRole("link", { name: willing }).click();
  await expect(page.getByText(`Campaign · Launch ${run} · New tower launching`)).toBeVisible();
});

test("a WhatsApp reply comes back through the signed webhook, and STOP is honoured", async ({ page, request }) => {
  const secret = process.env.WHATSAPP_APP_SECRET!;
  const event = (id: string, text: string) => ({
    object: "whatsapp_business_account",
    entry: [{ id: "1", changes: [{ value: { metadata: { phone_number_id: phoneNumberId }, messages: [{ id, from: `91${phone}`, type: "text", text: { body: text }, timestamp: String(Math.floor(Date.now() / 1000)) }] } }] }],
  });
  const post = async (payload: unknown, sign = true) => {
    const raw = JSON.stringify(payload);
    const sig = `sha256=${createHmac("sha256", secret).update(raw).digest("hex")}`;
    return request.post("/api/integrations/whatsapp", { headers: { "content-type": "application/json", ...(sign ? { "x-hub-signature-256": sig } : {}) }, data: raw });
  };
  expect((await post(event(`wamid.${run}.0`, "hi"), false)).status()).toBe(401);
  expect((await post(event(`wamid.${run}.1`, "Interested, call me tomorrow"))).status()).toBe(200);
  expect((await post(event(`wamid.${run}.1`, "Interested, call me tomorrow"))).status()).toBe(200);
  expect((await post(event(`wamid.${run}.2`, "STOP"))).status()).toBe(200);

  await signInAs(page, "owner", "en");
  await page.goto("/crm");
  await page.getByRole("link", { name: willing, exact: true }).click();
  await expect(page.getByText("Interested, call me tomorrow")).toHaveCount(1);
  // The opt-out is visible on the customer at a glance, and checked in the drawer.
  await expect(page.getByText("No WhatsApp", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Messages and archive" }).click();
  await expect(page.getByRole("checkbox", { name: "No WhatsApp" })).toBeChecked();
  await page.goto("/aaj");
  await expect(page.getByRole("link", { name: /Updates/ })).toBeVisible();
});
