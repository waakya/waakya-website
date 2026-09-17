import { test } from "@playwright/test";
const OUT = process.env.OUT_DIR ?? "/tmp/visual";
test("demo visual", async ({ browser }) => {
  for (const vp of [{ n: "desktop", w: 1440, h: 900 }, { n: "mobile", w: 390, h: 844 }]) {
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.goto("/demo");
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${OUT}/${vp.n}-demo-1.jpg`, type: "jpeg", quality: 60 });
    for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Next section" }).click();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${OUT}/${vp.n}-demo-4.jpg`, type: "jpeg", quality: 60 });
    for (let i = 0; i < 7; i++) await page.getByRole("button", { name: "Next section" }).click();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${OUT}/${vp.n}-demo-11.jpg`, type: "jpeg", quality: 60 });
    await ctx.close();
  }
});
