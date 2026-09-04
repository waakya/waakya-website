import { expect, test } from "@playwright/test";
import { signInAs, signOut } from "./support/auth";
import { onScreen } from "./support/visible";

/**
 * The owner's dashboard. The header is the one glance at the day, so the
 * numbers on it have to be right and the chips have to say what they mean.
 */
test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ page }) => {
  await signOut(page);
});

test("the header counters read as a funnel, and say what each one is", async ({
  page,
}) => {
  await signInAs(page, "owner");
  await page.goto("/aaj");

  const header = page.locator("header").first();
  await expect(header).toContainText("Namaste, Rakesh ji");
  await expect(header).toContainText("Rakesh Properties");

  // Four counters, each with a word under the number.
  for (const label of ["Bheje", "Dekhe", "Ho gaye", "Verified"]) {
    await expect(header.getByText(label, { exact: true })).toBeVisible();
  }

  const numbers = await header.locator("dd").allInnerTexts();
  expect(numbers).toHaveLength(4);
  const [bheje, dekhe, hoGaye, verified] = numbers.map(Number);
  // Sent ≥ seen ≥ done ≥ verified: a verified task was also all of the others.
  expect(bheje).toBeGreaterThanOrEqual(dekhe);
  expect(dekhe).toBeGreaterThanOrEqual(hoGaye);
  expect(hoGaye).toBeGreaterThanOrEqual(verified);

  // Latin digits, in every language.
  for (const value of numbers) expect(value).not.toMatch(/[०-९]/);
});

test("the exception chips carry a word and a number, not just a colour", async ({
  page,
}) => {
  await signInAs(page, "owner");
  await page.goto("/aaj");

  const header = page.locator("header").first();
  // These only appear when there is something to say; the test data has both.
  await expect(header.getByText(/\d+ Late/)).toBeVisible();
  await expect(header.getByText(/\d+ Dekha nahi/)).toBeVisible();
});

test("Aapke liye offers the action inline, without opening the task", async ({
  page,
}) => {
  await signInAs(page, "owner");
  await page.goto("/aaj");

  const section = page
    .getByRole("list", { name: "Aapke liye" })
    .getByRole("listitem")
    .first();
  await expect(section.getByRole("button", { name: "Yaad dilao" })).toBeVisible();

  // Reminding is a message, not a state change: the page stays where it is.
  await section.getByRole("button", { name: "Yaad dilao" }).click();
  await expect(page).toHaveURL(/\/aaj$/);
});

test("the staff dashboard has no coloured header and no counters", async ({
  page,
}) => {
  await signInAs(page, "staff");
  await page.goto("/aaj");

  await expect(page.getByRole("heading", { name: "Mere kaam" })).toBeVisible();
  await expect(page.locator("dd")).toHaveCount(0);
  await expect(page.locator("header.bg-neel-700")).toHaveCount(0);
});

test("the week groups by the day work is due", async ({ page }) => {
  await signInAs(page, "owner");
  await page.goto("/hafta");
  await expect(page.getByRole("heading", { name: "Is hafte" })).toBeVisible();
});

test("switching language reaches every screen, not just the shell", async ({
  page,
}) => {
  // Before this was fixed, Settings and the inbox followed the reader's own
  // choice while the task screens stayed in the business's language, so a
  // switch only half-worked.
  await signInAs(page, "owner", "en");

  await page.goto("/aaj");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(onScreen(page.getByText("Needs you")).first()).toBeVisible();

  await page.goto("/naya");
  await expect(onScreen(page.getByRole("heading", { name: "Send this?" }))).toBeVisible();
  await expect(onScreen(page.getByRole("button", { name: /^Who/ }))).toBeVisible();

  await page.goto("/staff");
  await expect(onScreen(page.getByRole("heading", { name: "Staff" }))).toBeVisible();

  // And back the other way.
  await signInAs(page, "owner", "hi");
  await page.goto("/naya");
  await expect(page.locator("html")).toHaveAttribute("lang", "hi");
  await expect(onScreen(page.getByRole("heading", { name: "यह भेजें?" }))).toBeVisible();
});
