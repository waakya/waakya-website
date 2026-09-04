import { expect, test } from "@playwright/test";
import { signInAs, signOut } from "./support/auth";

test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ page }) => {
  await signOut(page);
});

test("the owner sends a task on the Confirm card, and the staff member sees it", async ({
  page,
  browser,
}) => {
  const title = `Sector 62 photos ${Date.now()}`;

  await signInAs(page, "owner");
  await page.goto("/aaj");
  await page.getByRole("link", { name: "Naya kaam" }).click();
  await expect(page.getByRole("heading", { name: "Yeh bhejein?" })).toBeVisible();

  // Nothing can be sent until there is a person and a title.
  await expect(page.getByRole("button", { name: "Bhejo" })).toBeDisabled();

  await page.getByRole("button", { name: /^Kisko/ }).click();
  await page.getByRole("button", { name: "Raju" }).click();

  await page.getByRole("button", { name: /^Kya/ }).click();
  await page.getByRole("textbox", { name: "Kya" }).fill(title);
  await page.getByRole("button", { name: "Save" }).click();

  await page.getByRole("button", { name: "Urgent" }).click();
  await page.getByRole("button", { name: "Bhejo" }).click();

  await expect(page).toHaveURL(/\/aaj$/);
  await expect(page.getByText(title)).toBeVisible();

  // The owner's row states the state in words, not by colour alone.
  const row = page.locator("li", { hasText: title }).first();
  await expect(row.getByText(/Bheja/)).toBeVisible();
  await expect(row.getByText(/Urgent/)).toBeVisible();

  // The staff member sees it under Naya, with the sent glyph.
  const staffContext = await browser.newContext();
  const staffPage = await staffContext.newPage();
  await staffPage.request.post("/api/test-login", {
    data: { email: "staff@vaakya.test", password: "vaakya-e2e-staff-pass" },
  });
  await staffPage.goto("/aaj");
  await expect(staffPage.getByText(title)).toBeVisible();
  const staffRow = staffPage.locator("li", { hasText: title }).first();
  await expect(staffRow.getByRole("img", { name: "Bheja" })).toBeVisible();
  await staffContext.close();
});

test("the task is delivered, not merely created, and the audit trail says so", async ({
  page,
}) => {
  const title = `Godown stock ${Date.now()}`;

  await signInAs(page, "owner");
  await page.goto("/naya");
  await page.getByRole("button", { name: /^Kisko/ }).click();
  await page.getByRole("button", { name: "Raju" }).click();
  await page.getByRole("button", { name: /^Kya/ }).click();
  await page.getByRole("textbox", { name: "Kya" }).fill(title);
  await page.getByRole("button", { name: "Save" }).click();
  await page.getByRole("button", { name: "Bhejo" }).click();
  await expect(page).toHaveURL(/\/aaj$/);

  // Open it: the detail screen agrees with the list, and the audit trail says
  // the task was delivered, not merely created.
  await page.getByText(title).click();
  await expect(page).toHaveURL(/\/kaam\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(page.getByText("Raju", { exact: true }).first()).toBeVisible();

  const timeline = page.getByRole("list", { name: "Timeline" });
  await expect(timeline).toContainText("Bheja");
  await expect(timeline).toContainText("Rakesh");
  // The stepper is on the first step, with the two clocks running beneath it.
  await expect(page.getByRole("progressbar", { name: /Dekhna/ })).toBeVisible();
  await expect(
    page.getByRole("progressbar", { name: "Khatam karna" }),
  ).toBeVisible();
});

test("a staff member cannot open the create screen", async ({ page }) => {
  await signInAs(page, "staff");
  await page.goto("/naya");
  // Only an owner or manager sends work.
  await expect(page).toHaveURL(/\/aaj$/);
});

test("the staff screen has one big button's worth of chrome, not four tabs", async ({
  page,
}) => {
  await signInAs(page, "staff");
  await page.goto("/aaj");
  await expect(page.getByRole("link", { name: "Staff", exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Naya kaam" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Aaj" })).toBeVisible();
});
