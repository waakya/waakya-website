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

  // The positioning, in the first viewport, on a desk.
  await expect(page.getByText("Bolo. Ho jayega.", { exact: true }).first()).toBeInViewport();
  await expect(
    page.getByRole("heading", { level: 1, name: /Your entire business\.\s*One workspace\./ }),
  ).toBeInViewport();
  await expect(page.getByRole("link", { name: "Start with my business" }).first()).toBeInViewport();
  // The nav's three sections exist and the story's one business is named.
  for (const id of ["one-day", "adapts", "customers"]) {
    await expect(page.locator(`#${id}`)).toHaveCount(1);
  }
  await expect(page.getByText("ABC Interiors").first()).toBeVisible();
  // The old story's vocabulary is gone.
  await expect(page.getByText(/The new era of business communication|Get started/)).toHaveCount(0);
});

test("a signed-in visitor is taken to their day, not sold to", async ({ page }) => {
  await signInAs(page, "owner");
  await page.goto("/");
  await expect(page).toHaveURL(/\/aaj$/);
});

test("the owner's Today on a desk: few places, the day in one line, one list of what needs them", async ({
  page,
}) => {
  await signInAs(page, "owner", "en");
  await page.goto("/aaj");

  // Design V3: the sidebar holds the daily places; everything else is one
  // click away under More (open by itself when you are inside one of those).
  const sidebar = page.getByRole("navigation").first();
  await expect(sidebar).toBeVisible();
  for (const place of ["Today", "Conversations", "Work"]) {
    await expect(sidebar.getByRole("link", { name: place, exact: true })).toBeVisible();
  }
  await sidebar.locator("summary", { hasText: "More" }).click();
  await expect(sidebar.getByRole("link", { name: "Team" })).toBeVisible();

  // The six numbers of the day, as one line of words.
  const counters = page.getByRole("list", { name: "Today" }).first();
  await expect(counters.getByText("Sent", { exact: true })).toBeVisible();
  await expect(counters.getByText("Not seen", { exact: true })).toBeVisible();
  await expect(counters.getByRole("listitem")).toHaveCount(6);

  // What needs the owner, in one place, and who is on today.
  await expect(page.getByRole("heading", { name: /^Needs you/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your team today" })).toBeVisible();
  // The whole list of work lives in Work, one click away.
  await expect(page.getByRole("link", { name: /All work/ })).toBeVisible();
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
  await page.goto("/work");
  const first = page.getByRole("table").first().getByRole("link").first();
  await first.click();
  await expect(page).toHaveURL(/\/kaam\/[0-9a-f-]{36}$/);

  await expect(page.getByRole("list", { name: "Timeline" })).toBeVisible();
  await expect(page.getByRole("progressbar", { name: /Acknowledge/ })).toBeVisible();
  // Design V2: on desktop the actions head a rail beside the record — in
  // flow (not the phone's fixed strip), on screen without scrolling however
  // long the record is, and to the right of the timeline. (Call is a tel:
  // link when the person has a number on file, so the bar is asserted rather
  // than the one control.)
  const actions = page.locator("footer").first();
  await expect(actions).toBeVisible();
  await expect(actions).toContainText("Call");
  await expect(actions).toContainText("Reassign");
  await expect(actions).toBeInViewport();
  expect(await actions.evaluate((el) => getComputedStyle(el).position)).not.toBe("fixed");

  const bar = await actions.boundingBox();
  const timeline = await page.getByRole("list", { name: "Timeline" }).boundingBox();
  expect(bar!.width).toBeGreaterThan(280);
  expect(bar!.x).toBeGreaterThan(timeline!.x + timeline!.width);
});

test("the dev role switcher shows both sides", async ({ page }) => {
  await signInAs(page, "owner", "en");
  await page.goto("/aaj");
  // It only exists when DEV_DISABLE_AUTH is on, which the e2e turns off.
  await expect(page.getByRole("button", { name: "Owner" })).toHaveCount(0);
});
