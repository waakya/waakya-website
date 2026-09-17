import { horizontalOverflow } from "../e2e/support/overflow";
import { randomBytes } from "node:crypto";
import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

/**
 * Production cutover smoke test against the real https://waakya.com.
 * Two fresh QA users build a new business through the app itself; a third,
 * already-existing business proves isolation from the outside.
 */
test.describe.configure({ mode: "serial" });
test.use({ viewport: { width: 1366, height: 860 }, isMobile: false, hasTouch: false });

const BASE = "https://waakya.com";
const HOST = "waakya.com";
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const RUN = Date.now().toString(36);
const BIZ = `QA Cutover ${RUN}`;
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const PDF = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");

type Qa = { email: string; password: string; id?: string };
const owner: Qa = { email: `qa-owner-${RUN}@waakya.test`, password: randomBytes(18).toString("hex") };
const staff: Qa = { email: `qa-staff-${RUN}@waakya.test`, password: randomBytes(18).toString("hex") };
const OUTSIDER = { email: "owner@waakya.test", password: "waakya-e2e-owner-pass" };

const shared: { orgId?: string; ownerCtx?: BrowserContext; staffCtx?: BrowserContext; o?: Page; s?: Page; taskUrl?: string; taskTitle?: string; project?: string; docName?: string; problems: string[] } = { problems: [] };

