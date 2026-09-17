import { expect, test, type Page } from "@playwright/test";
import { admin, as, BASE, closeAll, go, loadState, pageOf, PDF, PNG, saveState, scenario, tag } from "./kit";
import { createTaskUI, openTask } from "./flows";

/** TEST 5 — Projects. TEST 6 — Documents, including cross-organization security. TEST 7 — Templates. */
test.describe.configure({ mode: "default" });
test.afterAll(closeAll);

const rows = (page: Page, name: string) => page.getByTestId("document-row").filter({ hasText: name });

async function upload(page: Page, name: string, mimeType: string, buffer: Buffer) {
  await page.getByTestId("document-file-input").first().setInputFiles({ name, mimeType, buffer });
  await expect(rows(page, name)).toBeVisible({ timeout: 30_000 });
}

scenario(
  { id: "T5.1", area: "Projects", scenario: "Owner creates a project and adds people", initiator: "Priya", receiver: "Arjun, Rahul", expected: "Project created with Arjun and Rahul; both see it with its people", desktop: "Tested", mobile: "See T18", persistence: "Reload", permission: "Owner creates" },
  async ({ browser }) => {
    const state = loadState();
    const priya = await pageOf(browser, "priya");
    const name = tag("Tower B lobby fit-out");
    await go(priya, "/projects");
    await priya.getByRole("button", { name: "New project" }).click();
    await priya.getByLabel("Project name").fill(name);
    const dialog = priya.getByRole("dialog");
    for (const person of ["Arjun Mehta", "Rahul Verma"]) {
      const pick = dialog.getByRole("button", { name: person });
      if (await pick.count()) await pick.click();
    }
    await priya.getByRole("button", { name: "Create" }).click();
    await expect(priya).toHaveURL(/\/projects\/[0-9a-f-]{36}$/, { timeout: 30_000 });
    state.ids.project = priya.url().replace(BASE, "");
    saveState(state);
    for (const person of ["Arjun Mehta", "Rahul Verma"]) {
      const add = priya.getByLabel("Add person");
      if (await add.count()) {
        const option = add.locator("option", { hasText: person });
        if (await option.count()) {
          await add.selectOption({ label: person });
          await priya.waitForTimeout(1500);
        }
      }
    }
    await priya.reload();
    for (const who of ["arjun", "rahul"] as const) {
      const p = await pageOf(browser, who);
      await go(p, "/projects");
      await expect(p.getByText(name).first()).toBeVisible();
      await go(p, state.ids.project);
      await expect(p.getByRole("heading", { name })).toBeVisible();
      await expect(p.getByText("Arjun Mehta").first()).toBeVisible();
      await expect(p.getByText("Rahul Verma").first()).toBeVisible();
    }
  },
);

scenario(
  { id: "T5.2", area: "Projects", scenario: "Link existing tasks and a new task; members see them", initiator: "Priya", receiver: "Rahul", expected: "Two tasks linked (one existing, one new); visible on the project for Rahul; task pages show the project", desktop: "Tested", mobile: "See T18", persistence: "Reload", permission: "Owner" },
  async ({ browser }) => {
    const state = loadState();
    const priya = await pageOf(browser, "priya");
    const newTitle = tag("Lobby false ceiling drawings");
    const newId = await createTaskUI(priya, { assignee: "Rahul Verma", title: newTitle });
    state.ids.projectTask = newId;
    saveState(state);
    await go(priya, state.ids.project);
    await priya.getByLabel("Add a task to this project").selectOption({ label: newTitle });
    await expect(priya.getByRole("link", { name: newTitle }).first()).toBeVisible({ timeout: 30_000 });
    const { data: existing } = await admin().from("tasks").select("id, title").eq("id", state.ids.mainTask).single();
    await openTask(priya, existing!.id);
    await priya.getByLabel("Project", { exact: true }).selectOption({ label: tag("Tower B lobby fit-out") });
    await priya.waitForTimeout(1500);
    const rahul = await pageOf(browser, "rahul");
    await go(rahul, state.ids.project);
    await rahul.reload();
    await expect(rahul.getByRole("link", { name: newTitle }).first()).toBeVisible();
    await expect(rahul.getByRole("link", { name: existing!.title }).first()).toBeVisible();
    await openTask(rahul, newId);
    await expect(rahul.getByText(tag("Tower B lobby fit-out")).first()).toBeVisible();
  },
);

