import { expect, test } from "@playwright/test";

import { signInAs, signOut } from "./support/auth";

/**
 * The website boundary: a key minted once, a POST that becomes a customer
 * with a website activity, a retry that answers the same, a wrong or
 * revoked key refused, a flood held back. The business reads it all in the
 * request ledger.
 */
test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ page }) => {
  await signOut(page);
});

const run = Date.now();
let key = "";

test("the owner switches the website integration on and mints a key", async ({ page }) => {
  await signInAs(page, "owner", "en");
  await page.goto("/settings/modules");
  for (const name of ["Customers (CRM)", "Website leads"]) {
    const toggle = page.getByRole("switch", { name });
    if ((await toggle.getAttribute("aria-checked")) !== "true") {
      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-checked", "true");
    }
  }
  await page.goto("/settings/integrations");
  await page.getByRole("button", { name: "New key" }).click();
  await page.getByLabel(/Key name/).fill(`Main website ${run}`);
  await page.getByRole("button", { name: "Create" }).click();
  key = (await page.getByTestId("minted-key").innerText()).trim();
  expect(key).toMatch(/^wk_(live|test)_[0-9a-f]{8}_[0-9a-f]{32}$/);
});

test("an enquiry from the website becomes a customer, and a retry answers the same", async ({ page, request }) => {
  const body = { full_name: `Site visitor ${run}`, phone: `94${String(run).slice(-8)}`, source: "website", interest: "3 BHK", message: "Need a site visit" };
  const first = await request.post("/api/integrations/leads", {
    headers: { authorization: `Bearer ${key}`, "idempotency-key": `form-${run}` },
    data: body,
  });
  expect(first.status()).toBe(202);
  const answer = (await first.json()) as { ok: boolean; contact_id: string; deduplicated: boolean };
  expect(answer.ok).toBe(true);
  expect(answer.deduplicated).toBe(false);

  const again = await request.post("/api/integrations/leads", {
    headers: { authorization: `Bearer ${key}`, "idempotency-key": `form-${run}` },
    data: body,
  });
  expect(again.status()).toBe(202);
  const replay = (await again.json()) as { contact_id: string; replayed?: boolean };
  expect(replay.contact_id).toBe(answer.contact_id);
  expect(replay.replayed).toBe(true);

  // The same person from another form is one record, not two.
  const other = await request.post("/api/integrations/leads", {
    headers: { authorization: `Bearer ${key}` },
    data: { full_name: "Same Person", phone: `+91 ${body.phone}`, source: "website" },
  });
  expect(other.status()).toBe(202);
  expect(((await other.json()) as { contact_id: string; deduplicated: boolean }).deduplicated).toBe(true);

  await signInAs(page, "owner", "en");
  await page.goto(`/crm/${answer.contact_id}`);
  await expect(page.getByRole("heading", { name: body.full_name })).toBeVisible();
  await expect(page.getByText("Website", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Need a site visit").first()).toBeVisible();
  await page.goto("/settings/integrations");
  await expect(page.getByText("202").first()).toBeVisible();
});

test("bad input, a wrong key, and a flood are each refused with a stable reason", async ({ request }) => {
  const wrong = await request.post("/api/integrations/leads", { headers: { authorization: "Bearer wk_test_00000000_" + "0".repeat(32) }, data: { full_name: "x", phone: "9800000000" } });
  expect(wrong.status()).toBe(401);
  const noReach = await request.post("/api/integrations/leads", { headers: { authorization: `Bearer ${key}` }, data: { full_name: "Nobody" } });
  expect(noReach.status()).toBe(422);
  expect(((await noReach.json()) as { error: string }).error).toBe("phone_or_email_required");
  const extra = await request.post("/api/integrations/leads", { headers: { authorization: `Bearer ${key}` }, data: { full_name: "x", phone: "9800000001", evil: "drop table" } });
  expect(extra.status()).toBe(422);

  let limited = 0;
  for (let i = 0; i < 70 && !limited; i += 1) {
    const r = await request.post("/api/integrations/leads", { headers: { authorization: `Bearer ${key}` }, data: { full_name: `Flood ${i}`, email: `flood${run}-${i}@example.com`, source: "website" } });
    if (r.status() === 429) limited = i;
  }
  expect(limited).toBeGreaterThan(0);
});

test("a revoked key opens nothing", async ({ page, request }) => {
  await signInAs(page, "owner", "en");
  await page.goto("/settings/integrations");
  await page.getByRole("listitem").filter({ hasText: `Main website ${run}` }).getByRole("button", { name: "Revoke" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: `Main website ${run}` }).getByText("Revoked")).toBeVisible();
  const after = await request.post("/api/integrations/leads", { headers: { authorization: `Bearer ${key}` }, data: { full_name: "Late", phone: "9800000002" } });
  expect(after.status()).toBe(401);
  expect(((await after.json()) as { error: string }).error).toBe("key_revoked");
});
