import { chromium, devices } from "@playwright/test";
const out = process.argv[2];
const b = await chromium.launch();
const routes = ["/", "/login", "/demo", "/privacy", "/does-not-exist"];
for (const [label, ctxOpts] of [["desktop", { viewport: { width: 1440, height: 900 } }], ["mobile", { ...devices["iPhone 13"], viewport: { width: 390, height: 844 } }]]) {
  const ctx = await b.newContext({ ...ctxOpts, locale: "en-IN" });
  await ctx.addCookies([{ name: "waakya_lang", value: "en", domain: "waakya.com", path: "/" }]);
  const p = await ctx.newPage();
  const errs = [];
  p.on("console", m => m.type() === "error" && errs.push(m.text().slice(0, 150)));
  for (const r of routes) {
    const t0 = Date.now();
    await p.goto("https://waakya.com" + r, { waitUntil: "networkidle" });
    const ms = Date.now() - t0;
    const name = (r === "/" ? "home" : r.slice(1).replace(/\//g, "_"));
    await p.screenshot({ path: `${out}/${label}-${name}.jpg`, fullPage: true, quality: 70 });
    const ov = await p.evaluate(() => Math.max(...[...document.querySelectorAll("body *")].map(e => e.getBoundingClientRect().right)) - document.documentElement.clientWidth);
    console.log(label, r, ms + "ms", "overflow", Math.round(ov));
  }
  console.log(label, "console errors:", errs.length, errs.slice(0, 3));
  await ctx.close();
}
await b.close();
