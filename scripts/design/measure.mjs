/**
 * Runs scripts/design/complexity.js for owner, manager, employee and a
 * first-day owner at 1440 and 390 on the LOCAL design stack:
 *
 *   BASE=http://localhost:3300 OUT=docs/design-v3/v3-complexity.json node scripts/design/measure.mjs
 *
 * The same runner measured V2 (BASE=http://localhost:3200), so the two files
 * compare like for like. Development-only sign-in; localhost only.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8").split("\n").map((l) => /^([A-Z0-9_]+)=(.*)$/.exec(l.trim())).filter(Boolean).map((m) => [m[1], m[2]]),
);
const BASE = process.env.BASE ?? "http://localhost:3300";
const OUT = process.env.OUT ?? "docs/design-v3/v3-complexity.json";
if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(BASE) || !/^http:\/\/(127\.0\.0\.1|localhost):/.test(env.NEXT_PUBLIC_SUPABASE_URL)) {
  throw new Error("Local only.");
}
const fn = readFileSync(new URL("./complexity.js", import.meta.url), "utf8").replace(/^\/\/.*$/gm, "");
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const org = (await db.from("orgs").select("id").eq("name", "Sharma Interiors").single()).data.id;
const one = async (t, c, v) => (await db.from(t).select("id").eq("org_id", org).like(c, v).limit(1)).data[0].id;
const ids = {
  site: await one("conversations", "title", "Site team"),
  done: await one("tasks", "title", "Photograph the chipped%"),
  fresh: await one("tasks", "title", "Call Kapoor ji%"),
  villa: await one("projects", "name", "Sector 76 Villa"),
};
const ROUTES = ["/aaj", "/baat", `/baat/${ids.site}`, "/work", `/kaam/${ids.done}`, `/kaam/${ids.fresh}`, "/projects", `/projects/${ids.villa}`, "/documents", "/documents/templates", "/hazri", "/approvals", "/staff", "/search?q=kapoor", "/khabar", "/settings", "/more"];
const NAME = (r) => r.replace(ids.site, "site").replace(ids.done, "done-task").replace(ids.fresh, "new-task").replace(ids.villa, "villa");
const who = { owner: "priya@sharma.test", manager: "arjun@sharma.test", employee: "rahul@sharma.test", firstday: "anil@mehta.test" };

const out = [];
const browser = await chromium.launch();
for (const [role, email] of Object.entries(who)) {
  for (const w of [1440, 390]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, isMobile: w < 500, hasTouch: w < 500 });
    await ctx.addCookies([{ name: "waakya_lang", value: "en", url: BASE }]);
    const p = await ctx.newPage();
    await p.request.post(`${BASE}/api/test-login`, { data: { email, password: "waakya-design-pass" } });
    for (const r of role === "firstday" ? ["/aaj", "/baat", "/work"] : ROUTES) {
      await p.goto(BASE + r, { waitUntil: "networkidle" }).catch(() => {});
      if (new URL(p.url()).pathname !== r.split("?")[0]) {
        out.push({ role, w, route: NAME(r), redirected: new URL(p.url()).pathname });
        continue;
      }
      out.push({ role, w, route: NAME(r), ...(await p.evaluate(`(${fn})()`)) });
    }
    await ctx.close();
  }
}
await browser.close();
writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log(out.length, "measurements →", OUT);
