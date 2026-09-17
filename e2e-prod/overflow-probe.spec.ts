import { expect, test } from "@playwright/test";
import { horizontalOverflow } from "../e2e/support/overflow";

const DIR = process.env.AUDIT_DIR!;
for (const persona of ["owner", "member"] as const) {
  test(`${persona} project page fits 390px`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, storageState: `${DIR}/${persona}.state.json` });
    const page = await ctx.newPage();
    await page.goto("https://waakya.com/projects");
    const href = await page.locator('a[href^="/projects/"]').first().getAttribute("href");
    await page.goto(`https://waakya.com${href}`, { waitUntil: "networkidle" });
    const overflow = await horizontalOverflow(page);
    console.log(persona, "overflow", overflow, "innerWidth", await page.evaluate(() => window.innerWidth));
    expect(overflow, "project page scrolls sideways").toBeLessThanOrEqual(1);
    await ctx.close();
  });
}
