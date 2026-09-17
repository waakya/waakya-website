import { expect, test } from "@playwright/test";
import {
  pinLocale,
  signInAs,
  signOut,
  TEST_LOCALE,
  TEST_USERS,
} from "./support/auth";
import { pageDictionary } from "./support/i18n";
import { onScreen } from "./support/visible";

/**
 * Org setup and the invite flow, end to end against the real database, so RLS
 * is exercised rather than described.
 */
test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ page }) => {
  await signOut(page);
});

/**
 * Invites accumulate across runs, so each run clears the ones it left behind.
 * Done through the owner's own UI rather than the database, so the revoke path
 * is exercised too.
 */
async function clearPendingInvites(page: import("@playwright/test").Page) {
  await page.goto("/staff");
  const remove = page.getByRole("button", { name: "Hatao" });
  for (let guard = 0; guard < 20; guard += 1) {
    const before = await remove.count();
    if (before === 0) break;
    await remove.first().scrollIntoViewIfNeeded();
    await remove.first().click();
    await expect(remove).toHaveCount(before - 1);
  }
}

test("an owner creates a business, invites staff, and the staff member joins", async ({
  page,
  browser,
}) => {
  await signInAs(page, "owner");

  // If a previous run already created the business, setup redirects onward.
  await page.goto("/setup");
  if (page.url().endsWith("/setup")) {
    await page.getByRole("radio", { name: "Hinglish" }).first().click();
    await page.getByLabel("Business ka naam").fill("Waakya Test Co");
    await page.getByRole("button", { name: "Business banao" }).click();
    await expect(page).toHaveURL(/\/staff$/);
  }

  await clearPendingInvites(page);
  await expect(page.getByRole("heading", { name: "Staff" })).toBeVisible();
  await expect(onScreen(page.getByText("Waakya Test Co")).first()).toBeVisible();

  // Invite the staff member and capture the link the owner would send.
  await page.getByRole("button", { name: "Staff bulao" }).click();
  await page.getByLabel("Naam").fill("Raju");
  await page.getByLabel("Phone number").fill("9876543210");
  await page.getByRole("button", { name: "Link banao" }).click();

  const link = await page.getByText(/\/join\/[0-9a-f]{32}/).innerText();
  const path = new URL(link.trim()).pathname;
  expect(path).toMatch(/^\/join\/[0-9a-f]{32}$/);

  // The invitee sees the business name before signing in, and nothing else.
  const invitee = await browser.newContext();
  const inviteePage = await invitee.newPage();
  await inviteePage.goto(path);
  // The join screen speaks the business's language (Hinglish), not the app
  // default, because that is the language the invitee will inherit.
  await expect(
    inviteePage.getByText("Waakya Test Co mein aapko bulaya gaya hai"),
  ).toBeVisible();
  await expect(inviteePage.getByText("Judne ke liye pehle sign in")).toBeVisible();
  await expect(inviteePage.getByRole("link", { name: "Login karein" })).toBeVisible();

  // Sign in as the staff member and accept.
  await inviteePage.request.post("/api/test-login", {
    data: {
      email: TEST_USERS.staff.email,
      password: TEST_USERS.staff.password,
    },
  });
  await pinLocale(inviteePage, TEST_LOCALE);
  await inviteePage.goto(path);
  const join = inviteePage.getByRole("button", { name: "Jud jao" });
  if (await join.isVisible().catch(() => false)) {
    await join.click();
    await expect(inviteePage).toHaveURL(/\/aaj$/);
  }

  // The staff member is now in the org, and sees a three-item nav, not four.
  await inviteePage.goto("/settings");
  await expect(onScreen(inviteePage.getByText("Waakya Test Co")).first()).toBeVisible();
  await expect(
    inviteePage.getByRole("link", { name: "Staff", exact: true }),
  ).toHaveCount(0);

  await invitee.close();

  // The owner now sees the staff member in the team list — not merely as a
  // pending invite, which is a different list on the same screen.
  await page.goto("/staff");
  const team = page.getByRole("list", { name: "Staff" });
  await expect(team.getByText("Raju")).toBeVisible();
  await expect(team.getByText("Rakesh")).toBeVisible();
  await expect(page.getByText(/· [2-9] log$/)).toBeVisible();
});

test("a used invite link cannot be replayed", async ({ page }) => {
  await signInAs(page, "owner");
  await clearPendingInvites(page);

  await page.getByRole("button", { name: "Staff bulao" }).click();
  await page.getByLabel("Naam").fill("Amit");
  await page.getByLabel("Phone number").fill("9811111111");
  await page.getByRole("button", { name: "Link banao" }).click();
  const link = await page.getByText(/\/join\/[0-9a-f]{32}/).innerText();
  const path = new URL(link.trim()).pathname;

  // The owner is already in the org; accepting their own invite is refused
  // rather than silently changing their role.
  await page.goto(path);
  await page.getByRole("button", { name: "Jud jao" }).click();
  await expect(page).toHaveURL(/\/aaj$/);

  // A second person cannot use the same link.
  await signOut(page);
  await signInAs(page, "staff");
  await page.goto(path);
  await expect(page.getByText(/pehle istemaal ho chuka|already been used/)).toBeVisible();
});

test("an unknown invite token says what to do next", async ({ page }) => {
  await signInAs(page, "owner");
  await page.goto(`/join/${"0".repeat(32)}`);

  // No locale cookie was set by the test sign-in, so the language had to be
  // resolved from the account — profile first, then the business. Which
  // language that lands on depends on what the owner has chosen, so the
  // assertion reads the page's own language rather than assuming one.
  const t = await pageDictionary(page);
  await expect(page.getByText(t.org.joinNotFound)).toBeVisible();
  await expect(page.getByRole("link", { name: t.time.aaj })).toBeVisible();
});
