/**
 * Page weight: bytes of JS, CSS and fonts a route actually loads, and its load
 * time. node scripts/design/weigh.mjs <base> <route...>
 */
import { chromium } from "@playwright/test";
const [base, ...routes] = process.argv.slice(2);
const b = await chromium.launch();
for (const route of routes) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const page = await ctx.newPage();
  const bytes = { js: 0, css: 0, font: 0, img: 0, other: 0 };
  page.on("response", async (r) => {
    const type = r.request().resourceType();
    const len = Number((await r.allHeaders())["content-length"] ?? 0) || (await r.body().catch(() => Buffer.alloc(0))).length;
    const k = type === "script" ? "js" : type === "stylesheet" ? "css" : type === "font" ? "font" : type === "image" ? "img" : "other";
    bytes[k] += len;
  });
  const t0 = Date.now();
  await page.goto(base + route, { waitUntil: "networkidle" });
  const lcp = await page.evaluate(() => new Promise((res) => { new PerformanceObserver((l) => { const e = l.getEntries(); res(Math.round(e[e.length - 1].startTime)); }).observe({ type: "largest-contentful-paint", buffered: true }); setTimeout(() => res(null), 1500); }));
  const cls = await page.evaluate(() => new Promise((res) => { let v = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) v += e.value; }).observe({ type: "layout-shift", buffered: true }); setTimeout(() => res(Math.round(v * 1000) / 1000), 1200); }));
  console.log(`${base}${route}  load=${Date.now() - t0}ms lcp=${lcp}ms cls=${cls}  js=${(bytes.js / 1024).toFixed(0)}KB css=${(bytes.css / 1024).toFixed(0)}KB font=${(bytes.font / 1024).toFixed(0)}KB`);
  await ctx.close();
}
await b.close();
