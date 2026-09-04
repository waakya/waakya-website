import { chromium, devices } from '@playwright/test';
const [url, email, password] = process.argv.slice(2);
const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices['Pixel 7'] });
const page = await ctx.newPage();
await page.request.post(new URL(url).origin + '/api/test-login', { data: { email, password } });
await page.goto(url, { waitUntil: 'networkidle' });
const btn = page.getByRole('button', { name: 'Verify karein' });
console.log('visible:', await btn.isVisible(), 'enabled:', await btn.isEnabled());
console.log('box:', JSON.stringify(await btn.boundingBox()));
const vp = page.viewportSize();
console.log('viewport:', JSON.stringify(vp));
try {
  await btn.click({ timeout: 8000 });
  console.log('clicked OK');
} catch (e) {
  console.log('click failed:', String(e).split('\n')[0]);
  // What is actually at the button's centre?
  const box = await btn.boundingBox();
  const el = await page.evaluate(([x, y]) => {
    const e = document.elementFromPoint(x, y);
    return e ? `${e.tagName}.${e.className}`.slice(0, 160) : 'none';
  }, [box.x + box.width / 2, box.y + box.height / 2]);
  console.log('elementFromPoint:', el);
}
await page.waitForTimeout(1500);
console.log('state now:', await page.getByRole('list', { name: 'Timeline' }).innerText().catch(() => '?'));
await browser.close();
