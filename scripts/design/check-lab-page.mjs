/**
 * Checks one Design Lab page on the LOCAL design stack: seven widths, sideways
 * overflow against the real device width, console errors, axe violations,
 * tap-target sizes on a coarse pointer, keyboard focus visibility, and that
 * reduced motion really stops everything.
 *
 *   LAB_ROUTE=/design-lab/v34 DESIGN_BASE=http://localhost:3300 \
 *     node scripts/design/check-lab-page.mjs <outDir>
 *
 * Screenshots and report.json land in <outDir>; nothing is written to the repo.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const B = process.env.DESIGN_BASE ?? "http://localhost:3300";
if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(B)) throw new Error("Local only.");
const URL_ = `${B}${process.env.LAB_ROUTE ?? "/design-lab/v34"}`;
const OUT = process.argv[2] ?? "/tmp/lab-check";
mkdirSync(OUT, { recursive: true });

const WIDTHS = [1440, 1280, 1024, 820, 768, 430, 390];
const HEIGHT = { 1440: 900, 1280: 860, 1024: 820, 820: 1180, 768: 1024, 430: 932, 390: 844 };

const browser = await chromium.launch();
const report = [];

for (const w of WIDTHS) {
  const coarse = w <= 430;
  const ctx = await browser.newContext({
    viewport: { width: w, height: HEIGHT[w] },
    deviceScaleFactor: 1,
    hasTouch: coarse,
    isMobile: coarse,
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 200)); });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message.slice(0, 200)}`));
  const failed = [];
  page.on("requestfailed", (r) => failed.push(`${r.url().slice(0, 120)} ${r.failure()?.errorText}`));

  await page.goto(URL_, { waitUntil: "load", timeout: 120000 });
  await page.waitForTimeout(2500);
  // let every on-screen story actually play a few beats
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 3));
  await page.waitForTimeout(2500);
  await page.evaluate(() => window.scrollTo(0, (document.body.scrollHeight * 2) / 3));
  await page.waitForTimeout(2500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(800);

  const overflow = await page.evaluate((vw) => {
    const doc = document.documentElement;
    const worst = [];
    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect();
      if (r.width === 0) continue;
      const right = r.right + window.scrollX;
      if (right > vw + 1) worst.push({ tag: el.tagName.toLowerCase(), cls: (el.className || "").toString().slice(0, 70), right: Math.round(right) });
    }
    return { scrollW: doc.scrollWidth, clientW: doc.clientWidth, worst: worst.slice(0, 6) };
  }, w);

  // tap targets: everything clickable, measured the way WCAG 2.5.8 does
  const small = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll("button, a, [role=button], .w32-act, .w32-word, .w32-module, .w32-primary, .w32-beat-dot, .w32-swatch")) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const floor = window.matchMedia("(pointer: coarse)").matches ? 44 : 24;
      if (r.height < floor - 0.5 || r.width < floor - 0.5) {
        out.push({ text: (el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 40), h: +r.height.toFixed(1), w: +r.width.toFixed(1), floor, cls: (el.className || "").toString().slice(0, 50) });
      }
    }
    return out;
  });

  const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();

  await page.screenshot({ path: `${OUT}/v34-${w}.jpg`, fullPage: true, quality: 72, type: "jpeg" });

  report.push({
    width: w,
    coarse,
    consoleErrors: errors,
    failedRequests: failed,
    overflow,
    smallTargets: small,
    axe: axe.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, sample: v.nodes[0]?.html.slice(0, 140), summary: v.nodes[0]?.failureSummary?.split("\n").slice(0, 3).join(" | ") })),
  });
  await ctx.close();
}

/* ------------------------------------------------- keyboard + reduced motion */
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto(URL_, { waitUntil: "load" });
await page.waitForTimeout(1500);
const focus = [];
for (let i = 0; i < 26; i++) {
  await page.keyboard.press("Tab");
  const f = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return null;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      what: (el.textContent || el.getAttribute("aria-label") || el.tagName).trim().slice(0, 44),
      outline: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`,
      visible: r.width > 0 && r.height > 0,
    };
  });
  if (f) focus.push(f);
}
const noRing = focus.filter((f) => f.outline.startsWith("none") || f.outline.includes("0px"));
await ctx.close();

const rm = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
const rmp = await rm.newPage();
await rmp.goto(URL_, { waitUntil: "load" });
await rmp.waitForTimeout(1500);
const motion = await rmp.evaluate(() => {
  let animated = 0, transitioned = 0;
  const bad = [];
  for (const el of document.querySelectorAll(".w32 *")) {
    const cs = getComputedStyle(el);
    const ad = parseFloat(cs.animationDuration) || 0;
    const td = parseFloat(cs.transitionDuration) || 0;
    if (ad > 0.01) { animated++; if (bad.length < 4) bad.push({ cls: (el.className || "").toString().slice(0, 50), ad: cs.animationDuration }); }
    if (td > 0.01) { transitioned++; if (bad.length < 8) bad.push({ cls: (el.className || "").toString().slice(0, 50), td: cs.transitionDuration }); }
  }
  return { animated, transitioned, bad };
});
await rmp.screenshot({ path: `${OUT}/v34-reduced-motion.jpg`, fullPage: false, quality: 72, type: "jpeg" });
await rm.close();
await browser.close();

const summary = { url: URL_, widths: report, keyboard: { stops: focus.length, withoutRing: noRing }, reducedMotion: motion };
writeFileSync(`${OUT}/report.json`, JSON.stringify(summary, null, 2));

console.log("URL:", URL_);
for (const r of report) {
  console.log(
    `${r.width}px${r.coarse ? " (touch)" : ""}: overflow ${r.overflow.scrollW}/${r.overflow.clientW}` +
      ` · axe ${r.axe.length} · console ${r.consoleErrors.length} · failed ${r.failedRequests.length} · small targets ${r.smallTargets.length}`,
  );
  for (const v of r.axe) console.log(`   axe ${v.id} (${v.impact}) ×${v.nodes} :: ${v.sample}`);
  for (const s of r.smallTargets) console.log(`   target ${s.h}×${s.w} < ${s.floor} :: "${s.text}" ${s.cls}`);
  for (const o of r.overflow.worst) console.log(`   overflow ${o.tag}.${o.cls} right=${o.right}`);
  for (const e of r.consoleErrors) console.log(`   console: ${e}`);
  for (const f of r.failedRequests) console.log(`   failed: ${f}`);
}
console.log(`keyboard: ${focus.length} stops, ${noRing.length} without a visible ring`);
for (const f of noRing) console.log(`   no ring: "${f.what}" ${f.outline}`);
console.log(`reduced motion: ${motion.animated} animating, ${motion.transitioned} transitioning`);
for (const b of motion.bad) console.log("   ", JSON.stringify(b));
