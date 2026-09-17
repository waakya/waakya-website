import { horizontalOverflow } from "../e2e/support/overflow";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { test, type Browser, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

/**
 * Evidence capture for the UX audit: every Phase-1 screen, for a visitor, a
 * brand-new owner, a working owner and a team member, at desktop and 390px.
 * Writes screenshots, accessibility snapshots, console errors, failed
 * requests and load timing. Read-only apart from creating the new-owner user.
 */
test.describe.configure({ mode: "serial" });
test.setTimeout(900_000);

const BASE = "https://waakya.com";
const DIR = process.env.AUDIT_DIR!;
const OUT = process.env.OUT_DIR!;
const LABEL = process.env.LABEL ?? "before";
const VIEWPORTS = [
  { name: "desktop", viewport: { width: 1440, height: 900 }, isMobile: false, hasTouch: false },
  { name: "mobile", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
] as const;

type Row = { persona: string; vp: string; path: string; status: number | null; finalUrl: string; ms: number; overflowX: number; consoleErrors: string[]; failed: string[]; shot: string; snapshot: string };
const rows: Row[] = [];

async function contextFor(browser: Browser, vp: (typeof VIEWPORTS)[number], state?: string) {
  const ctx = await browser.newContext({ viewport: vp.viewport, isMobile: vp.isMobile, hasTouch: vp.hasTouch, deviceScaleFactor: "deviceScaleFactor" in vp ? vp.deviceScaleFactor : 1, ...(state ? { storageState: state } : {}) });
  await ctx.addCookies([{ name: "waakya_lang", value: "en", domain: "waakya.com", path: "/" }]);
  return ctx;
}

async function capture(page: Page, persona: string, vp: string, path: string, slug: string) {
  mkdirSync(`${OUT}/${LABEL}`, { recursive: true });
  const consoleErrors: string[] = [];
  const failed: string[] = [];
  const onConsole = (m: { type(): string; text(): string }) => { if (m.type() === "error") consoleErrors.push(m.text().slice(0, 300)); };
  const onResponse = (r: { status(): number; url(): string }) => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`); };
  page.on("console", onConsole);
  page.on("response", onResponse);
  const started = Date.now();
  const res = await page.goto(BASE + path, { waitUntil: "networkidle" }).catch(() => null);
  const ms = Date.now() - started;
  await page.waitForTimeout(400);
  const base = `${LABEL}/${persona}-${vp}-${slug}`;
  await page.screenshot({ path: `${OUT}/${base}.jpg`, fullPage: true, type: "jpeg", quality: 60, scale: "css" });
  const snap = await page.locator("body").ariaSnapshot().catch(() => "");
  writeFileSync(`${OUT}/${base}.aria.txt`, snap);
  const overflowX = await horizontalOverflow(page);
  page.off("console", onConsole);
  page.off("response", onResponse);
  rows.push({ persona, vp, path, status: res?.status() ?? null, finalUrl: page.url().replace(BASE, ""), ms, overflowX, consoleErrors, failed, shot: `${base}.jpg`, snapshot: `${base}.aria.txt` });
}

async function firstHref(page: Page, prefix: string) {
  const href = await page.locator(`a[href^="${prefix}"]`).first().getAttribute("href").catch(() => null);
  return href;
}

test("visitor journey", async ({ browser }) => {
  for (const vp of VIEWPORTS) {
    const ctx = await contextFor(browser, vp);
    const page = await ctx.newPage();
    for (const [path, slug] of [["/", "landing"], ["/login", "login"], ["/demo", "demo"], ["/privacy", "privacy"], ["/join/00000000000000000000000000000000", "join-invalid"], ["/aaj", "guarded-today"]] as const) {
      await capture(page, "visitor", vp.name, path, slug);
    }
    await ctx.close();
  }
});

test("new owner first run", async ({ browser }) => {
  const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const admin = createClient(URL, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const email = `audit-new-${Date.now().toString(36)}@waakya.test`;
  const password = randomBytes(18).toString("hex");
  await admin.auth.admin.createUser({ email, password, email_confirm: true });
  const jar = new Map<string, string>();
  const sb = createServerClient(URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: (l) => l.forEach(({ name, value }) => jar.set(name, value)) } });
  const { data } = await sb.auth.signInWithPassword({ email, password });
  await sb.from("profiles").upsert({ id: data.user!.id, full_name: "Anil Mehta" }, { onConflict: "id" });
  const cookies = [...jar].map(([name, value]) => ({ name, value, domain: "waakya.com", path: "/", secure: true, sameSite: "Lax" as const }));
  for (const vp of VIEWPORTS) {
    const ctx = await contextFor(browser, vp);
    await ctx.addCookies(cookies);
    const page = await ctx.newPage();
    await capture(page, "newowner", vp.name, "/aaj", "setup");
    if (vp.name === "desktop") {
      await page.getByLabel("Business name").fill("Mehta Facility Services");
      await page.getByRole("button", { name: "Create business" }).click();
      await page.waitForURL(/\/setup\/profile$/, { timeout: 30_000 });
    }
    await capture(page, "newowner", vp.name, "/setup/profile", "profile");
    for (const [path, slug] of [["/staff", "team-empty"], ["/aaj", "today-empty"], ["/baat", "conversations-empty"], ["/work", "work-empty"], ["/projects", "projects-empty"], ["/documents", "documents-empty"], ["/hazri", "attendance-empty"], ["/approvals", "approvals-empty"]] as const) {
      await capture(page, "newowner", vp.name, path, slug);
    }
    await ctx.close();
  }
});

for (const persona of ["owner", "member"] as const) {
  test(`${persona} journey`, async ({ browser }) => {
    for (const vp of VIEWPORTS) {
      const ctx = await contextFor(browser, vp, `${DIR}/${persona}.state.json`);
      const page = await ctx.newPage();
      await capture(page, persona, vp.name, "/aaj", "today");
      await capture(page, persona, vp.name, "/baat", "conversations");
      const conv = await firstHref(page, "/baat/");
      if (conv) await capture(page, persona, vp.name, conv, "conversation-thread");
      await capture(page, persona, vp.name, "/work", "work");
      const task = await firstHref(page, "/kaam/");
      if (task) await capture(page, persona, vp.name, task, "task-detail");
      if (persona === "owner") await capture(page, persona, vp.name, "/naya", "new-task");
      await capture(page, persona, vp.name, "/projects", "projects");
      const project = await firstHref(page, "/projects/");
      if (project) await capture(page, persona, vp.name, project, "project-detail");
      await capture(page, persona, vp.name, "/documents", "documents");
      await capture(page, persona, vp.name, "/documents/templates", "templates");
      await page.getByRole("button", { name: /^Quotation/ }).click().catch(() => {});
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${OUT}/${LABEL}/${persona}-${vp.name}-template-form.jpg`, fullPage: true, type: "jpeg", quality: 60 });
      await capture(page, persona, vp.name, "/hazri", "attendance");
      await capture(page, persona, vp.name, "/approvals", "approvals");
      await capture(page, persona, vp.name, "/staff", "team");
      await capture(page, persona, vp.name, "/search?q=quot", "search");
      await capture(page, persona, vp.name, "/khabar", "notifications");
      await capture(page, persona, vp.name, "/settings", "settings");
      await capture(page, persona, vp.name, "/more", "more");
      if (persona === "owner") await capture(page, persona, vp.name, "/checklists", "checklists");
      await ctx.close();
    }
  });
}

test.afterAll(() => {
  writeFileSync(`${OUT}/${LABEL}/index.json`, JSON.stringify(rows, null, 1));
});
