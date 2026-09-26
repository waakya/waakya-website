/**
 * Captures the Design Lab's "after" screens from the LOCAL design stack, the
 * same way the V2 "before" screens were captured (same people, routes, sizes,
 * JPEG quality, first screen only):
 *
 *   DESIGN_BASE=http://localhost:3300 node scripts/design/lab-shots.mjs [outDir]
 *
 * Signs in through /api/test-login (development only) and refuses anything
 * but localhost.
 */
import { mkdirSync, readFileSync } from "node:fs";
import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const SB = process.env.NEXT_PUBLIC_SUPABASE_URL;
const B = process.env.DESIGN_BASE ?? "http://localhost:3300";
if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(SB) || !/^http:\/\/(127\.0\.0\.1|localhost):/.test(B)) {
  throw new Error("Local stack and app only.");
}
const out = process.argv[2] ?? "docs/design-v3/screens/after";
mkdirSync(out, { recursive: true });

const db = createClient(SB, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const org = (await db.from("orgs").select("id").eq("name", "Sharma Interiors").single()).data.id;
const one = async (t, c, v) => (await db.from(t).select("id").eq("org_id", org).like(c, v).limit(1)).data[0].id;
const site = await one("conversations", "title", "Site team");
const done = await one("tasks", "title", "Photograph the chipped%");
const fresh = await one("tasks", "title", "Measure the wardrobe%");

const OWNER = "priya@sharma.test";
const EMPLOYEE = "rahul@sharma.test";
const shots = [
  [OWNER, 1440, "/aaj", "desktop-owner-today"],
  [OWNER, 1440, `/baat/${site}`, "desktop-conversation"],
  [OWNER, 1440, "/work", "desktop-work"],
  [OWNER, 1440, `/kaam/${done}`, "desktop-task"],
  [EMPLOYEE, 390, "/aaj", "mobile-employee-today"],
  [EMPLOYEE, 390, `/baat/${site}`, "mobile-conversation"],
  [EMPLOYEE, 390, `/kaam/${fresh}`, "mobile-task"],
  [OWNER, 390, "/aaj", "mw-390-owner-today"],
  [OWNER, 430, "/aaj", "mw-430-owner-today"],
  [OWNER, 768, "/aaj", "mw-768-owner-today"],
  [OWNER, 820, "/aaj", "mw-820-owner-today"],
];
const HEIGHT = { 390: 844, 430: 932, 768: 1024, 820: 1180, 1440: 900 };

const browser = await chromium.launch();
for (const [email, w, route, name] of shots) {
  const phone = w < 500;
  const ctx = await browser.newContext({ viewport: { width: w, height: HEIGHT[w] }, deviceScaleFactor: 1, isMobile: phone, hasTouch: w < 900 });
  await ctx.addCookies([{ name: "waakya_lang", value: "en", url: B }]);
  const page = await ctx.newPage();
  const r = await page.request.post(`${B}/api/test-login`, { data: { email, password: "waakya-design-pass" } });
  if (!r.ok()) throw new Error(`sign-in failed for ${email}: ${r.status()}`);
  await page.goto(B + route, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${out}/${name}.jpg`, quality: 70 });
  await ctx.close();
  console.log(name);
}
await browser.close();
