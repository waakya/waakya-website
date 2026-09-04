import { chromium, devices } from '@playwright/test';
const [url, email, password] = process.argv.slice(2);
const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices['Pixel 7'] });
const page = await ctx.newPage();
await page.request.post(new URL(url).origin + '/api/test-login', { data: { email, password } });
await page.goto(url, { waitUntil: 'networkidle' });
const info = await page.evaluate(() => {
  const footer = document.querySelector('footer');
  const out = [];
  let el = footer;
  while (el && el !== document.documentElement) {
    const cs = getComputedStyle(el);
    out.push({
      tag: el.tagName + (el.className ? '.' + String(el.className).slice(0, 60) : ''),
      position: cs.position,
      overflow: cs.overflow,
      overflowY: cs.overflowY,
      height: cs.height,
      minHeight: cs.minHeight,
      display: cs.display,
      zIndex: cs.zIndex,
    });
    el = el.parentElement;
  }
  const html = getComputedStyle(document.documentElement);
  out.push({ tag: 'HTML', position: html.position, overflow: html.overflow, overflowY: html.overflowY, height: html.height, minHeight: html.minHeight, display: html.display, zIndex: html.zIndex });
  return { chain: out, scrollHeight: document.documentElement.scrollHeight, clientHeight: document.documentElement.clientHeight, bodyScroll: document.body.scrollHeight };
});
console.log(JSON.stringify(info, null, 1));
await browser.close();
