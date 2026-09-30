import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { horizontalOverflow } from "./support/overflow";
import { signOut } from "./support/auth";

/**
 * The homepage: one business's story told on one grid, with real doors. Signed-out
 * visitors get the story; every call to action goes somewhere real; the page
 * composes at every width a customer is likely to hold, with nothing
 * reaching past the edge and nothing interactive too small for a finger.
 */
const WIDTHS = [390, 430, 768, 820, 1024, 1280, 1440];

test.beforeEach(async ({ page }) => {
  await signOut(page);
});

test("the story is served signed out, with real doors", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Your entire business/);
  await expect(page.getByRole("link", { name: "Start with my business" }).first()).toHaveAttribute("href", "/login");
  await expect(page.getByRole("link", { name: "See Waakya", exact: true })).toHaveAttribute("href", "/demo");
  await expect(page.getByRole("link", { name: "Sign in" }).first()).toHaveAttribute("href", "/login");
  await expect(page.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy");
  // Every in-page link lands on a section that exists.
  for (const href of ["#one-day", "#adapts", "#customers"]) {
    await expect(page.locator(href)).toHaveCount(1);
  }
  // No lab chrome survived the port.
  await expect(page.getByText(/design lab|V3\.4|V3\.5/i)).toHaveCount(0);
  // The doors open.
  await page.getByRole("link", { name: "Start with my business" }).first().click();
  await expect(page).toHaveURL(/\/login/);
});

test("the stories respond to the reader", async ({ page }) => {
  await page.goto("/");
  // Picking a step on the record's Line pauses the loop and holds that step.
  const marks = page.locator(".w4-rec-line button");
  await marks.nth(3).click();
  await expect(page.locator(".w4-rec-line li").nth(3)).toHaveAttribute("data-now", "true");
  await expect(page.getByRole("button", { name: /Play the loop/ })).toBeVisible();

  // Monday: the record is on the page before anything moves, and it fills.
  const monday = page.locator(".w4-monday");
  await monday.scrollIntoViewIfNeeded();
  await expect(monday.locator(".w4-record-name")).toHaveText("Meera Joshi");
  await expect(monday.getByText("nobody yet")).toBeVisible();
  await page.getByRole("button", { name: /Bring it together/ }).click();
  await expect(monday.getByText("Neha Singh")).toBeVisible();
  await expect(monday.getByText("Website enquiry")).toBeVisible();

  // The laminate the customer picks is the one that flows through the business.
  const loop = page.locator(".w35-cx");
  await loop.scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: /Steps/ }).or(page.locator(".w35-dots")).last().locator("button").nth(2).click();
  const oak = page.getByRole("button", { name: "Oak" });
  await expect(oak).toBeVisible();
  await oak.click();
  await expect(oak).toHaveAttribute("aria-pressed", "true");
  await expect(loop.getByText("Oak approved")).toBeVisible();
  await page.locator(".w35-dots").last().locator("button").nth(6).click();
  await expect(loop.getByText("Ordered · Oak")).toBeVisible();
  await expect(loop.getByText("Deccan gets the order · Oak, 12 units")).toBeVisible();
  await expect(loop.getByText("Oak · approved by Sterling, 2:20 pm")).toBeVisible();

  // Switching business changes the workspace with it.
  await page.getByRole("button", { name: /Omega Builders/ }).click();
  await expect(page.getByText(/Omega Heights · Tower A/)).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Omega Builders" }).getByText("Properties")).toBeVisible();
});

for (const width of WIDTHS) {
  test(`composes at ${width}px with nothing past the edge and finger-sized targets`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 700 ? 844 : 900 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // Let every story reach its end so the fullest layout is measured.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 40));
      }
      window.scrollTo(0, 0);
    });
    expect(await horizontalOverflow(page), "horizontal overflow").toBeLessThanOrEqual(0);

    if (width < 700) {
      // The hero fits in the first screen and a half on a phone.
      const heroBottom = await page.locator(".w32-herocopy").evaluate((el) => el.getBoundingClientRect().bottom);
      expect(heroBottom).toBeLessThan(844 * 1.2);
      const small = await page.evaluate(() => {
        const out: string[] = [];
        for (const el of Array.from(document.querySelectorAll<HTMLElement>("a, button"))) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          // The skip link is 1×1 until it is focused; it is a keyboard target, not a finger one.
          if (el.classList.contains("sr-only")) continue;
          if (r.height < 44) out.push(`${el.tagName} "${(el.textContent ?? "").trim().slice(0, 30)}" ${Math.round(r.width)}x${Math.round(r.height)}`);
        }
        return out;
      });
      expect(small, "targets under 44px").toEqual([]);
    }
  });
}

test("no serious or critical accessibility violations", async ({ page }) => {
  await page.goto("/");
  // Arrival animations settle before contrast is measured.
  await page.waitForTimeout(1200);
  const results = await new AxeBuilder({ page }).analyze();
  const bad = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`)).toEqual([]);
});
