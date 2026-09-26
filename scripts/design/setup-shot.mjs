import { chromium } from "@playwright/test";
const out = process.argv[2];
const b = await chromium.launch();
for (const [w, h, mobile] of [[1440, 900, false], [390, 844, true]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 2 : 1 });
  await ctx.addCookies([{ name: "waakya_lang", value: "en", url: "http://localhost:3200" }]);
  const p = await ctx.newPage();
  const r = await p.request.post("http://localhost:3200/api/test-login", { data: { email: "noorg@waakya.test", password: "waakya-e2e-noorg-pass" } });
  console.log("login", r.status());
  await p.goto("http://localhost:3200/setup", { waitUntil: "networkidle" });
  console.log(p.url());
  await p.screenshot({ path: `${out}/setup-${w}.jpg`, fullPage: true, quality: 60 });
  await ctx.close();
}
await b.close();
