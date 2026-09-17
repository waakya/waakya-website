import { horizontalOverflow } from "./support/overflow";
import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { signInAs, TEST_USERS } from "./support/auth";

/**
 * Phase 1 golden paths: documents, templates, projects, approvals, search, and
 * the isolation rules behind them. Screens are read in English.
 */
const stamp = () => Date.now().toString(36);

function db() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
async function as(who: keyof typeof TEST_USERS) {
  const supabase = db();
  const { error } = await supabase.auth.signInWithPassword({
    email: TEST_USERS[who].email,
    password: TEST_USERS[who].password,
  });
  expect(error).toBeNull();
  return supabase;
}

const PDF = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");

async function upload(page: Page, name: string) {
  await page.getByTestId("document-file-input").first().setInputFiles({
    name,
    mimeType: "application/pdf",
    buffer: PDF,
  });
  await expect(page.getByTestId("document-row").filter({ hasText: name })).toBeVisible({ timeout: 30_000 });
}

test("documents: upload, survive reload, open, download, search, delete", async ({ page }) => {
  await signInAs(page, "owner", "en");
  const name = `quote-${stamp()}.pdf`;
  await page.goto("/documents");
  await expect(page.getByRole("heading", { name: "Documents", level: 1 })).toBeVisible();
  await upload(page, name);

  await page.reload();
  const row = page.getByTestId("document-row").filter({ hasText: name });
  await expect(row).toBeVisible();

  const signed = (r: { url(): string }) => r.url().includes("/storage/v1/object/sign/documents/");
  const openRequest = page.context().waitForEvent("request", signed);
  await row.getByRole("button", { name, exact: true }).click();
  expect((await openRequest).url()).toContain(`${name}?token=`);
  for (const extra of page.context().pages()) if (extra !== page) await extra.close();

  const downloadRequest = page.context().waitForEvent("request", signed);
  await row.getByRole("button", { name: `Download ${name}` }).click();
  expect((await downloadRequest).url()).toContain("download=");
  await page.goto("/documents");

  await page.goto(`/search?q=${encodeURIComponent(name.slice(0, 12))}`);
  await expect(page.getByRole("link", { name })).toBeVisible();

  await page.goto("/documents");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByTestId("document-row").filter({ hasText: name }).getByRole("button", { name: `Delete ${name}` }).click();
  await expect(page.getByTestId("document-row").filter({ hasText: name })).toHaveCount(0);
  await page.reload();
  await expect(page.getByTestId("document-row").filter({ hasText: name })).toHaveCount(0);
});

test("templates: fill, preview, save as a document, reopen", async ({ page }) => {
  await signInAs(page, "owner", "en");
  const client = `Client ${stamp()}`;
  await page.goto("/documents/templates");
  await page.getByRole("button", { name: /^Quotation/ }).click();
  const first = page.locator("form input[type=text]").first();
  await first.fill(client);
  await expect(page.frameLocator("iframe").first().getByText(client)).toBeVisible();
  // Fill anything still required.
  for (const input of await page.locator("form input[type=text]").all()) {
    if (!(await input.inputValue())) await input.fill("100");
  }
  for (const area of await page.locator("form textarea").all()) {
    if (!(await area.inputValue())) await area.fill("Kitchen work");
  }
  await page.getByRole("button", { name: "Save as document" }).click();
  await expect(page.getByText("Saved to Documents")).toBeVisible({ timeout: 30_000 });
  await page.getByRole("link", { name: "Open" }).click();
  await expect(page).toHaveURL(/\/documents\/[0-9a-f-]{36}$/);
  await expect(page.frameLocator("#document-frame").getByText(client)).toBeVisible();
});

test("projects and approvals: create, attach, request, approve", async ({ page, browser }) => {
  await signInAs(page, "owner", "en");
  const project = `Office fit-out ${stamp()}`;
  await page.goto("/projects");
  await page.getByRole("button", { name: "New project" }).click();
  await page.getByLabel("Project name").fill(project);
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page).toHaveURL(/\/projects\/[0-9a-f-]{36}/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: project })).toBeVisible();
  const docName = `boq-${stamp()}.pdf`;
  await upload(page, docName);
  await page.getByLabel("Status").selectOption("active");
  await page.reload();
  await expect(page.getByLabel("Status")).toHaveValue("active");
  await expect(page.getByTestId("document-row").filter({ hasText: docName })).toBeVisible();

  // Staff asks, owner decides.
  const staffContext = await browser.newContext();
  const staff = await staffContext.newPage();
  await signInAs(staff, "staff", "en");
  const title = `Approve vendor ${stamp()}`;
  await staff.goto("/approvals");
  await staff.getByRole("button", { name: "Ask for approval" }).click();
  await staff.getByLabel("What needs approving").fill(title);
  await staff.locator("form").getByRole("button", { name: "Ask for approval" }).click();
  await expect(staff.getByTestId("approval-card").filter({ hasText: title })).toBeVisible({ timeout: 30_000 });
  await expect(staff.getByTestId("approval-card").filter({ hasText: title }).getByRole("button", { name: "Approve" })).toHaveCount(0);

  await page.goto("/approvals");
  const card = page.getByTestId("approval-card").filter({ hasText: title });
  await card.getByRole("button", { name: "Approve" }).click();
  await expect(card.getByText("Approved")).toBeVisible({ timeout: 30_000 });

  await staff.reload();
  await expect(staff.getByTestId("approval-card").filter({ hasText: title }).getByText("Approved")).toBeVisible();
  await staff.goto("/khabar");
  await expect(staff.getByText(title).first()).toBeVisible();
  await staffContext.close();
});

