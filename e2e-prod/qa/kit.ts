import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

/**
 * Shared kit for the full-organization QA run against the real waakya.com.
 *
 * Every person gets their own browser context signed in with their own
 * session. State (ids, passwords) lives only in the scratch directory given by
 * QA_DIR, never in the repository, and is deleted when the run is finished.
 */
export const BASE = "https://waakya.com";
export const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
export const QA_DIR = process.env.QA_DIR!;
const STATE_FILE = `${QA_DIR}/state.json`;
const MATRIX_FILE = `${QA_DIR}/matrix.jsonl`;

export type Who = "priya" | "arjun" | "rahul" | "neha" | "vikram";
export const PEOPLE: Record<Who, { name: string; role: string; org: "A" | "B" }> = {
  priya: { name: "Priya Sharma", role: "owner", org: "A" },
  arjun: { name: "Arjun Mehta", role: "manager", org: "A" },
  rahul: { name: "Rahul Verma", role: "member", org: "A" },
  neha: { name: "Neha Singh", role: "member", org: "A" },
  vikram: { name: "Vikram Rao", role: "owner", org: "B" },
};

export interface QaState {
  run: string;
  orgA?: string;
  orgB?: string;
  orgAName: string;
  orgBName: string;
  users: Record<Who, { email: string; password: string; id?: string }>;
  ids: Record<string, string>;
}

export function loadState(): QaState {
  if (existsSync(STATE_FILE)) return JSON.parse(readFileSync(STATE_FILE, "utf8"));
  const run = Date.now().toString(36);
  const users = Object.fromEntries(
    (Object.keys(PEOPLE) as Who[]).map((who) => [
      who,
      { email: `qa-${who}-${run}@waakya.test`, password: randomBytes(18).toString("hex") },
    ]),
  ) as QaState["users"];
  const state: QaState = { run, orgAName: `Sharma Interiors QA ${run}`, orgBName: `Rao Builders QA ${run}`, users, ids: {} };
  saveState(state);
  return state;
}

export function saveState(state: QaState) {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 1), { mode: 0o600 });
}

export function admin(): SupabaseClient {
  return createClient(URL_, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** A database client acting as that person, through RLS — the same power their browser has. */
const clients = new Map<Who, SupabaseClient>();
export async function as(who: Who): Promise<SupabaseClient> {
  const cached = clients.get(who);
  if (cached) return cached;
  const state = loadState();
  const client = createClient(URL_, ANON, { auth: { persistSession: false, autoRefreshToken: true } });
  const { error } = await retry(() => client.auth.signInWithPassword({ email: state.users[who].email, password: state.users[who].password }));
  expect(error, `sign in ${who}`).toBeNull();
  clients.set(who, client);
  return client;
}

/** Network hiccups are not product bugs: retry a sign-in a few times before failing. */
async function retry<T extends { error: unknown }>(fn: () => Promise<T>): Promise<T> {
  let last!: T;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    last = await fn().catch((error) => ({ error }) as T);
    const fault = last.error as { message?: string; name?: string } | null;
    const text = `${fault?.name ?? ""} ${fault?.message ?? ""}`;
    if (!last.error || !/fetch failed|network|ECONN|timeout|retryable/i.test(text)) return last;
    await new Promise((resolve) => setTimeout(resolve, Math.min(5000 * (attempt + 1), 20_000)));
  }
  return last;
}

export type Viewport = "desktop" | "mobile";

/** Browser pages kept open per person for a spec file, like real people with the app open. */
const open = new Map<string, Page>();
export async function pageOf(browser: Browser, who: Who, viewport: Viewport = "desktop"): Promise<Page> {
  const key = `${who}:${viewport}`;
  const existing = open.get(key);
  if (existing && !existing.isClosed()) return existing;
  const { page } = await signedIn(browser, who, viewport);
  open.set(key, page);
  return page;
}
export async function closeAll() {
  for (const page of open.values()) await page.context().close().catch(() => {});
  open.clear();
}

/** A signed-in browser context for one person. */
export async function signedIn(browser: Browser, who: Who, viewport: Viewport = "desktop"): Promise<{ ctx: BrowserContext; page: Page }> {
  const state = loadState();
  const jar = new Map<string, string>();
  const sb = createServerClient(URL_, ANON, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (list) => list.forEach(({ name, value }) => jar.set(name, value)),
    },
  });
  const { error } = await retry(() => sb.auth.signInWithPassword({ email: state.users[who].email, password: state.users[who].password }));
  expect(error, `sign in ${who}`).toBeNull();
  const ctx = await browser.newContext(
    viewport === "mobile"
      ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }
      : { viewport: { width: 1366, height: 860 } },
  );
  await ctx.addCookies([
    ...[...jar].map(([name, value]) => ({ name, value, domain: "waakya.com", path: "/", secure: true, sameSite: "Lax" as const })),
    { name: "waakya_lang", value: "en", domain: "waakya.com", path: "/" },
  ]);
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log(`[${who}] pageerror`, e.message));
  return { ctx, page };
}

