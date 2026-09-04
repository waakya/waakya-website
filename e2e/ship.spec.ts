import { expect, test } from "@playwright/test";
import { signInAs, signOut } from "./support/auth";

/**
 * The things that have to be true on the day this goes live.
 */
test("the privacy notice is readable before anyone has an account", async ({
  page,
}) => {
  await signOut(page);
  // A signed-out visitor gets Devanagari, which is the app default.
  await page.goto("/privacy");
  await expect(
    page.getByRole("heading", { name: "प्राइवेसी पॉलिसी" }),
  ).toBeVisible();

  // And it follows the language switch on the login screen.
  await page.goto("/login");
  await page.getByRole("radio", { name: "English" }).click();
  // Wait for the choice to land before navigating, or the next request races
  // the Set-Cookie that carries it.
  await expect(
    page.getByRole("heading", { name: "Enter your email" }),
  ).toBeVisible();
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { name: "Privacy Policy" })).toBeVisible();
  // The DPDP rights have to actually be listed, not merely alluded to.
  await expect(page.getByText("DPDP Act, 2023")).toBeVisible();
  await expect(page.getByText(/privacy@waakya\.com/)).toBeVisible();
});

test("the consent line on login reaches it", async ({ page }) => {
  await signOut(page);
  await page.goto("/login");
  await page.getByRole("radio", { name: "English" }).click();
  await expect(
    page.getByRole("heading", { name: "Enter your email" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Privacy Policy" }).click();
  await expect(page).toHaveURL(/\/privacy$/);
});

test("the app is installable: manifest, icons and theme colour", async ({
  page,
  request,
}) => {
  await page.goto("/login");

  const manifestHref = await page
    .locator('link[rel="manifest"]')
    .getAttribute("href");
  expect(manifestHref).toBe("/manifest.webmanifest");

  const manifest = await (await request.get(manifestHref!)).json();
  expect(manifest.name).toBe("Vaakya");
  expect(manifest.display).toBe("standalone");
  expect(manifest.start_url).toBe("/");
  // Neel 600, so the Android status bar matches the owner's header.
  expect(manifest.theme_color).toBe("#3541C4");
  expect(manifest.icons.some((i: { purpose?: string }) => i.purpose === "maskable")).toBe(
    true,
  );

  for (const icon of manifest.icons) {
    expect((await request.get(icon.src)).status(), icon.src).toBe(200);
  }

  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
    "content",
    "#3541C4",
  );
  expect((await request.get("/sw.js")).status()).toBe(200);
  expect((await request.get("/favicon.ico")).status()).toBe(200);
  expect((await request.get("/apple-touch-icon.png")).status()).toBe(200);
});

test("text scales to 130% without the primary action being lost", async ({
  page,
}) => {
  await signOut(page);
  await signInAs(page, "staff");
  await page.goto("/aaj");

  // The OS text-size setting, as far as a page can see it.
  await page.addStyleTag({ content: "html { font-size: 130% }" });
  await page.goto("/aaj");

  const nav = page.getByRole("link", { name: "Aaj" });
  await expect(nav).toBeVisible();
  const box = await nav.boundingBox();
  expect(box).not.toBeNull();
  // Still on screen, not pushed off the bottom.
  expect(box!.y).toBeLessThan(page.viewportSize()!.height);
});

test("every screen a signed-in owner can reach actually renders", async ({
  page,
}) => {
  await signOut(page);
  await signInAs(page, "owner");

  for (const path of [
    "/aaj",
    "/hafta",
    "/staff",
    "/settings",
    "/khabar",
    "/naya",
    "/checklists",
    "/pehle",
    "/preview",
    "/privacy",
  ]) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBeLessThan(400);
    // A rendered error boundary counts as a failure.
    await expect(page.locator("text=Application error"), path).toHaveCount(0);
  }
});