test("a member cannot manage projects; an outsider sees nothing", async ({ page }) => {
  const staff = await as("staff");
  const { data: me } = await staff.auth.getUser();
  const { data: orgs } = await staff.from("orgs").select("id");
  const orgId = orgs![0].id;
  const denied = await staff.from("projects").insert({ org_id: orgId, name: "Not allowed", created_by: me.user!.id });
  expect(denied.error).not.toBeNull();

  const outsider = await as("noorg");
  for (const table of ["projects", "documents", "approvals", "project_members"] as const) {
    const { data, error } = await outsider.from(table).select("*");
    expect(error).toBeNull();
    expect(data, table).toEqual([]);
  }
  const listed = await outsider.storage.from("documents").list(`orgs/${orgId}/documents`);
  expect(listed.data ?? []).toEqual([]);
  const planted = await outsider.storage
    .from("documents")
    .upload(`orgs/${orgId}/documents/x/evil.pdf`, PDF, { contentType: "application/pdf" });
  expect(planted.error).not.toBeNull();

  await signInAs(page, "staff", "en");
  await page.goto("/projects");
  await expect(page.getByRole("heading", { name: "Projects", level: 1 })).toBeVisible();
  await expect(page.getByRole("button", { name: "New project" })).toHaveCount(0);
});

for (const who of ["owner", "staff"] as const) {
  test(`every Phase 1 screen fits a 390px phone (${who})`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await signInAs(page, who, "en");
    const paths = ["/aaj", "/baat", "/work", "/projects", "/documents", "/documents/templates", "/hazri", "/approvals", "/staff", "/search?q=a", "/settings", "/more", "/khabar"];
    // Detail pages carry the longest names and the most controls.
    for (const [list, prefix] of [["/projects", "/projects/"], ["/work?tab=done", "/kaam/"], ["/baat", "/baat/"], ["/documents", "/documents/"]] as const) {
      await page.goto(list);
      const href = await page.locator(`main a[href^="${prefix}"]:not([href$="/templates"])`).first().getAttribute("href").catch(() => null);
      if (href) paths.push(href);
    }
    for (const path of paths) {
      const response = await page.goto(path);
      expect(response?.status(), path).toBeLessThan(400);
      const overflow = await horizontalOverflow(page);
      expect(overflow, `${path} scrolls sideways`).toBeLessThanOrEqual(1);
    }
  });
}

test("group conversation: create, attach a file, only members can see it", async ({ page, browser }) => {
  await signInAs(page, "owner", "en");
  const group = `Site team ${stamp()}`;
  await page.goto("/baat");
  await page.getByRole("button", { name: "New group" }).click();
  await page.getByLabel("Group name").fill(group);
  await page.getByRole("button", { name: /Raju/ }).first().click();
  await page.getByRole("button", { name: "Create group" }).click();
  await expect(page).toHaveURL(/\/baat\/[0-9a-f-]{36}/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: group })).toBeVisible();

  const file = `site-photos-${stamp()}.pdf`;
  await page.getByTestId("thread-file-input").setInputFiles({ name: file, mimeType: "application/pdf", buffer: PDF });
  await expect(page.getByRole("button", { name: file })).toBeVisible({ timeout: 30_000 });
  await page.reload();
  await expect(page.getByRole("button", { name: file })).toBeVisible();
  // Your own message can become a task too — the most common case.
  await expect(page.getByTestId("make-task").first()).toBeVisible();
  const threadUrl = page.url();

  const staffContext = await browser.newContext();
  const staff = await staffContext.newPage();
  await signInAs(staff, "staff", "en");
  await staff.goto(threadUrl);
  await expect(staff.getByRole("button", { name: file })).toBeVisible();
  await staffContext.close();

  const outsider = await as("noorg");
  const { data } = await outsider.from("conversations").select("id").eq("title", group);
  expect(data).toEqual([]);
  const { data: docs } = await outsider.from("documents").select("id").eq("name", file);
  expect(docs).toEqual([]);
});