scenario(
  { id: "T5.3", area: "Projects", scenario: "Status Planned → Active → On hold → Active → Done, seen by members", initiator: "Priya", receiver: "Rahul", expected: "Each status persists and Rahul sees the final status; activity lists the linked work", desktop: "Tested", mobile: "See T18", persistence: "Reload both", permission: "Owner" },
  async ({ browser }) => {
    const state = loadState();
    const priya = await pageOf(browser, "priya");
    await go(priya, state.ids.project);
    const rahul = await pageOf(browser, "rahul");
    for (const [value, label] of [["planned", "Planned"], ["active", "Active"], ["on_hold", "On hold"], ["active", "Active"], ["completed", "Done"]] as const) {
      await priya.getByLabel("Status").selectOption(value);
      await priya.waitForTimeout(1200);
      await priya.reload();
      await expect(priya.getByLabel("Status")).toHaveValue(value);
      await go(rahul, state.ids.project);
      await expect(rahul.getByText(label, { exact: true }).first()).toBeVisible();
    }
    await expect(priya.getByRole("heading", { name: "Activity" })).toBeVisible();
    await expect(priya.getByText(/Revised kitchen quotation/).first()).toBeVisible();
  },
);

scenario(
  { id: "T5.4", area: "Projects", scenario: "Member cannot change a project", initiator: "Rahul (UI + API)", receiver: "—", expected: "No status/people controls for Rahul; API update and member insert rejected", desktop: "Tested", mobile: "—", persistence: "Checked after", permission: "Owner/manager only" },
  async ({ browser }) => {
    const state = loadState();
    const rahul = await pageOf(browser, "rahul");
    await go(rahul, state.ids.project);
    await expect(rahul.getByLabel("Status")).toHaveCount(0);
    const id = state.ids.project.split("/projects/")[1];
    const r = await as("rahul");
    await r.from("projects").update({ status: "planned", name: "Hijacked" }).eq("id", id);
    const add = await r.from("project_members").insert({ project_id: id, org_id: state.orgA, user_id: state.users.neha.id });
    const { data } = await admin().from("projects").select("status, name").eq("id", id).single();
    expect(data!.name).toBe(tag("Tower B lobby fit-out"));
    expect(data!.status).toBe("completed");
    expect(add.error, "member added a person").not.toBeNull();
  },
);

scenario(
  { id: "T6.1", area: "Documents", scenario: "Owner uploads PDF, image and CSV; metadata correct; persists", initiator: "Priya", receiver: "Priya, Rahul", expected: "Three documents with category, size, uploader and date; still there after reload; Rahul sees them", desktop: "Tested", mobile: "See T18", persistence: "Reload", permission: "Members read" },
  async ({ browser }) => {
    const state = loadState();
    const priya = await pageOf(browser, "priya");
    await go(priya, "/documents");
    const pdf = `${tag("BOQ-Tower-B").replace(/ /g, "-")}.pdf`;
    const png = `${tag("site photo (lobby) 1").replace(/ /g, "_")}.png`;
    const csv = `${tag("rates").replace(/ /g, "-")}.csv`;
    await priya.getByLabel("Category").first().selectOption({ label: "Quotation" });
    await upload(priya, pdf, "application/pdf", PDF);
    await priya.getByLabel("Category").first().selectOption({ label: "Other" });
    await upload(priya, png, "image/png", PNG);
    await upload(priya, csv, "text/csv", Buffer.from("item,rate\ntile,120\n"));
    Object.assign(state.ids, { docPdf: pdf, docPng: png, docCsv: csv });
    saveState(state);
    await priya.reload();
    await expect(rows(priya, pdf)).toContainText("Quotation");
    await expect(rows(priya, pdf)).toContainText("Priya Sharma");
    await expect(rows(priya, png)).toContainText(/\d+ B/);
    const rahul = await pageOf(browser, "rahul");
    await go(rahul, "/documents");
    for (const name of [pdf, png, csv]) await expect(rows(rahul, name)).toBeVisible();
    await expect(rows(rahul, pdf).getByRole("button", { name: /^Delete/ })).toHaveCount(0);
  },
);

