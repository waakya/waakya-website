import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { horizontalOverflow } from "./support/overflow";
import { signInAs, signOut } from "./support/auth";

/**
 * The product's screens, swept for accessibility and composition: no
 * serious or critical axe violation, nothing reaching past the edge at any
 * width a customer is likely to hold, at every module's front door and
 * on the customer's own door.
 */
const SCREENS = [
  "/aaj",
  "/work",
  "/naya",
  "/crm",
  "/crm/pipeline",
  "/records",
  "/projects",
  "/vendors",
  "/automations",
  "/campaigns",
  "/settings",
  "/settings/modules",
  "/settings/history",
  "/settings/integrations",
  "/settings/domains",
  "/staff",
  "/khabar",
  "/more",
];
const WIDTHS = [390, 430, 768, 820, 1024, 1280, 1440];

test.beforeEach(async ({ page }) => {
  await signOut(page);
});

test("every module front door is on for the fixture business", async ({ page }) => {
  await signInAs(page, "owner", "en");
  await page.goto("/settings/modules");
  for (const name of ["Customers (CRM)", "Records", "Vendors", "Automations", "Campaigns"]) {
    const toggle = page.getByRole("switch", { name });
    if ((await toggle.count()) && (await toggle.getAttribute("aria-checked")) !== "true") {
      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-checked", "true");
    }
  }
});

for (const path of SCREENS) {
  test(`${path} has no serious or critical accessibility violation`, async ({ page }) => {
    await signInAs(page, "owner", "en");
    await page.goto(path);
    await expect(page.locator("main, [role=main]").first()).toBeVisible();
    await page.waitForTimeout(600);
    const results = await new AxeBuilder({ page }).disableRules(["region"]).analyze();
    const bad = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`)).toEqual([]);
  });
}

for (const width of WIDTHS) {
  test(`the product composes at ${width}px`, async ({ page }) => {
    await signInAs(page, "owner", "en");
    await page.setViewportSize({ width, height: width < 700 ? 844 : 900 });
    for (const path of ["/aaj", "/work", "/crm", "/records", "/projects", "/vendors", "/automations", "/campaigns", "/settings/modules"]) {
      await page.goto(path);
      await expect(page.locator("main, [role=main]").first()).toBeVisible();
      expect(await horizontalOverflow(page), `${path} overflow at ${width}`).toBeLessThanOrEqual(0);
    }
  });
}

test("the customer's door has no serious or critical accessibility violation", async ({ page }) => {
  await page.goto("/login");
  await page.waitForTimeout(400);
  const results = await new AxeBuilder({ page }).disableRules(["region"]).analyze();
  const bad = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`)).toEqual([]);
});
