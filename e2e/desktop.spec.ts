import { expect, test } from "@playwright/test";
import { signInAs, signOut } from "./support/auth";
import { onScreen } from "./support/visible";

/**
 * The desktop layouts. Everything else in this suite runs at a phone viewport,
 * so without these the wide screens would only ever be checked by eye.
 */
test.use({ viewport: { width: 1440, height: 900 }, isMobile: false, hasTouch: false });

test.describe.configure({ mode: "serial" });

test("the landing page sells the product to a logged-out visitor", async ({
  page,
}) => {
  await signOut(page);
  await page.goto("/");

  // A visitor reads English until they choose otherwise, and the page says
  // so, which is also what keeps the browser from offering to translate it.
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator('meta[name="google"]')).toHaveAttribute(
    "content",
    "notranslate",
  );

  // The name, marked so no translator treats it as a word. (The unit brand
  // test guards the whole tree against the old spelling.)
  await expect(page.getByRole("banner")).toContainText("Waakya");
  await expect(
    page.getByRole("banner").locator('[translate="no"]', { hasText: "Waakya" }),
  ).toBeVisible();

  // Phase 1 is one business and its team: the promise, the four steps, and
  // no claim about working across businesses.
  await expect(
    page.getByRole("heading", { level: 1, name: /Every conversation\.\s*A clear next step\./ }),
  ).toBeVisible();
  for (const step of ["Talk", "Assign", "Execute", "Prove"]) {
    await expect(page.getByText(step, { exact: true }).first()).toBeVisible();
  }
  await expect(page.getByText(/two businesses|shared workspace/i)).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /Less chasing\./ })).toBeVisible();

  // The sections a visitor is promised by the nav all exist.
  for (const id of ["product", "how", "businesses"]) {
    await expect(page.locator(`#${id}`)).toHaveCount(1);
  }

  // Both calls to action lead into the product.
  await expect(
    page.getByRole("link", { name: "Get started" }).first(),
  ).toHaveAttribute("href", "/login");
});

test("the walkthrough moves a quotation from message to verified", async ({ page }) => {
  await signOut(page);
  await page.goto("/");
  const tabs = page.getByRole("tablist", { name: "Walkthrough" });
  await tabs.getByRole("tab", { name: "Assign a task" }).click();
  await expect(page.getByRole("tabpanel").getByText("Accepted")).toBeVisible();
  await tabs.getByRole("tab", { name: "Verify" }).click();
  await expect(page.getByRole("tabpanel").getByText("Verified by Priya · 4:52 PM")).toBeVisible();
});

test("a signed-in visitor is taken to their day, not sold to", async ({ page }) => {
  await signInAs(page, "owner");
  await page.goto("/");
  await expect(page).toHaveURL(/\/aaj$/);
});

test("the owner dashboard uses the width: sidebar, counters, table, rail", async ({
  page,
}) => {
  await signInAs(page, "owner", "en");
  await page.goto("/aaj");

  // The sidebar replaces the bottom nav.
  const sidebar = page.getByRole("navigation").first();
  await expect(sidebar).toBeVisible();
  await expect(sidebar.getByRole("link", { name: "Team" })).toBeVisible();
  await expect(onScreen(page.getByRole("link", { name: "Today", exact: true }))).toBeVisible();

  // Six counters as their own cards, not crammed into a Neel bar. Scoped to
  // the counter list: the same words appear in the table's status column.
  const counters = page.getByRole("list", { name: "Today" }).first();
  await expect(counters.getByText("Sent", { exact: true })).toBeVisible();
  await expect(counters.getByText("Not seen", { exact: true })).toBeVisible();
  await expect(counters.getByRole("listitem")).toHaveCount(6);

  // The day's work is a table with named columns.
  const table = page.getByRole("table").first();
  await expect(table).toBeVisible();
  for (const column of ["TASK", "WHO", "BY WHEN", "STATUS", "ACTION"]) {
    await expect(table.getByRole("columnheader", { name: column })).toBeVisible();
  }

  // And the rail carries what a phone has no room for.
  await expect(page.getByText("This week")).toBeVisible();
  await expect(page.getByText("Staff today")).toBeVisible();
});

test("the same page on a phone is the phone layout", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signInAs(page, "owner", "en");
  await page.goto("/aaj");

  // No sidebar, no table — the Neel header and the cards, as designed.
  await expect(page.getByRole("table")).toHaveCount(0);
  await expect(
    onScreen(page.getByRole("link", { name: "Today", exact: true })),
  ).toBeVisible();
  await expect(page.locator("header.bg-neel-700")).toBeVisible();
});

test("the task detail spreads into two columns", async ({ page }) => {
  await signInAs(page, "owner", "en");
  await page.goto("/aaj");
  const first = page.getByRole("table").first().getByRole("link").first();
  await first.click();
  await expect(page).toHaveURL(/\/kaam\/[0-9a-f-]{36}$/);

  await expect(page.getByRole("list", { name: "Timeline" })).toBeVisible();
  await expect(page.getByRole("progressbar", { name: /Acknowledge/ })).toBeVisible();
  // The action bar is in flow on desktop, not a narrow floating strip: it is
  // as wide as the column it sits under. (Call is a tel: link when the person
  // has a number on file, so the bar is asserted rather than the one control.)
  const actions = page.locator("footer").first();
  await expect(actions).toBeVisible();
  await expect(actions).toContainText("Call");
  await expect(actions).toContainText("Reassign");

  const bar = await actions.boundingBox();
  expect(bar!.width).toBeGreaterThan(500);
});

test("the dev role switcher shows both sides", async ({ page }) => {
  await signInAs(page, "owner", "en");
  await page.goto("/aaj");
  // It only exists when DEV_DISABLE_AUTH is on, which the e2e turns off.
  await expect(page.getByRole("button", { name: "Owner" })).toHaveCount(0);
});
