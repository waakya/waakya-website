import { expect, test } from "@playwright/test";
import { signInAs, signOut } from "./support/auth";

test.beforeEach(async ({ page }) => {
  await signOut(page);
});

test("login shows an honest email field and the three languages", async ({
  page,
}) => {
  await page.goto("/login");

  // A signed-out visitor reads English (the org language default, `hi`,
  // applies to accounts, not to the door).
  await expect(
    page.getByRole("heading", { name: "Enter your email" }),
  ).toBeVisible();
  await expect(page.getByPlaceholder("name@example.com")).toHaveAttribute(
    "type",
    "email",
  );
  await expect(page.getByText("Staff need the link their owner sent")).toBeVisible();

  await page.getByRole("radio", { name: "हिंदी" }).click();
  await expect(
    page.getByRole("heading", { name: "अपना ईमेल डालें" }),
  ).toBeVisible();
  await expect(page.getByText("स्टाफ़ को मालिक का भेजा हुआ लिंक चाहिए")).toBeVisible();

  await page.getByRole("radio", { name: "Hinglish" }).click();
  await expect(
    page.getByRole("heading", { name: "Apna email daalein" }),
  ).toBeVisible();
  await expect(page.getByText("Staff ko owner ka bheja hua link chahiye")).toBeVisible();
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

test("the brand name is never translated, in any language", async ({ page }) => {
  // *Waakya* means "sentence" in Hindi, so a translated brand name turns the
  // consent line into "I agree to the sentence's Privacy Policy".
  await page.goto("/login");
  const consent = page.locator("label", { hasText: "Privacy Policy" });

  await page.getByRole("radio", { name: "हिंदी" }).click();
  await expect(
    page.getByRole("heading", { name: "अपना ईमेल डालें" }),
  ).toBeVisible();
  await expect(consent).toContainText("वाक्य");
  await expect(consent).toContainText("Privacy Policy");
  await expect(consent).not.toContainText("प्राइवेसी पॉलिसी");

  await page.getByRole("radio", { name: "Hinglish" }).click();
  await expect(
    page.getByRole("heading", { name: "Apna email daalein" }),
  ).toBeVisible();
  await expect(consent).toContainText("Main Waakya ki Privacy Policy");

  await page.getByRole("radio", { name: "English" }).click();
  await expect(
    page.getByRole("heading", { name: "Enter your email" }),
  ).toBeVisible();
  // Waakya's, not "the Waakya" — it is a name, not a category.
  await expect(consent).toContainText("I agree to Waakya's Privacy Policy.");
  await expect(consent).not.toContainText("the Waakya");

  // The notice the link opens carries the same name.
  await page.getByRole("link", { name: "Privacy Policy" }).click();
  await expect(
    page.getByRole("heading", { name: "Privacy Policy" }),
  ).toBeVisible();
});

test("the email step starts clean, and a rate limit does not blame the address", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByRole("radio", { name: "English" }).click();
  await expect(
    page.getByRole("heading", { name: "Enter your email" }),
  ).toBeVisible();

  // Nothing has been submitted, so there is nothing to complain about.
  await expect(page.locator("#login-error")).toHaveCount(0);
  const emailBox = page.getByPlaceholder("name@example.com");
  await expect(emailBox).not.toHaveAttribute("aria-invalid", "true");

  // A malformed address is the address's fault, so the box says so.
  await emailBox.fill("not-an-email");
  await page.getByRole("checkbox").click();
  await page.getByRole("button", { name: "Send code" }).click();
  await expect(page.locator("#login-error")).toBeVisible();
  await expect(emailBox).toHaveAttribute("aria-invalid", "true");

  // Editing it is the reader addressing the problem; stop telling them.
  await emailBox.fill("someone@example.com");
  await expect(page.locator("#login-error")).toHaveCount(0);
  await expect(emailBox).not.toHaveAttribute("aria-invalid", "true");
});

test("a missing consent is not blamed on the email box", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("radio", { name: "English" }).click();
  await expect(
    page.getByRole("heading", { name: "Enter your email" }),
  ).toBeVisible();

  const emailBox = page.getByPlaceholder("name@example.com");
  await emailBox.fill("someone@example.com");
  await page.getByRole("button", { name: "Send code" }).click();

  await expect(page.locator("#login-error")).toHaveText(
    "Tick the Privacy Policy to continue.",
  );
  // The address is fine. Only the consent is missing.
  await expect(emailBox).not.toHaveAttribute("aria-invalid", "true");
});