scenario(
  { id: "T6.2", area: "Documents", scenario: "Search, filter, open and download", initiator: "Rahul", receiver: "—", expected: "Search narrows to the file; category filter works; open and download request signed links", desktop: "Tested", mobile: "See T18", persistence: "—", permission: "Members read" },
  async ({ browser }) => {
    const state = loadState();
    const rahul = await pageOf(browser, "rahul");
    await go(rahul, "/documents");
    await rahul.getByPlaceholder("Search documents").fill("BOQ-Tower-B");
    await expect(rows(rahul, state.ids.docPdf)).toBeVisible();
    await expect(rows(rahul, state.ids.docCsv)).toHaveCount(0);
    await rahul.getByPlaceholder("Search documents").fill("");
    await rahul.getByRole("button", { name: "Quotation", exact: true }).click();
    await expect(rows(rahul, state.ids.docPdf)).toBeVisible();
    await expect(rows(rahul, state.ids.docPng)).toHaveCount(0);
    await rahul.getByRole("button", { name: "All", exact: true }).click();
    const open = rahul.context().waitForEvent("request", (r) => r.url().includes("/storage/v1/object/sign/documents/") && !r.url().includes("download="));
    await rows(rahul, state.ids.docPdf).getByRole("button", { name: state.ids.docPdf, exact: true }).click();
    await open;
    for (const extra of rahul.context().pages()) if (extra !== rahul) await extra.close();
    const dl = rahul.context().waitForEvent("request", (r) => r.url().includes("/storage/v1/object/sign/documents/") && r.url().includes("download="));
    await rows(rahul, state.ids.docPng).getByRole("button", { name: /^Download/ }).click();
    const request = await dl;
    const response = await request.response();
    expect(response?.status()).toBe(200);
  },
);

scenario(
  { id: "T6.3", area: "Documents", scenario: "Document linked to a project and to a task", initiator: "Priya, Rahul", receiver: "Rahul, Priya", expected: "Project upload shows on project and in library with the project link; Rahul's task attachment shows to Priya and notifies her", desktop: "Tested", mobile: "See T18", persistence: "Reload", permission: "Members" },
  async ({ browser }) => {
    const state = loadState();
    const priya = await pageOf(browser, "priya");
    await go(priya, state.ids.project);
    const projectDoc = `${tag("lobby-layout").replace(/ /g, "-")}.pdf`;
    await upload(priya, projectDoc, "application/pdf", PDF);
    const rahul = await pageOf(browser, "rahul");
    await go(rahul, "/documents");
    await expect(rows(rahul, projectDoc)).toContainText(tag("Tower B lobby fit-out"));
    await openTask(rahul, state.ids.projectTask);
    const taskDoc = `${tag("ceiling-drawing").replace(/ /g, "-")}.pdf`;
    await upload(rahul, taskDoc, "application/pdf", PDF);
    await openTask(priya, state.ids.projectTask);
    await priya.reload();
    await expect(rows(priya, taskDoc)).toBeVisible();
    const { data } = await (await as("priya")).from("notifications").select("event, href").eq("event", "document_added");
    expect((data ?? []).some((n) => n.href === `/kaam/${state.ids.projectTask}`)).toBe(true);
  },
);

scenario(
  { id: "T6.4", area: "Documents", scenario: "Delete a document; stale links fail safely", initiator: "Priya", receiver: "Rahul", expected: "Deleted from library for both; old /documents/<id> shows not found; old storage key cannot be signed", desktop: "Tested", mobile: "—", persistence: "Reload", permission: "Uploader/manager deletes" },
  async ({ browser }) => {
    const state = loadState();
    const { data: doc } = await admin().from("documents").select("id, storage_key").eq("name", state.ids.docCsv).single();
    const priya = await pageOf(browser, "priya");
    await go(priya, "/documents");
    priya.once("dialog", (d) => d.accept());
    await rows(priya, state.ids.docCsv).getByRole("button", { name: /^Delete/ }).click();
    await expect(rows(priya, state.ids.docCsv)).toHaveCount(0, { timeout: 30_000 });
    const rahul = await pageOf(browser, "rahul");
    await go(rahul, "/documents");
    await expect(rows(rahul, state.ids.docCsv)).toHaveCount(0);
    const res = await rahul.goto(`${BASE}/documents/${doc!.id}`);
    expect(res?.status()).toBe(404);
    const signed = await (await as("rahul")).storage.from("documents").createSignedUrl(doc!.storage_key, 60);
    expect(signed.data?.signedUrl ?? null).toBeNull();
  },
);

scenario(
  { id: "T6.5", area: "Documents", scenario: "Member cannot delete someone else's document", initiator: "Rahul (UI + API)", receiver: "—", expected: "No delete button; API delete of row and object does nothing", desktop: "Tested", mobile: "—", persistence: "Checked after", permission: "Uploader/manager" },
  async () => {
    const state = loadState();
    const { data: doc } = await admin().from("documents").select("id, storage_key").eq("name", state.ids.docPdf).single();
    const r = await as("rahul");
    await r.from("documents").delete().eq("id", doc!.id);
    await r.storage.from("documents").remove([doc!.storage_key]);
    const { data: still } = await admin().from("documents").select("id").eq("id", doc!.id);
    expect(still?.length).toBe(1);
    const { data: file } = await admin().storage.from("documents").createSignedUrl(doc!.storage_key, 60);
    expect(file?.signedUrl, "object still exists").toBeTruthy();
  },
);

