import { expect, test, type Page } from "@playwright/test";
import { signInAs, signOut } from "./support/auth";
import { onScreen } from "./support/visible";

/**
 * Design V3's Today contract (docs/WAAKYA_V3_INFORMATION_ARCHITECTURE.md):
 * progressive disclosure, never hidden work. The e2e business is deliberately
 * busy — it accumulates every run's tasks — which is exactly the case that
 * once hid a freshly sent task.
 */
test.describe.configure({ mode: "serial" });

async function createTask(page: Page, title: string) {
  await page.goto("/naya");
  await page.getByRole("button", { name: /^Kisko/ }).click();
  await page.getByRole("button", { name: "Raju" }).click();
  await page.getByRole("button", { name: /^Kya/ }).click();
  await page.getByRole("textbox", { name: "Kya" }).fill(title);
  await page.getByRole("button", { name: "Save" }).click();
  await page.getByRole("button", { name: "Bhejo" }).click();
  await expect(page).toHaveURL(/\/aaj$/);
}

test("every count on Today leads to exactly that many tasks", async ({ page }) => {
  await signOut(page);
  await signInAs(page, "owner");
  await page.goto("/aaj");
  const summary = page.getByTestId("attention-summary");
  await expect(summary).toBeVisible();

  const links = await summary.getByRole("link").evaluateAll((els) =>
    els.map((el) => ({ href: el.getAttribute("href") ?? "", text: el.textContent ?? "" })),
  );
  const taskGroups = links.filter((link) => link.href.startsWith("/work?need="));
  expect(taskGroups.length).toBeGreaterThan(0);

  for (const group of taskGroups) {
    const count = Number(group.text.trim().split(/\s+/)[0]);
    await page.goto(group.href);
    await expect(page.getByTestId("work-list").getByRole("listitem")).toHaveCount(count);
  }
});

test("a busy group shows three rows and an exact way to the rest", async ({ page }) => {
  await signOut(page);
  await signInAs(page, "owner");
  await page.goto("/aaj");
  const list = page.getByRole("list", { name: "Aapke liye" });
  const more = list.getByRole("link", { name: /^\d+ aur · / });
  if ((await more.count()) === 0) test.skip(true, "Today is not busy enough to fold");
  const first = more.first();
  const rest = Number((await first.textContent())!.trim().split(/\s+/)[0]);
  await first.click();
  await expect(page).toHaveURL(/\/(work|approvals|hazri|baat|crm|vendors)/);
  if (page.url().includes("/work?need=")) {
    // Three on Today, the rest behind the link: Work holds all of them.
    await expect(page.getByTestId("work-list").getByRole("listitem")).toHaveCount(rest + 3);
  }
});

test("a task sent a moment ago can always be reached from Today", async ({ page }) => {
  const title = `Just sent ${Date.now()}`;
  await signOut(page);
  await signInAs(page, "owner");
  await createTask(page, title);

  // In the waiting list the row's name carries its meta line too, so the
  // title is matched as a prefix there and exactly everywhere else.
  const row = onScreen(page.getByRole("link", { name: title, exact: true })).or(
    onScreen(page.getByRole("list", { name: "Team par baaki" }).getByRole("link", { name: new RegExp(`^${title}\\b`) })),
  );
  if ((await row.count()) === 0) {
    // Not in the first five waiting: the section says how many more, and
    // that link reaches it.
    const more = page.getByRole("link", { name: /^\d+ aur · Team par baaki/ });
    await expect(more).toBeVisible();
    const rest = Number((await more.textContent())!.trim().split(/\s+/)[0]);
    await more.click();
    // Five on Today plus the rest: the list agrees with the link that led here.
    await expect(page.getByTestId("work-list").getByRole("listitem")).toHaveCount(rest + 5);
    await expect(onScreen(page.getByRole("link", { name: title, exact: true }))).toHaveCount(1);
  } else {
    await expect(row).toHaveCount(1);
  }
});
