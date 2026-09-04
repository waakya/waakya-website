import { expect, test } from "@playwright/test";
import { signInAs, signOut } from "./support/auth";

test.beforeEach(async ({ page }) => {
  await signOut(page);
});

test("login shows an honest email field and the three languages", async ({
  page,
}) => {
  await page.goto("/login");

  // Devanagari is the default (the org language default is `hi`).
  await expect(
    page.getByRole("heading", { name: "अपना ईमेल डालें" }),
  ).toBeVisible();
  await expect(page.getByPlaceholder("naam@example.com")).toHaveAttribute(
    "type",
    "email",
  );
  await expect(page.getByText("स्टाफ़ को मालिक का भेजा हुआ लिंक चाहिए")).toBeVisible();

  await page.getByRole("radio", { name: "Hinglish" }).click();
  await expect(
    page.getByRole("heading", { name: "Apna email daalein" }),
  ).toBeVisible();
  await expect(page.getByText("Staff ko owner ka bheja hua link chahiye")).toBeVisible();

  await page.getByRole("radio", { name: "English" }).click();
  await expect(
    page.getByRole("heading", { name: "Enter your email" }),
  ).toBeVisible();
});

// Next.js renders its own role="alert" route announcer, so these assertions
// address the login error by id rather than by role.
test("consent is required before a code is sent", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("radio", { name: "English" }).click();

  await page.getByPlaceholder("name@example.com").fill("someone@example.com");
  await page.getByRole("button", { name: "Send code" }).click();

  await expect(page.locator("#login-error")).toHaveText(
    "Tick the Privacy Policy to continue.",
  );
  // Still on step one: no code was sent.
  await expect(page.getByRole("button", { name: "Send code" })).toBeVisible();
});

test("a bad email is refused with a next step, not an internal error", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByRole("radio", { name: "English" }).click();

  await page.getByPlaceholder("name@example.com").fill("not-an-email");
  await page.getByRole("checkbox").click();
  await page.getByRole("button", { name: "Send code" }).click();

  await expect(page.locator("#login-error")).toHaveText(
    "That email does not look right. Please write it again.",
  );
});

test("signed-out visitors cannot reach the app", async ({ page }) => {
  await page.goto("/aaj");
  await expect(page).toHaveURL(/\/login$/);
});

test("a signed-in user with no business lands on setup", async ({ page }) => {
  await signInAs(page, "noorg");
  await page.goto("/aaj");
  await expect(page).toHaveURL(/\/setup$/);
});

test("the dev-only test-login refuses a wrong password", async ({ page }) => {
  const response = await page.request.post("/api/test-login", {
    data: { email: "owner@vaakya.test", password: "definitely-wrong" },
  });
  expect(response.status()).toBe(401);
});