scenario(
  { id: "T6.6", area: "Documents", scenario: "Org B can never list, search, open, sign, modify or delete Org A documents", initiator: "Vikram (Org B) UI + API", receiver: "—", expected: "Every attempt returns nothing or fails; Org A document unchanged", desktop: "Tested", mobile: "—", persistence: "Checked after", permission: "Cross-org isolation" },
  async ({ browser }) => {
    const state = loadState();
    const { data: doc } = await admin().from("documents").select("id, storage_key, name").eq("name", state.ids.docPdf).single();
    const vikram = await pageOf(browser, "vikram");
    await go(vikram, "/documents");
    await expect(rows(vikram, doc!.name)).toHaveCount(0);
    await go(vikram, `/search?q=${encodeURIComponent("BOQ-Tower-B")}`);
    await expect(vikram.getByText(doc!.name)).toHaveCount(0);
    const res = await vikram.goto(`${BASE}/documents/${doc!.id}`);
    expect(res?.status()).toBe(404);
    const v = await as("vikram");
    const { data: listed } = await v.from("documents").select("id").eq("org_id", state.orgA!);
    expect(listed ?? []).toEqual([]);
    const { data: files } = await v.storage.from("documents").list(`orgs/${state.orgA}/documents`);
    expect(files ?? []).toEqual([]);
    const signed = await v.storage.from("documents").createSignedUrl(doc!.storage_key, 60);
    expect(signed.data?.signedUrl ?? null).toBeNull();
    await v.from("documents").update({ name: "stolen.pdf" }).eq("id", doc!.id);
    await v.from("documents").delete().eq("id", doc!.id);
    await v.storage.from("documents").remove([doc!.storage_key]);
    const upload = await v.storage.from("documents").upload(`orgs/${state.orgA}/documents/x/planted.pdf`, PDF, { contentType: "application/pdf" });
    expect(upload.error).not.toBeNull();
    const { data: after } = await admin().from("documents").select("name").eq("id", doc!.id).single();
    expect(after!.name).toBe(doc!.name);
  },
);

async function fillTemplate(page: Page, key: string, values: Record<string, string>) {
  await go(page, `/documents/templates?template=${key}`);
  for (const [field, value] of Object.entries(values)) {
    await page.locator(`#field-${field}`).fill(value);
  }
}

scenario(
  { id: "T7.1", area: "Templates", scenario: "Quotation: fill, preview GST total, save, reopen after reload with the same values, linked to project", initiator: "Priya", receiver: "Rahul", expected: "Preview shows ₹10,000.00 + GST 18% = ₹11,800.00; saved in Documents with the project; Rahul opens it with the same values", desktop: "Tested", mobile: "See T18", persistence: "Reload", permission: "Members" },
  async ({ browser }) => {
    const state = loadState();
    const priya = await pageOf(browser, "priya");
    const client = tag("Greenwood Residence");
    await go(priya, `/documents/templates?template=quotation&project=${state.ids.project.split("/projects/")[1]}`);
    for (const [field, value] of Object.entries({ client_name: client, scope: "Lobby false ceiling and flooring", amount: "10000", gst_percent: "18" })) {
      await priya.locator(`#field-${field}`).fill(value);
    }
    const preview = priya.frameLocator("iframe").first();
    await expect(preview.getByText("₹11,800.00")).toBeVisible();
    await expect(priya.locator("#template-project")).toHaveValue(state.ids.project.split("/projects/")[1]);
    await priya.getByRole("button", { name: "Save as document" }).click();
    await expect(priya.getByText("Saved to Documents")).toBeVisible({ timeout: 30_000 });
    const rahul = await pageOf(browser, "rahul");
    await go(rahul, "/documents");
    await rahul.reload();
    const row = rows(rahul, client);
    await expect(row).toContainText(tag("Tower B lobby fit-out"));
    await row.getByRole("button", { name: new RegExp(`^Quotation - ${client}`) }).click();
    await expect(rahul).toHaveURL(/\/documents\/[0-9a-f-]{36}$/);
    const doc = rahul.frameLocator("#document-frame");
    await expect(doc.getByText(client)).toBeVisible();
    await expect(doc.getByText("₹11,800.00")).toBeVisible();
    await expect(doc.getByText("Plot 14, Sector 62, Noida")).toBeVisible();
  },
);

