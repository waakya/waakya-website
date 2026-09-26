/**
 * Responsive × language sweep of Design V3 on the LOCAL design stack:
 * people in English, Hinglish and Hindi (and the long-named employee, and
 * the busy owner) × key routes × 390/430/768/820/1440. Records sideways
 * overflow (against the real device width), console errors and failed
 * requests; screenshots go to $SHOTS (default: a temp dir, not the repo).
 *
 *   DESIGN_BASE=http://localhost:3300 node scripts/design/sweep.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const B = process.env.DESIGN_BASE ?? "http://localhost:3300";
if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(B)) throw new Error("Local only.");
const SHOTS = process.env.SHOTS ?? join(tmpdir(), "waakya-v3-sweep");
mkdirSync(SHOTS, { recursive: true });

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const org = (await db.from("orgs").select("id").eq("name", "Sharma Interiors").single()).data.id;
const one = async (t, c, v) => (await db.from(t).select("id").eq("org_id", org).like(c, v).limit(1)).data[0].id;
const site = await one("conversations", "title", "Site team");
const fresh = await one("tasks", "title", "Measure the wardrobe%");
const longTask = await one("tasks", "title", "Coordinate with the building%");
const villa = await one("projects", "name", "Sector 76 Villa");

const PEOPLE = [
  { who: "owner-en", email: "priya@sharma.test", lang: "en", routes: ["/aaj", "/baat", `/baat/${site}`, "/work", `/kaam/${longTask}`, "/more", "/hazri", "/approvals", `/projects/${villa}`, "/khabar", "/search?q=kapoor", "/settings"] },
  { who: "staff-hinglish", email: "rahul@sharma.test", lang: "hi-Latn", routes: ["/aaj", `/baat/${site}`, `/kaam/${fresh}`, "/more", "/hazri"] },
  { who: "staff-hindi", email: "sunita@sharma.test", lang: "hi", routes: ["/aaj", "/baat", "/more", "/hazri"] },
  { who: "staff-longname", email: "imran@sharma.test", lang: "hi-Latn", routes: ["/aaj", "/more", "/settings"] },
  { who: "busy-owner-hindi", email: "owner@busy.test", lang: "hi", routes: ["/aaj", "/work", "/work?need=late"] },
];
const WIDTHS = [390, 430, 768, 820, 1440];
const HEIGHT = { 390: 844, 430: 932, 768: 1024, 820: 1180, 1440: 900 };

const results = [];
const browser = await chromium.launch();
for (const person of PEOPLE) {
  for (const w of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: HEIGHT[w] }, isMobile: w < 500, hasTouch: w < 900 });
    await ctx.addCookies([{ name: "waakya_lang", value: person.lang, url: B }]);
    const page = await ctx.newPage();
    const errors = [];
    const failed = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 160)));
    page.on("requestfailed", (r) => !r.url().includes("_next/webpack-hmr") && failed.push(`${r.failure()?.errorText} ${r.url().slice(0, 100)}`));
    page.on("response", (r) => r.status() >= 400 && !r.url().includes("favicon") && failed.push(`${r.status()} ${r.url().slice(0, 100)}`));
    const login = await page.request.post(`${B}/api/test-login`, { data: { email: person.email, password: "waakya-design-pass" } });
    if (!login.ok()) throw new Error(`sign-in ${person.email}: ${login.status()}`);
    for (const route of person.routes) {
      errors.length = 0;
      failed.length = 0;
      await page.goto(B + route, { waitUntil: "networkidle" });
      const overflow = await page.evaluate((vw) => {
        let max = 0;
        for (const el of document.querySelectorAll("body *")) {
          const r = el.getBoundingClientRect();
          if (r.width && r.height) max = Math.max(max, r.right);
        }
        return Math.round(max - vw);
      }, w);
      const name = `${person.who}-${w}-${route.replace(/[^a-z0-9]+/gi, "_").slice(0, 40)}`;
      await page.screenshot({ path: join(SHOTS, `${name}.jpg`), quality: 60 });
      results.push({ who: person.who, lang: person.lang, w, route: route.replace(/[0-9a-f-]{36}/, ":id"), overflow, consoleErrors: [...errors], failedRequests: [...failed] });
    }
    await ctx.close();
  }
}
await browser.close();
writeFileSync("docs/design-v3/sweep.json", JSON.stringify(results, null, 1));
const bad = results.filter((r) => r.overflow > 1 || r.consoleErrors.length || r.failedRequests.length);
console.log(`${results.length} screens · ${bad.length} with a problem · shots in ${SHOTS}`);
for (const r of bad) console.log(JSON.stringify(r));