export async function go(page: Page, path: string) {
  const res = await page.goto(BASE + path, { waitUntil: "domcontentloaded" });
  expect(res?.status() ?? 0, `${path} status`).toBeLessThan(500);
  // Controls typed into before hydration lose their input; wait like a person would.
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
  return res;
}

export type Result = "PASS" | "FAIL" | "BLOCKED";
export interface Row {
  id: string;
  area: string;
  scenario: string;
  initiator: string;
  receiver: string;
  expected: string;
  actual?: string;
  desktop: string;
  mobile: string;
  persistence: string;
  permission: string;
  result?: Result;
}

export function record(row: Row) {
  appendFileSync(MATRIX_FILE, JSON.stringify({ ...row, at: new Date().toISOString() }) + "\n");
}

/**
 * One matrix row as one Playwright test. It passes only if every step inside
 * — actor action, receiver view, reload — passes; the failing assertion is
 * recorded as the actual result.
 */
export function scenario(
  row: Omit<Row, "actual" | "result">,
  fn: (args: { browser: Browser; note: (s: string) => void }) => Promise<void>,
) {
  test(`${row.id} ${row.scenario}`, async ({ browser }) => {
    const notes: string[] = [];
    try {
      await fn({ browser, note: (s) => notes.push(s) });
      record({ ...row, actual: notes.join("; ") || "As expected", result: "PASS" });
    } catch (error) {
      const message = (error as Error).message.split(String.fromCharCode(27)).join("").replace(/\[[0-9;]*m/g, "").split("\n").filter(Boolean).slice(0, 3).join(" | ");
      record({ ...row, actual: [...notes, message].join("; ").slice(0, 500), result: "FAIL" });
      throw error;
    }
  });
}

export function blocked(row: Omit<Row, "actual" | "result">, reason: string) {
  test(`${row.id} ${row.scenario} (blocked)`, async () => {
    record({ ...row, actual: reason, result: "BLOCKED" });
  });
}

/** A unique, human-readable marker for records created in this run. */
export function tag(label: string): string {
  return `${label} ${loadState().run}`;
}

export const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);
export const PDF = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");

/**
 * Press an action, refreshing if the page was rendered a moment too early.
 *
 * A task's state and its timeline are two writes, so a page opened in the
 * split second between them can show the old set of actions. A person would
 * refresh; so does this.
 */
export async function act(page: Page, name: string) {
  const button = page.getByRole("button", { name, exact: true }).first();
  for (let attempt = 0; attempt < 6; attempt += 1) {
    if (await button.count()) {
      await button.click();
      return;
    }
    await page.waitForTimeout(2000);
    await page.reload();
    await page.waitForLoadState("networkidle").catch(() => {});
  }
  await expect(button, `${name} is offered`).toBeVisible();
  await button.click();
}