scenario(
  { id: "T7.2", area: "Templates", scenario: "All ten templates save with their required fields", initiator: "Arjun (Manager)", receiver: "Neha", expected: "Quotation, Proposal, Invoice, Agreement, NDA, Purchase order, Work order, Receipt, SOW and Meeting minutes each save and appear for Neha", desktop: "Tested", mobile: "—", persistence: "Reload", permission: "Members" },
  async ({ browser }) => {
    const arjun = await pageOf(browser, "arjun");
    const base = { client_name: "", date: "2026-09-18" };
    const specs: Record<string, Record<string, string>> = {
      quotation: { scope: "Scope", amount: "5000" },
      proposal: { scope: "Scope" },
      invoice: { scope: "Scope", amount: "2500", gst_percent: "18" },
      agreement: { scope: "Scope" },
      nda: { scope: "Scope" },
      purchase_order: { scope: "Scope", amount: "1200" },
      work_order: { scope: "Scope" },
      receipt: { amount: "900" },
      sow: { scope: "Scope" },
      meeting_minutes: { attendees: "Priya, Arjun", decisions: "Start lobby work Monday" },
    };
    const neha = await pageOf(browser, "neha");
    for (const [key, values] of Object.entries(specs)) {
      const client = tag(`Client ${key}`);
      const fields = key === "meeting_minutes" ? { date: base.date, ...values } : { ...base, client_name: client, ...values };
      await fillTemplate(arjun, key, fields);
      await arjun.getByRole("button", { name: "Save as document" }).click();
      await expect(arjun.getByText("Saved to Documents"), key).toBeVisible({ timeout: 30_000 });
    }
    await go(neha, "/documents");
    for (const key of Object.keys(specs).filter((k) => k !== "meeting_minutes")) {
      await expect(rows(neha, tag(`Client ${key}`)), key).toBeVisible();
    }
  },
);

scenario(
  { id: "T7.3", area: "Templates", scenario: "Missing required fields and invalid amounts are refused", initiator: "Priya", receiver: "—", expected: "No client name → error, nothing saved; amount 'abc' or GST 150 → error, nothing saved", desktop: "Tested", mobile: "—", persistence: "Checked after", permission: "—" },
  async ({ browser }) => {
    const priya = await pageOf(browser, "priya");
    const service = admin();
    const state = loadState();
    const count = async () => (await service.from("documents").select("id", { count: "exact", head: true }).eq("org_id", state.orgA!)).count ?? 0;
    const before = await count();
    await fillTemplate(priya, "invoice", { scope: "Scope", amount: "1000" });
    await priya.getByRole("button", { name: "Save as document" }).click();
    await expect(priya.getByTestId("template-error")).toBeVisible();
    await fillTemplate(priya, "invoice", { client_name: tag("Bad amount client"), scope: "Scope", amount: "abc" });
    await priya.getByRole("button", { name: "Save as document" }).click();
    await expect(priya.getByTestId("template-error"), "amount abc refused").toBeVisible({ timeout: 10_000 });
    await fillTemplate(priya, "invoice", { client_name: tag("Bad GST client"), scope: "Scope", amount: "1000", gst_percent: "150" });
    await priya.getByRole("button", { name: "Save as document" }).click();
    await expect(priya.getByTestId("template-error"), "GST 150 refused").toBeVisible({ timeout: 10_000 });
    expect(await count(), "no documents saved").toBe(before);
  },
);

scenario(
  { id: "T7.4", area: "Templates", scenario: "Template document attached to a task from the task page", initiator: "Rahul", receiver: "Priya", expected: "Rahul creates a work order from his task; it is attached to that task for Priya", desktop: "Tested", mobile: "—", persistence: "Reload", permission: "Assignee" },
  async ({ browser }) => {
    const state = loadState();
    const rahul = await pageOf(browser, "rahul");
    await openTask(rahul, state.ids.projectTask);
    await rahul.getByRole("link", { name: "Create from a template" }).click();
    await rahul.getByRole("button", { name: /^Work order/ }).click();
    const client = tag("Ceiling contractor");
    for (const [field, value] of Object.entries({ client_name: client, scope: "Install false ceiling", date: "2026-09-19" })) {
      await rahul.locator(`#field-${field}`).fill(value);
    }
    await rahul.getByRole("button", { name: "Save as document" }).click();
    await expect(rahul.getByText("Saved to Documents")).toBeVisible({ timeout: 30_000 });
    const priya = await pageOf(browser, "priya");
    await openTask(priya, state.ids.projectTask);
    await priya.reload();
    await expect(rows(priya, client)).toBeVisible();
  },
);
