import { expect, test } from "@playwright/test";

/**
 * The style tile is the contract for the primitives. If the ticks glyph stops
 * naming its state, or a screen stops rendering, this fails before anything
 * downstream does.
 */
test("the style tile renders every ticks state with its state word", async ({
  page,
}) => {
  await page.goto("/preview");

  await expect(page.getByRole("heading", { name: "Style tile" })).toBeVisible();

  // Devanagari is the default language, so the accessible names are Hindi.
  for (const word of ["भेजा", "देख लिया", "हो जाएगा", "हो गया", "वेरिफ़ाई"]) {
    await expect(page.getByRole("img", { name: word }).first()).toBeVisible();
  }

  // Every chip carries a word, never colour alone.
  await expect(page.getByText("देखा नहीं").first()).toBeVisible();
  await expect(page.getByText("अर्जेंट").first()).toBeVisible();
});

test("the staff primary button is 60px and the owner target is 48px", async ({
  page,
}) => {
  await page.goto("/preview");

  const staffPrimary = page.getByRole("button", {
    name: "देख लिया, हो जाएगा",
  });
  await expect(staffPrimary).toBeVisible();
  expect((await staffPrimary.boundingBox())?.height).toBe(60);

  const ownerTarget = page.getByRole("button", { name: "owner 48" });
  expect((await ownerTarget.boundingBox())?.height).toBe(48);
});