function watch(page: Page, who: string) {
  page.on("pageerror", (e) => shared.problems.push(`${who} pageerror ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error" && !/favicon|Failed to load resource: the server responded with a status of 4/.test(m.text())) shared.problems.push(`${who} console ${m.text().slice(0, 200)}`); });
  page.on("response", (r) => { if (r.status() >= 500) shared.problems.push(`${who} ${r.status()} ${r.url()}`); });
}

async function session(browser: Browser, user: Qa, profileName?: string) {
  const jar = new Map<string, string>();
  const sb = createServerClient(URL, ANON, { cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: (l) => l.forEach(({ name, value }) => jar.set(name, value)) } });
  const { data, error } = await sb.auth.signInWithPassword({ email: user.email, password: user.password });
  expect(error).toBeNull();
  if (profileName) await sb.from("profiles").upsert({ id: data.user!.id, full_name: profileName }, { onConflict: "id" });
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 860 } });
  await ctx.addCookies([
    ...[...jar].map(([name, value]) => ({ name, value, domain: HOST, path: "/", secure: true, sameSite: "Lax" as const })),
    { name: "waakya_lang", value: "en", domain: HOST, path: "/" },
  ]);
  return ctx;
}

async function db(user: { email: string; password: string }) {
  const c = createClient(URL, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await c.auth.signInWithPassword(user);
  expect(error).toBeNull();
  return c;
}

test.beforeAll(async () => {
  const admin = createClient(URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });
  for (const u of [owner, staff]) {
    const { data, error } = await admin.auth.admin.createUser({ email: u.email, password: u.password, email_confirm: true });
    expect(error).toBeNull();
    u.id = data.user!.id;
  }
});

test("01 public site, login page and Google hand-off", async ({ page }) => {
  watch(page, "anon");
  await page.goto(BASE + "/");
  await expect(page.getByRole("heading", { level: 1, name: /All your business work/ })).toBeInViewport();
  await page.goto(BASE + "/login");
  await page.getByRole("checkbox").first().check();
  const google = page.waitForRequest((r) => r.url().startsWith("https://accounts.google.com/"), { timeout: 30_000 });
  await page.getByRole("button", { name: "Continue with Google" }).click();
  const req = await google;
  expect(decodeURIComponent(req.url())).toContain("krdmzjjmbrphzcuotfgz.supabase.co/auth/v1/callback");
  await page.waitForLoadState("domcontentloaded");
  await expect(page.getByText(/redirect_uri_mismatch/)).toHaveCount(0);
});

test("02 owner creates a business, profile, invites staff; staff joins", async ({ browser }) => {
  shared.ownerCtx = await session(browser, owner, "QA Owner");
  const o = (shared.o = await shared.ownerCtx.newPage());
  watch(o, "owner");
  await o.goto(BASE + "/aaj");
  await expect(o).toHaveURL(/\/setup$/);
  await o.getByLabel("Business name").fill(BIZ);
  await o.getByRole("button", { name: "Create business" }).click();
  await expect(o).toHaveURL(/\/setup\/profile$/, { timeout: 30_000 });
  await o.getByLabel("Business address").fill("Sector 62, Noida");
  await o.getByLabel("Business phone").fill("9876500000");
  await o.getByRole("button", { name: "Continue" }).click();
  await expect(o).toHaveURL(/\/staff$/, { timeout: 30_000 });

  await o.getByRole("button", { name: "Invite to team" }).first().click();
  await o.getByLabel("Name").fill("QA Staff");
  await o.getByLabel("Phone number").fill("9876511111");
  await o.getByRole("button", { name: "Make the link" }).click();
  const link = (await o.getByText(/\/join\/[0-9a-f]{32}/).innerText()).trim();
  const path = new globalThis.URL(link).pathname;
  await o.keyboard.press("Escape");

  shared.staffCtx = await session(browser, staff);
  const s = (shared.s = await shared.staffCtx.newPage());
  watch(s, "staff");
  await s.goto(BASE + path);
  await s.getByRole("button", { name: "Join" }).click();
  await expect(s).toHaveURL(/\/aaj$/, { timeout: 30_000 });

  const c = await db(owner);
  const { data } = await c.from("orgs").select("id, name").eq("name", BIZ);
  expect(data?.length).toBe(1);
  shared.orgId = data![0].id;
  await o.goto(BASE + "/staff");
  await expect(o.getByText("QA Staff").first()).toBeVisible();
});

test("03 Today and team permissions", async () => {
  const { o, s } = shared as Required<typeof shared>;
  for (const p of [o, s]) {
    const r = await p.goto(BASE + "/aaj");
    expect(r?.status()).toBe(200);
    if (process.env.STRIP_CHECK !== "0") await expect(p.getByTestId("attention-strip").filter({ visible: true }).first()).toBeVisible();
  }
  await s.goto(BASE + "/staff");
  await expect(s.getByRole("button", { name: "Invite to team" })).toHaveCount(0);
  await s.goto(BASE + "/projects");
  await expect(s.getByRole("button", { name: "New project" })).toHaveCount(0);
  const sc = await db(staff);
  const denied = await sc.from("projects").insert({ org_id: shared.orgId!, name: "Nope", created_by: staff.id! });
  expect(denied.error).not.toBeNull();
});

test("04 conversations: direct, message to task, group, attachment", async () => {
  const { o, s } = shared as Required<typeof shared>;
  await s.goto(BASE + "/baat");
  await s.getByRole("button", { name: "New conversation" }).click();
  await s.getByRole("button", { name: /QA Owner/ }).click();
  await expect(s).toHaveURL(/\/baat\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  const ask = `Please send the revised quotation ${RUN}`;
  await s.getByLabel("Write a message").fill(ask);
  await s.getByRole("button", { name: "Send" }).click();
  await expect(s.getByText(ask)).toBeVisible();
  const dm = s.url().replace(BASE, "");

  await o.goto(BASE + "/baat");
  await expect(o.getByText(ask).first()).toBeVisible({ timeout: 30_000 });
  await o.goto(BASE + dm);
  await o.getByTestId("make-task").first().click();
  shared.taskTitle = `Revised quotation ${RUN}`;
  await o.getByLabel("What").fill(shared.taskTitle);
  await o.getByRole("button", { name: "QA Staff" }).click();
  await o.locator("form").filter({ hasText: "Task created from this message" }).getByRole("button", { name: "Create task" }).click();
  await expect(o.getByRole("link", { name: "Task created" })).toBeVisible({ timeout: 30_000 });
  await o.reload();
  await o.getByRole("link", { name: "Task created" }).click();
  await expect(o).toHaveURL(/\/kaam\/[0-9a-f-]{36}$/);
  shared.taskUrl = o.url().replace(BASE, "");

  const group = `Site team ${RUN}`;
  await o.goto(BASE + "/baat");
  await o.getByRole("button", { name: "New group" }).click();
  await o.getByLabel("Group name").fill(group);
  await o.getByRole("button", { name: /QA Staff/ }).click();
  await o.getByRole("button", { name: "Create group" }).click();
  await expect(o).toHaveURL(/\/baat\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  const file = `site-plan-${RUN}.pdf`;
  await o.getByTestId("thread-file-input").setInputFiles({ name: file, mimeType: "application/pdf", buffer: PDF });
  await expect(o.getByRole("button", { name: file })).toBeVisible({ timeout: 30_000 });
  const groupUrl = o.url().replace(BASE, "");
  await s.goto(BASE + groupUrl);
  await expect(s.getByRole("heading", { name: group })).toBeVisible();
  const signed = s.context().waitForEvent("request", (r) => r.url().includes("/storage/v1/object/sign/documents/"));
  await s.getByRole("button", { name: file }).click();
  await signed;
  for (const extra of s.context().pages()) if (extra !== s) await extra.close();
});

test("05 task lifecycle with photo proof and verify", async () => {
  const { o, s } = shared as Required<typeof shared>;
  await s.goto(BASE + shared.taskUrl!);
  const trail = s.getByRole("list", { name: "Timeline" });
  await s.getByRole("button", { name: "Seen, will do" }).first().click();
  await expect(s.getByRole("button", { name: "Started" }).first()).toBeVisible({ timeout: 30_000 });
  await s.getByRole("button", { name: "Started" }).first().click();
  await expect(trail).toContainText("In progress", { timeout: 30_000 });
  await s.getByRole("button", { name: "Done", exact: true }).first().click();
  await s.getByTestId("proof-file-input").setInputFiles({ name: "proof.png", mimeType: "image/png", buffer: PNG });
  await expect(s.getByText("1 photo")).toBeVisible();
  await s.getByRole("button", { name: "Send · done" }).click();
  await expect(s.getByRole("button", { name: "Send · done" })).toHaveCount(0, { timeout: 30_000 });
  await expect(trail).toContainText("Done", { timeout: 30_000 });
  await s.reload();
  await expect(s.getByRole("list", { name: "Timeline" })).toContainText("Done");
  await expect(s.getByRole("button", { name: "Verify" })).toHaveCount(0);

  await o.goto(BASE + shared.taskUrl!);
  await o.getByRole("button", { name: "Verify" }).first().click();
  await expect(o.getByRole("list", { name: "Timeline" })).toContainText("Verified", { timeout: 30_000 });
  await o.reload();
  await expect(o.getByRole("list", { name: "Timeline" })).toContainText("Verified");
  await expect(o.getByRole("img", { name: /Photo sent by/ }).first()).toBeVisible();
  await expect(o.getByText(/^Verified · /).first()).toBeVisible();
  await expect(o.getByRole("progressbar")).toHaveCount(0);
  await expect(o.getByText(/left$/)).toHaveCount(0);
});

test("06 projects, documents, task links, templates", async () => {
  const { o } = shared as Required<typeof shared>;
  shared.project = `Office fit-out ${RUN}`;
  await o.goto(BASE + "/projects");
  await o.getByRole("button", { name: "New project" }).click();
  await o.getByLabel("Project name").fill(shared.project);
  await o.getByRole("button", { name: "Create" }).click();
  await expect(o).toHaveURL(/\/projects\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  const projectUrl = o.url().replace(BASE, "");
  await o.getByLabel("Status").selectOption("active");
  await o.goto(BASE + shared.taskUrl!);
  await o.getByLabel("Project", { exact: true }).selectOption({ label: shared.project });
  await expect(o.getByLabel("Project", { exact: true })).not.toBeDisabled({ timeout: 30_000 });
  await o.reload();
  await expect(o.getByLabel("Project", { exact: true }).locator("option:checked")).toHaveText(shared.project);
  await o.goto(BASE + projectUrl);
  await expect(o.getByLabel("Status")).toHaveValue("active");
  await expect(o.getByRole("link", { name: shared.taskTitle! }).first()).toBeVisible();

  shared.docName = `boq-${RUN}.pdf`;
  await o.getByTestId("document-file-input").first().setInputFiles({ name: shared.docName, mimeType: "application/pdf", buffer: PDF });
  const row = () => o.getByTestId("document-row").filter({ hasText: shared.docName! });
  await expect(row()).toBeVisible({ timeout: 30_000 });
  await o.goto(BASE + "/documents");
  await o.reload();
  await expect(row()).toBeVisible();
  await expect(row().getByRole("link", { name: new RegExp(shared.project) })).toBeVisible();
  const opened = o.context().waitForEvent("request", (r) => r.url().includes("/storage/v1/object/sign/documents/") && !r.url().includes("download="));
  await row().getByRole("button", { name: shared.docName, exact: true }).click();
  await opened;
  for (const extra of o.context().pages()) if (extra !== o) await extra.close();
  const dl = o.context().waitForEvent("request", (r) => r.url().includes("/storage/v1/object/sign/documents/") && r.url().includes("download="));
  await row().getByRole("button", { name: `Download ${shared.docName}` }).click();
  await dl;

  const taskDoc = `photos-${RUN}.pdf`;
  await o.goto(BASE + shared.taskUrl!);
  await o.getByTestId("document-file-input").first().setInputFiles({ name: taskDoc, mimeType: "application/pdf", buffer: PDF });
  await expect(o.getByTestId("document-row").filter({ hasText: taskDoc })).toBeVisible({ timeout: 30_000 });
  await o.reload();
  await expect(o.getByTestId("document-row").filter({ hasText: taskDoc })).toBeVisible();

  const client = `Client ${RUN}`;
  await o.goto(BASE + "/documents/templates");
  await o.getByRole("button", { name: /^Quotation/ }).click();
  await o.locator("form input[type=text]").first().fill(client);
  await expect(o.frameLocator("iframe").first().getByText(client)).toBeVisible();
  for (const input of await o.locator("form input[type=text]").all()) if (!(await input.inputValue())) await input.fill("1000");
  for (const area of await o.locator("form textarea").all()) if (!(await area.inputValue())) await area.fill("Kitchen and flooring");
  const projectSelect = o.locator("#template-project");
  if (await projectSelect.count()) await projectSelect.selectOption({ label: shared.project });
  await o.getByRole("button", { name: "Save as document" }).click();
  await expect(o.getByText("Saved to Documents")).toBeVisible({ timeout: 30_000 });
  await o.getByRole("link", { name: "Open" }).click();
  await expect(o).toHaveURL(/\/documents\/[0-9a-f-]{36}$/);
  await expect(o.frameLocator("#document-frame").getByText(client)).toBeVisible();
  await o.goto(BASE + projectUrl);
  await expect(o.getByTestId("document-row").filter({ hasText: shared.docName })).toBeVisible();
});

test("07 attendance, leave with half day, holiday", async () => {
  const { o, s } = shared as Required<typeof shared>;
  await s.goto(BASE + "/hazri");
  await s.getByRole("button", { name: "Punch in" }).click();
  await expect(s.getByRole("button", { name: "Punch out" })).toBeVisible({ timeout: 30_000 });
  await s.reload();
  await expect(s.getByRole("button", { name: "Punch out" })).toBeVisible();
  await s.getByRole("button", { name: "Punch out" }).click();
  await expect(s.getByRole("button", { name: /Punch (in|out)/ })).toHaveCount(0, { timeout: 30_000 });
  await s.reload();
  await expect(s.getByText("Punched out").first()).toBeVisible();
  await s.goto(BASE + "/aaj");
  await expect(s.getByText(/^Punched out at /).filter({ visible: true }).first()).toBeVisible();
  await s.goto(BASE + "/hazri");

  // Credit two days, then a half day is approved and a full day rejected.
  await o.goto(BASE + "/hazri");
  const balanceRow = o.locator("li").filter({ hasText: "QA Staff" }).filter({ has: o.getByRole("button", { name: "Add 1 day" }) });
  await balanceRow.getByRole("button", { name: "Add 1 day" }).click();
  await expect(balanceRow).toContainText("1 day", { timeout: 30_000 });
  await balanceRow.getByRole("button", { name: "Add 1 day" }).click();
  await expect(balanceRow).toContainText("2 days", { timeout: 30_000 });

  const day = (n: number) => { const d = new Date(Date.now() + n * 86400000); while ([0, 6].includes(d.getDay())) d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); };
  const apply = async (kind: "Half day" | "Full day", date: string, reason: string) => {
    await s.goto(BASE + "/hazri");
    await s.getByRole("button", { name: "Apply leave" }).click();
    await s.getByRole("button", { name: kind, exact: true }).click();
    await s.locator("#leave-start").fill(date);
    if (await s.locator("#leave-end").count()) await s.locator("#leave-end").fill(date);
    await s.locator("#leave-reason").fill(reason);
    if (kind === "Half day") await expect(s.getByText("This costs half day.")).toBeVisible();
    await s.getByRole("button", { name: "Send request" }).click();
    await expect(s.getByRole("button", { name: "Send request" })).toHaveCount(0, { timeout: 30_000 });
    await expect(s.locator("li").filter({ hasText: kind === "Half day" ? "half day" : "1 day" }).getByText("Waiting")).toBeVisible();
  };
  await apply("Half day", day(7), `Bank work ${RUN}`);
  await apply("Full day", day(14), `Family ${RUN}`);

  await o.goto(BASE + "/hazri");
  await o.locator("li").filter({ hasText: `Bank work ${RUN}` }).getByRole("button", { name: "Approve" }).click();
  await expect(o.locator("li").filter({ hasText: `Bank work ${RUN}` })).toHaveCount(0, { timeout: 30_000 });
  await o.locator("li").filter({ hasText: `Family ${RUN}` }).getByRole("button", { name: "Reject" }).click();
  await expect(o.locator("li").filter({ hasText: `Family ${RUN}` })).toHaveCount(0, { timeout: 30_000 });

  const holiday = `Founders Day ${RUN}`;
  await o.getByLabel("Date", { exact: true }).fill(day(21));
  await o.getByLabel("Holiday name").fill(holiday);
  await o.getByRole("button", { name: "Add", exact: true }).click();
  await expect(o.getByText(holiday).first()).toBeVisible({ timeout: 30_000 });

  await s.goto(BASE + "/hazri");
  await expect(s.getByTestId("leave-balance")).toHaveText("1.5 days");
  await expect(s.locator("li").filter({ hasText: "half day" }).getByText("Approved")).toBeVisible();
  await expect(s.locator("li").filter({ hasText: "1 day" }).getByText("Rejected")).toBeVisible();
  await expect(s.getByText(holiday).first()).toBeVisible();
  const c = await db(staff);
  const { data } = await c.from("leave_requests").select("request_type, days_requested, status").eq("org_id", shared.orgId!).order("start_date");
  expect(data?.map((r) => [r.request_type, Number(r.days_requested), r.status])).toEqual([["half_day", 0.5, "approved"], ["full_day", 1, "rejected"]]);
});

test("08 approvals, search, notifications", async () => {
  const { o, s } = shared as Required<typeof shared>;
  const yes = `Approve vendor ${RUN}`;
  const no = `Approve extra spend ${RUN}`;
  for (const title of [yes, no]) {
    await s.goto(BASE + "/approvals");
    await s.getByRole("button", { name: "Ask for approval" }).click();
    await s.getByLabel("What needs approving").fill(title);
    await s.locator("form").getByRole("button", { name: "Ask for approval" }).click();
    await expect(s.getByTestId("approval-card").filter({ hasText: title })).toBeVisible({ timeout: 30_000 });
  }
  await expect(s.getByTestId("approval-card").filter({ hasText: yes }).getByRole("button", { name: "Approve" })).toHaveCount(0);
  await o.goto(BASE + "/approvals");
  await o.getByTestId("approval-card").filter({ hasText: yes }).getByRole("button", { name: "Approve" }).click();
  await expect(o.getByTestId("approval-card").filter({ hasText: yes }).getByText("Approved")).toBeVisible({ timeout: 30_000 });
  await o.getByTestId("approval-card").filter({ hasText: no }).getByRole("button", { name: "Reject" }).click();
  await expect(o.getByTestId("approval-card").filter({ hasText: no }).getByText("Rejected")).toBeVisible({ timeout: 30_000 });
  await s.reload();
  await expect(s.getByTestId("approval-card").filter({ hasText: yes }).getByText("Approved")).toBeVisible();

  await o.goto(BASE + `/search?q=${encodeURIComponent(RUN)}`);
  await expect(o.getByRole("link", { name: shared.project! })).toBeVisible();
  await expect(o.getByRole("link", { name: shared.docName! })).toBeVisible();
  await expect(o.getByRole("link", { name: new RegExp(shared.taskTitle!) }).first()).toBeVisible();

  await s.goto(BASE + "/khabar");
  await expect(s.getByText(yes).first()).toBeVisible();
  await o.goto(BASE + "/khabar");
  expect((await o.goto(BASE + "/khabar"))?.status()).toBe(200);
});

test("09 cross-organisation isolation in the production database", async () => {
  const orgId = shared.orgId!;
  const outsider = await db(OUTSIDER);
  for (const table of ["orgs", "memberships", "tasks", "projects", "documents", "approvals", "conversations", "messages", "attendance_records", "leave_requests", "holidays", "notifications", "proofs"] as const) {
    const { data, error } = await outsider.from(table).select("*").eq(table === "orgs" ? "id" : "org_id", orgId);
    expect(error, table).toBeNull();
    expect(data, table).toEqual([]);
  }
  const listed = await outsider.storage.from("documents").list(`orgs/${orgId}/documents`);
  expect(listed.data ?? []).toEqual([]);
  const owned = await db(owner);
  const { data: docs } = await owned.from("documents").select("storage_key").eq("org_id", orgId).limit(1);
  expect(docs?.length).toBe(1);
  const read = await outsider.storage.from("documents").createSignedUrl(docs![0].storage_key, 60);
  expect(read.data?.signedUrl ?? null).toBeNull();
  const planted = await outsider.storage.from("documents").upload(`orgs/${orgId}/documents/x/evil.pdf`, PDF, { contentType: "application/pdf" });
  expect(planted.error).not.toBeNull();
  const { data: me } = await outsider.auth.getUser();
  const row = await outsider.from("documents").insert({ org_id: orgId, name: "evil.pdf", storage_key: `orgs/${orgId}/documents/x/evil.pdf`, uploaded_by: me.user!.id, size_bytes: 10, mime_type: "application/pdf", category: "other" } as never);
  expect(row.error).not.toBeNull();
  // And the reverse: the new business cannot see the other business.
  const { data: theirOrg } = await outsider.from("orgs").select("id").limit(1);
  const { data: leak } = await owned.from("tasks").select("id").eq("org_id", theirOrg![0].id);
  expect(leak).toEqual([]);
});

test("10 phone width and console health", async ({ browser }) => {
  const phone = await session(browser, staff);
  const p = await phone.newPage();
  await p.setViewportSize({ width: 390, height: 844 });
  watch(p, "staff-phone");
  for (const path of ["/", "/aaj", "/baat", "/work", "/projects", "/documents", "/documents/templates", "/hazri", "/approvals", "/search", "/khabar", "/more", "/settings", shared.taskUrl!]) {
    const r = await p.goto(BASE + path);
    expect(r?.status(), path).toBe(200);
    const overflow = await horizontalOverflow(p);
    expect(overflow, `${path} scrolls sideways`).toBeLessThanOrEqual(1);
  }
  await phone.close();
  await shared.ownerCtx?.close();
  await shared.staffCtx?.close();
  expect(shared.problems).toEqual([]);
});
