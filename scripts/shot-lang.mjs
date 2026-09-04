import { chromium, devices } from '@playwright/test';
const [url, out, lang] = process.argv.slice(2);
const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices['Pixel 7'], deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'networkidle' });
if (lang) {
  await page.getByRole('radio', { name: lang }).click();
  await page.waitForTimeout(900);
}
await page.screenshot({ path: out });
await browser.close();
