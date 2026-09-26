import { chromium } from "@playwright/test";
const base = process.env.BASE ?? "http://127.0.0.1:3400";
const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
const r = await page.request.post(`${base}/api/test-login`, { data: { email: "owner@waakya.test", password: "waakya-e2e-owner-pass" } });
console.log("login", r.status());
for (const path of process.argv.slice(2)) {
  const res = await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
  console.log(path, "->", res?.status(), page.url());
  console.log((await page.locator("main").first().innerText().catch(() => "")).slice(0, 400).replace(/\n+/g, " | "));
}
await browser.close();
