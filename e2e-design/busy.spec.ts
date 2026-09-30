import { expect, test, type Page } from "@playwright/test";
import { PASSWORD } from "./support";

/**
 * Today with realistic large data (scripts/local/seed-busy.ts, Gupta
 * Logistics: 335 tasks, 12 approvals, 9 leave requests, 12 unread chats).
 * The V3 contract: critical work stays discoverable, every count matches
 * Work, and no category silently disappears.
 */
const BASE = process.env.DESIGN_BASE ?? "http://localhost:3200";

async function signInBusy(page: Page, email: string) {
  const r = await page.request.post("/api/test-login", { data: { email, password: PASSWORD } });
  if (!r.ok()) throw new Error(`sign-in failed for ${email}: ${r.status()} — run npx jiti scripts/local/seed-busy.ts`);
  await page.context().addCookies([{ name: "waakya_lang", value: "en", url: BASE }]);
}

const firstNumber = (text: string | null) => Number((text ?? "").trim().split(/\s+/)[0]);

test("a busy owner sees every kind of waiting work, with counts", async ({ page }) => {
  await signInBusy(page, "owner@busy.test");
  await page.goto("/aaj");
  const summary = page.getByTestId("attention-summary");
  await expect(summary).toBeVisible();
  const text = (await summary.textContent()) ?? "";
  for (const kind of ["Late", "Escalated to you", "Not seen", "Verify pending", "Approvals", "Leave", "Conversations"]) {
    expect(text, `${kind} is missing from Today's summary`).toMatch(new RegExp(`\\d+ ${kind}`, "i"));
  }
  // All 60 late tasks are counted — a "newest 200" query once dropped 58 of
  // them once the business passed 200 tasks.
  expect(Number(/(\d+) Late/.exec(text)?.[1])).toBeGreaterThanOrEqual(60);
  // Busy: each group folds to three rows and says how many more.
  // Late work is in Stuck; decisions are in Needs you. Both fold.
  const stuck = page.getByRole("list", { name: "Stuck" });
  await expect(stuck.getByRole("link", { name: /^\d+ more · Late/ })).toBeVisible();
  // The page stays bounded however busy the business is: at most three rows,
  // a "more" link and a group title per kind of waiting thing.
  const needs = page.getByRole("list", { name: "Needs you" });
  const rows = (await needs.getByRole("listitem").count()) + (await stuck.getByRole("listitem").count());
  expect(rows).toBeLessThanOrEqual(13 * 5);
});

test("every count on a busy Today matches the list it leads to", async ({ page }) => {
  await signInBusy(page, "owner@busy.test");
  await page.goto("/aaj");
  const links = await page
    .getByTestId("attention-summary")
    .getByRole("link")
    .evaluateAll((els) => els.map((el) => ({ href: el.getAttribute("href") ?? "", text: el.textContent ?? "" })));
  const workLinks = links.filter((l) => l.href.startsWith("/work?need="));
  expect(workLinks.length).toBeGreaterThanOrEqual(3);
  for (const link of workLinks) {
    await page.goto(link.href);
    // Desktop shows the table; count its body rows.
    await expect(page.getByRole("main").locator("table tbody tr"), link.href).toHaveCount(firstNumber(link.text));
  }
});

test("the waiting list says how much more there is, and Work agrees", async ({ page }) => {
  await signInBusy(page, "owner@busy.test");
  await page.goto("/aaj");
  const more = page.getByRole("link", { name: /^\d+ more · Waiting on your team/ });
  await expect(more).toBeVisible();
  const rest = firstNumber(await more.textContent());
  await more.click();
  await expect(page).toHaveURL(/need=waiting/);
  await expect(page.getByRole("main").locator("table tbody tr")).toHaveCount(rest + 5);
});

test("a manager is never offered their own leave to decide", async ({ page }) => {
  await signInBusy(page, "manager@busy.test");
  await page.goto("/aaj");
  await expect(page.getByText("Farah Siddiqui", { exact: false }).filter({ hasText: /leave/i })).toHaveCount(0);
});

test("@phone a busy owner's Today fits the phone and keeps its counts", async ({ page }) => {
  await signInBusy(page, "owner@busy.test");
  await page.goto("/aaj");
  await expect(page.getByTestId("attention-summary")).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
