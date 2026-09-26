/**
 * Design QA capture for the LOCAL design stack.
 *
 *   node scripts/design/capture.mjs <outDir> [personas] [widths] [routeFilter]
 *
 *   personas   comma list of priya,arjun,rahul,imran,anil,visitor  (default: all)
 *   widths     comma list of 1440,820,390                          (default: all)
 *   routeFilter substring; only routes containing it are captured
 *
 * For every persona × width × route it saves a full-page JPEG and records the
 * load time, horizontal overflow (measured against the real device width, the
 * way e2e/support/overflow.ts does), console errors and failed requests into
 * <outDir>/index.json. It signs in through /api/test-login, which exists only
 * in development, and it refuses to run against anything but localhost.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const SB = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(SB)) throw new Error("Local stack only.");
const BASE = process.env.DESIGN_BASE ?? "http://localhost:3200";
if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(BASE)) throw new Error("Local app only.");

const [out = "docs/design-v2/local", personaArg, widthArg, filter] = process.argv.slice(2);
const PASSWORD = "waakya-design-pass";
const PERSONAS = {
  priya: "priya@sharma.test",
  arjun: "arjun@sharma.test",
  rahul: "rahul@sharma.test",
  imran: "imran@sharma.test",
  anil: "anil@mehta.test",
  visitor: null,
};
const personas = (personaArg ?? Object.keys(PERSONAS).join(",")).split(",");
const widths = (widthArg ?? "1440,820,390").split(",").map(Number);

const admin = createClient(SB, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const one = async (q) => (await q).data?.[0]?.id;
const org = await one(admin.from("orgs").select("id").eq("name", "Sharma Interiors"));
const ids = {
  site: await one(admin.from("conversations").select("id").eq("org_id", org).eq("title", "Site team")),
  villa: await one(admin.from("projects").select("id").eq("org_id", org).eq("name", "Sector 76 Villa")),
  done: await one(admin.from("tasks").select("id").eq("org_id", org).like("title", "Photograph the chipped%")),
  late: await one(admin.from("tasks").select("id").eq("org_id", org).like("title", "Send the revised Kapoor%")),
  fresh: await one(admin.from("tasks").select("id").eq("org_id", org).like("title", "Call Kapoor ji%")),
  verified: await one(admin.from("tasks").select("id").eq("org_id", org).like("title", "Fix the loose hinge%")),
  longTitle: await one(admin.from("tasks").select("id").eq("org_id", org).like("title", "Coordinate with the building%")),
  unseen: await one(admin.from("tasks").select("id").eq("org_id", org).like("title", "Be on site with the keys%")),
  doc: await one(admin.from("documents").select("id").eq("org_id", org).eq("template_key", "quotation")),
};

const APP = [
  "/aaj",
  "/baat",
  `/baat/${ids.site}`,
  "/work",
  `/kaam/${ids.done}`,
  `/kaam/${ids.late}`,
  `/kaam/${ids.fresh}`,
  `/kaam/${ids.verified}`,
  `/kaam/${ids.longTitle}`,
  `/kaam/${ids.unseen}`,
  "/naya",
  "/projects",
  `/projects/${ids.villa}`,
  "/documents",
  "/documents/templates",
  `/documents/${ids.doc}`,
  "/hazri",
  "/approvals",
  "/staff",
  "/search?q=kapoor",
  "/khabar",
  "/settings",
  "/more",
  "/checklists",
];
const PUBLIC = ["/", "/login", "/demo", "/privacy", "/nope-404"];
const NAMES = Object.fromEntries(Object.entries(ids).map(([k, v]) => [v, k]));

mkdirSync(out, { recursive: true });
const index = [];
const browser = await chromium.launch();

for (const persona of personas) {
  for (const width of widths) {
    const mobile = width < 500;
    const ctx = await browser.newContext({
      viewport: { width, height: mobile ? 844 : width < 1000 ? 1180 : 900 },
      deviceScaleFactor: mobile ? 2 : 1,
      isMobile: mobile,
      hasTouch: mobile,
    });
    await ctx.addCookies([{ name: "waakya_lang", value: "en", url: BASE }]);
    const page = await ctx.newPage();
    if (PERSONAS[persona]) {
      const r = await page.request.post(`${BASE}/api/test-login`, {
        data: { email: PERSONAS[persona], password: PASSWORD },
      });
      if (!r.ok()) throw new Error(`sign-in failed for ${persona}: ${r.status()}`);
    }
    const routes = (PERSONAS[persona] ? APP : PUBLIC).filter((r) => !filter || r.includes(filter));
    for (const route of routes) {
      const errors = [];
      const failed = [];
      const onConsole = (m) => m.type() === "error" && errors.push(m.text().slice(0, 200));
      const onFail = (r) => failed.push(`${r.failure()?.errorText} ${r.url().slice(0, 120)}`);
      const onResp = (r) => r.status() >= 500 && failed.push(`${r.status()} ${r.url().slice(0, 120)}`);
      page.on("console", onConsole);
      page.on("requestfailed", onFail);
      page.on("response", onResp);
      const t0 = Date.now();
      let status = 0;
      try {
        const resp = await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 60_000 });
        status = resp?.status() ?? 0;
      } catch (e) {
        errors.push(`navigation: ${e.message.slice(0, 120)}`);
      }
      const ms = Date.now() - t0;
      const overflow = await page
        .evaluate((w) => {
          let max = 0;
          for (const el of document.querySelectorAll("body *")) {
            const s = getComputedStyle(el);
            if (s.position === "fixed" && s.visibility === "hidden") continue;
            const r = el.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) continue;
            // Ignore content inside intentional horizontal scrollers.
            let p = el.parentElement;
            let scrolls = false;
            while (p && p !== document.body) {
              const ps = getComputedStyle(p);
              if (/(auto|scroll|hidden)/.test(ps.overflowX)) { scrolls = true; break; }
              p = p.parentElement;
            }
            if (!scrolls) max = Math.max(max, r.right);
          }
          return Math.round(max - w);
        }, width)
        .catch(() => null);
      const slug = route === "/" ? "home" : route.slice(1).replace(/[/?=]/g, "_").replace(/[0-9a-f-]{36}/, (m) => NAMES[m] ?? "id");
      const file = `${persona}-${width}-${slug}.jpg`;
      await page.screenshot({ path: `${out}/${file}`, fullPage: true, quality: 60 }).catch(() => {});
      page.off("console", onConsole);
      page.off("requestfailed", onFail);
      page.off("response", onResp);
      const finalPath = new URL(page.url()).pathname;
      index.push({ persona, width, route, finalPath, status, ms, overflow, errors, failed, file });
      console.log(
        `${persona.padEnd(7)} ${String(width).padEnd(4)} ${route.padEnd(48).slice(0, 48)} ${String(status).padEnd(3)} ${String(ms).padStart(5)}ms overflow=${overflow}${errors.length ? ` errors=${errors.length}` : ""}${failed.length ? ` failed=${failed.length}` : ""}${finalPath !== route.split("?")[0] ? ` → ${finalPath}` : ""}`,
      );
    }
    await ctx.close();
  }
}
await browser.close();
writeFileSync(`${out}/index.json`, JSON.stringify(index, null, 2));
