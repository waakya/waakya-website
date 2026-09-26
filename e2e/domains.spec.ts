import { expect, test } from "@playwright/test";

import { signInAs, signOut } from "./support/auth";

/**
 * The custom-domain foundation: a hostname is added with its verification
 * record, a check against real DNS says honestly that the record is not
 * there yet, an unknown host is refused by the edge, and removal works.
 */
test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ page }) => {
  await signOut(page);
});

const run = Date.now();
const host = `portal-${String(run).slice(-6)}.example.com`;

test("the owner switches custom domains on and adds a hostname with its record", async ({ page }) => {
  await signInAs(page, "owner", "en");
  await page.goto("/settings/modules");
  for (const name of ["Customer portal", "Custom domain"]) {
    const toggle = page.getByRole("switch", { name });
    if ((await toggle.getAttribute("aria-checked")) !== "true") {
      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-checked", "true");
    }
  }
  await page.goto("/settings/domains");
  await page.getByRole("button", { name: "Add" }).click();
  await page.getByLabel("Hostname").fill(`https://${host}/`);
  await page.getByRole("button", { name: "Add" }).last().click();
  const row = page.getByRole("listitem").filter({ hasText: host });
  await expect(row.getByText("Waiting for verification")).toBeVisible();
  await expect(row.getByText(`_waakya-verify.${host}`)).toBeVisible();
  await expect(row.getByText(/^waakya-verify=[0-9a-f]{32}$/)).toBeVisible();

  // Honest: DNS has no such record, and the screen says so.
  await row.getByRole("button", { name: "Check" }).click();
  await expect(row.getByText(/Last checked/)).toBeVisible();
  await expect(row.getByText("Waiting for verification")).toBeVisible();

  // Nonsense is refused before it is stored.
  await page.getByRole("button", { name: "Add" }).first().click();
  await page.getByLabel("Hostname").fill("evil.waakya.com");
  await page.getByRole("button", { name: "Add" }).last().click();
  await expect(page.getByRole("listitem").filter({ hasText: "evil.waakya.com" })).toHaveCount(0);
});

test("an unknown host gets nothing, and the hostname can be removed", async ({ page, request }) => {
  const stranger = await request.get("/aaj", { headers: { host: "portal.someone-else.example" }, maxRedirects: 0 });
  expect(stranger.status()).toBe(404);
  const pending = await request.get("/portal", { headers: { host }, maxRedirects: 0 });
  expect(pending.status()).toBe(404);

  await signInAs(page, "owner", "en");
  await page.goto("/settings/domains");
  const row = page.getByRole("listitem").filter({ hasText: host });
  await row.getByRole("button", { name: "Remove" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: host })).toHaveCount(0);
});
