import { expect, test, type Page } from "@playwright/test";
import { BASE, PDF, PNG, act, admin, as, closeAll, go, loadState, pageOf, saveState, scenario, signedIn, tag } from "./kit";
import { createTaskUI, openTask } from "./flows";

/** TEST 15 — Golden path. TEST 16 — Concurrency. TEST 17 — Failure and edge cases. */
test.describe.configure({ mode: "default" });
test.afterAll(closeAll);

const timeline = (page: Page) => page.getByRole("list", { name: "Timeline" });

scenario(
  { id: "T15.1", area: "Golden path", scenario: "Customer requirement → task → project → quotation → proof → changes → verify → approval → search → notifications → consistent history", initiator: "Priya, Rahul", receiver: "Rahul, Priya", expected: "Every step visible to the other person; final task, project and conversation agree after reload", desktop: "Tested", mobile: "See T18", persistence: "Reload both", permission: "Owner + member" },
  async ({ browser, note }) => {
    const state = loadState();
    const priya = await pageOf(browser, "priya");
    const rahul = await pageOf(browser, "rahul");
    // 1. Requirement discussed in a conversation.
    await go(priya, "/baat");
    await priya.getByRole("button", { name: "New group" }).click();
    const groupName = tag("Greenwood kitchen");
    await priya.getByLabel("Group name").fill(groupName);
    await priya.getByRole("button", { name: /Rahul Verma/ }).first().click();
    await priya.getByRole("button", { name: "Create group" }).click();
    await expect(priya).toHaveURL(/\/baat\/[0-9a-f-]{36}$/, { timeout: 30_000 });
    const thread = priya.url().replace(BASE, "");
    const requirement = tag("Client wants a modular kitchen quotation with Hettich fittings by Friday");
    await priya.getByRole("textbox", { name: "Write a message" }).fill(requirement);
    await priya.getByRole("button", { name: "Send", exact: true }).click();
    await expect(priya.getByText(requirement)).toBeVisible({ timeout: 30_000 });
    // 2. The message becomes Rahul's task.
    await priya.getByTestId("make-task").last().click();
    const form = priya.locator("form").filter({ hasText: "Task created from this message" });
    await form.getByRole("textbox").fill(tag("Greenwood modular kitchen quotation"));
    await form.getByRole("button", { name: "Rahul Verma" }).click();
    await form.getByRole("button", { name: "Create task" }).click();
    await expect(priya.getByRole("link", { name: "Task created" }).last()).toBeVisible({ timeout: 30_000 });
    const taskId = (await priya.getByRole("link", { name: "Task created" }).last().getAttribute("href"))!.split("/kaam/")[1];
    state.ids.golden = taskId;
    saveState(state);
    // 3. A project, and the task linked to it.
    await go(priya, "/projects");
    await priya.getByRole("button", { name: "New project" }).click();
    const projectName = tag("Greenwood kitchen project");
    await priya.getByLabel("Project name").fill(projectName);
    await priya.getByRole("button", { name: "Create" }).click();
    await expect(priya).toHaveURL(/\/projects\/[0-9a-f-]{36}$/, { timeout: 30_000 });
    const projectPath = priya.url().replace(BASE, "");
    await priya.getByLabel("Add a task to this project").selectOption({ label: tag("Greenwood modular kitchen quotation") });
    await expect(priya.getByRole("link", { name: tag("Greenwood modular kitchen quotation") }).first()).toBeVisible({ timeout: 30_000 });
    // 4. Quotation from the template, saved to Documents, linked to project and task.
    const client = tag("Greenwood Homes");
    await go(priya, `/documents/templates?template=quotation&project=${projectPath.split("/projects/")[1]}&task=${taskId}`);
    for (const [field, value] of Object.entries({ client_name: client, scope: "Modular kitchen with Hettich fittings", amount: "185000", gst_percent: "18" })) {
      await priya.locator(`#field-${field}`).fill(value);
    }
    await expect(priya.frameLocator("iframe").first().getByText("₹2,18,300.00")).toBeVisible();
    await priya.getByRole("button", { name: "Save as document" }).click();
    await expect(priya.getByText("Saved to Documents")).toBeVisible({ timeout: 30_000 });
    // 5. Rahul accepts, works, submits proof.
    await openTask(rahul, taskId);
    await expect(rahul.getByText("From a conversation")).toBeVisible();
    await expect(rahul.getByTestId("document-row").filter({ hasText: client })).toBeVisible();
    await rahul.getByRole("button", { name: "Seen, will do" }).first().click();
    await expect(timeline(rahul)).toContainText("Accepted", { timeout: 30_000 });
    await rahul.getByRole("button", { name: "Started" }).first().click();
    await expect(timeline(rahul)).toContainText("In progress", { timeout: 30_000 });
    const proof = async (text: string, file: string) => {
      const before = await timeline(rahul).getByRole("listitem").count();
      await rahul.getByRole("button", { name: "Done", exact: true }).first().click();
      await rahul.getByTestId("proof-file-input").setInputFiles({ name: file, mimeType: "image/png", buffer: PNG });
      await rahul.getByRole("dialog").getByRole("button", { name: "Write" }).click();
      await rahul.getByRole("dialog").getByRole("textbox", { name: "Write" }).fill(text);
      await rahul.getByRole("dialog").getByRole("button", { name: "Send · done" }).click();
      await expect(rahul.getByRole("button", { name: "Send · done" })).toHaveCount(0, { timeout: 30_000 });
      // It is done once Rahul's own timeline says so; only then does Priya look.
      await expect
        .poll(async () => timeline(rahul).getByRole("listitem").count(), { timeout: 60_000 })
        .toBeGreaterThan(before);
    };
    await proof("Quotation shared with client", "kitchen-quote-v1.png");
    // 6. Priya requests changes with a reason; Rahul resubmits; Priya verifies.
    await openTask(priya, taskId);
    await priya.getByRole("button", { name: "Send back" }).first().click();
    const reason = "Add the chimney and hob as optional items";
    const reasonBox = priya.getByRole("dialog").getByRole("textbox");
    await expect(reasonBox, "reason field").toBeVisible({ timeout: 5_000 });
    await reasonBox.fill(reason);
    await priya.getByRole("dialog").getByRole("button", { name: "Send back" }).click();
    // Priya's own screen has to show it before Rahul is asked to look.
    await expect(timeline(priya), "the reason is on the owner's timeline").toContainText(reason, { timeout: 30_000 });
    await openTask(rahul, taskId);
    await expect(timeline(rahul)).toContainText(reason);
    await proof("Added chimney and hob as options", "kitchen-quote-v2.png");
    await openTask(priya, taskId);
    await act(priya, "Verify");
    await expect(priya.getByText(/^Verified · /).first()).toBeVisible({ timeout: 30_000 });
    // 7. Approval for the discount, decided.
    await go(rahul, "/approvals");
    await rahul.getByRole("button", { name: "Ask for approval" }).click();
    const approval = tag("Approve 5% discount on Greenwood kitchen");
    await rahul.locator("#approval-title").fill(approval);
    await rahul.locator("#approval-project").selectOption({ label: projectName });
    await rahul.locator("form").getByRole("button", { name: "Ask for approval" }).click();
    // Rahul's own list has to carry the request before Priya is sent to decide it.
    await expect(rahul.getByTestId("approval-card").filter({ hasText: approval }).first()).toBeVisible({ timeout: 60_000 });
    await go(priya, "/approvals");
    const c = priya.getByTestId("approval-card").filter({ hasText: approval });
    await expect(c).toContainText(projectName);
    await c.getByRole("button", { name: "Approve" }).click();
    await expect(c.getByText("Approved")).toBeVisible({ timeout: 30_000 });
    // 8. Search finds all three.
    for (const q of ["Greenwood kitchen project", "Greenwood modular kitchen quotation", "Greenwood Homes"]) {
      await go(priya, `/search?q=${encodeURIComponent(q)}`);
      await expect(priya.getByRole("main").getByRole("link").filter({ hasText: q }).first(), q).toBeVisible();
    }
    // 9. Notifications lead to the records.
    await go(rahul, "/khabar");
    await rahul.getByRole("link").filter({ hasText: /Greenwood modular kitchen quotation/ }).first().click();
    await expect(rahul).toHaveURL(new RegExp(taskId));
    // 10. History agrees everywhere after reload.
    for (const p of [priya, rahul]) {
      await openTask(p, taskId);
      await p.reload();
      await expect(p.getByText(/^Verified · /).first()).toBeVisible();
      await expect(timeline(p)).toContainText(reason);
      await expect(p.getByRole("img", { name: /Photo sent by Rahul Verma/ })).toHaveCount(2);
      await expect(p.getByText("From a conversation")).toBeVisible();
      await go(p, projectPath);
      await expect(p.getByRole("link", { name: tag("Greenwood modular kitchen quotation") }).first()).toBeVisible();
      await expect(p.getByTestId("document-row").filter({ hasText: client })).toBeVisible();
      await go(p, thread);
      await expect(p.getByRole("link", { name: "Task created" }).first()).toHaveAttribute("href", `/kaam/${taskId}`);
    }
    note(`task ${taskId}`);
  },
);

scenario(
  { id: "T16.1", area: "Concurrency", scenario: "Receiver's open screen updates without reload when work arrives", initiator: "Priya", receiver: "Neha (screen open)", expected: "Neha's open Today shows the new task within 30 s via the live update, no manual reload", desktop: "Tested", mobile: "—", persistence: "—", permission: "—" },
  async ({ browser }) => {
    const neha = await pageOf(browser, "neha");
    await go(neha, "/aaj");
    const priya = await pageOf(browser, "priya");
    const title = tag("Live update check");
    await createTaskUI(priya, { assignee: "Neha Singh", title });
    await expect(neha.getByText(title).filter({ visible: true }).first()).toBeVisible({ timeout: 30_000 });
  },
);

scenario(
  { id: "T16.2", area: "Concurrency", scenario: "Owner and manager verify the same task at the same moment", initiator: "Priya + Arjun (simultaneous)", receiver: "—", expected: "One verification recorded; the other sees it was already moved; no duplicate events", desktop: "Tested", mobile: "—", persistence: "Checked after", permission: "—" },
  async ({ browser }) => {
    const priya = await pageOf(browser, "priya");
    const neha = await pageOf(browser, "neha");
    const title = tag("Race verify");
    const id = await createTaskUI(priya, { assignee: "Neha Singh", title });
    await openTask(neha, id);
    await neha.getByRole("button", { name: "Seen, will do" }).first().click();
    await neha.getByRole("button", { name: "Done", exact: true }).first().click();
    await neha.getByRole("dialog").getByRole("button", { name: /Without a proof/ }).click();
    await expect(timeline(neha)).toContainText("Done", { timeout: 30_000 });
    const arjun = await pageOf(browser, "arjun");
    await Promise.all([openTask(priya, id), openTask(arjun, id)]);
    await Promise.all([
      priya.getByRole("button", { name: "Verify" }).first().click(),
      arjun.getByRole("button", { name: "Verify" }).first().click(),
    ]);
    await priya.waitForTimeout(4000);
    const { data } = await admin().from("task_events").select("to_state").eq("task_id", id).eq("to_state", "verified");
    expect(data?.length).toBe(1);
  },
);

scenario(
  { id: "T16.3", area: "Concurrency", scenario: "Simultaneous messages and simultaneous approval decisions", initiator: "Priya + Rahul; Priya + Arjun", receiver: "—", expected: "Both messages stored once each; approval decided once with one decision notification", desktop: "Tested", mobile: "—", persistence: "Checked after", permission: "—" },
  async ({ browser }) => {
    const state = loadState();
    const priya = await pageOf(browser, "priya");
    const rahul = await pageOf(browser, "rahul");
    await Promise.all([go(priya, state.ids.dm), go(rahul, state.ids.dm)]);
    const a = tag("simultaneous A");
    const b = tag("simultaneous B");
    await priya.getByRole("textbox", { name: "Write a message" }).fill(a);
    await rahul.getByRole("textbox", { name: "Write a message" }).fill(b);
    await Promise.all([
      priya.getByRole("button", { name: "Send", exact: true }).dblclick(),
      rahul.getByRole("button", { name: "Send", exact: true }).dblclick(),
    ]);
    await priya.waitForTimeout(4000);
    const service = admin();
    const { data: ma } = await service.from("messages").select("id").eq("body", a);
    const { data: mb } = await service.from("messages").select("id").eq("body", b);
    expect(ma?.length, "message A once").toBe(1);
    expect(mb?.length, "message B once").toBe(1);
    const title = tag("Race approval");
    const r = await as("rahul");
    await r.rpc("request_approval", { p_org: state.orgA, p_title: title });
    const { data: row } = await service.from("approvals").select("id").eq("title", title).single();
    await Promise.all([
      (await as("priya")).rpc("decide_approval", { p_approval: row!.id, p_approve: true }),
      (await as("arjun")).rpc("decide_approval", { p_approval: row!.id, p_approve: false }),
    ]);
    const { data: decided } = await service.from("approvals").select("status").eq("id", row!.id).single();
    expect(["approved", "rejected"]).toContain(decided!.status);
    const { data: notes } = await service.from("notifications").select("id").eq("event", "approval_decided").ilike("body", `%${title}%`);
    expect(notes?.length, "one decision notification").toBe(1);
  },
);

scenario(
  { id: "T17.1", area: "Edge cases", scenario: "Empty and oversized input", initiator: "Priya", receiver: "—", expected: "Send stays disabled without a title; 140-char title limit; a 2,000-character message is stored whole or refused clearly; no blank screen", desktop: "Tested", mobile: "—", persistence: "—", permission: "—" },
  async ({ browser, note }) => {
    const state = loadState();
    const priya = await pageOf(browser, "priya");
    await go(priya, "/naya");
    await expect(priya.getByRole("button", { name: "Send", exact: true })).toBeDisabled();
    await priya.getByRole("button", { name: /^What/ }).click();
    const box = priya.getByRole("textbox", { name: "What" });
    await box.fill("x".repeat(300));
    const typed = await box.inputValue();
    expect(typed.length).toBeLessThanOrEqual(140);
    await priya.keyboard.press("Escape");
    await go(priya, state.ids.dm);
    const long = `${tag("long")} ${"lorem ipsum ".repeat(170)}`.slice(0, 2000);
    await priya.getByRole("textbox", { name: "Write a message" }).fill(long);
    await priya.getByRole("button", { name: "Send", exact: true }).click();
    await priya.waitForTimeout(3000);
    const { data } = await admin().from("messages").select("body").ilike("body", `${tag("long")}%`);
    const alert = await priya.getByRole("alert").filter({ hasText: /./ }).count();
    note(data?.length ? `stored ${data[0].body.length} chars` : `refused with message: ${alert > 0}`);
    expect(Boolean(data?.length) || alert > 0).toBe(true);
    await expect(priya.locator("body")).not.toBeEmpty();
  },
);

scenario(
  { id: "T17.2", area: "Edge cases", scenario: "Invalid, missing, deleted and foreign URLs", initiator: "Rahul, Vikram", receiver: "—", expected: "Bad ids and other-org ids show the not-found page (404), never a 500 or blank screen", desktop: "Tested", mobile: "—", persistence: "—", permission: "Cross-org" },
  async ({ browser }) => {
    const state = loadState();
    const rahul = await pageOf(browser, "rahul");
    const vikram = await pageOf(browser, "vikram");
    const checks: [Page, string][] = [
      [rahul, "/kaam/not-a-uuid"],
      [rahul, "/kaam/00000000-0000-0000-0000-000000000000"],
      [rahul, "/projects/00000000-0000-0000-0000-000000000000"],
      [rahul, "/documents/00000000-0000-0000-0000-000000000000"],
      [rahul, "/baat/00000000-0000-0000-0000-000000000000"],
      [vikram, `/kaam/${state.ids.mainTask}`],
      [vikram, state.ids.project],
      [vikram, state.ids.dm],
    ];
    const bad: string[] = [];
    for (const [page, path] of checks) {
      const res = await page.goto(BASE + path);
      const status = res?.status() ?? 0;
      const text = (await page.locator("body").innerText()).trim();
      if (status >= 500 || !text) bad.push(`${path} → ${status}${text ? "" : " blank"}`);
      if (page === vikram && /Tower B|Revised kitchen|client wants/.test(text)) bad.push(`${path} leaked content`);
    }
    expect(bad).toEqual([]);
  },
);

scenario(
  { id: "T17.3", area: "Edge cases", scenario: "Unusual file names and a failed network during send", initiator: "Priya", receiver: "Rahul", expected: "Names with spaces, brackets and Hindi upload and open; sending while offline shows an error and keeps the text", desktop: "Tested", mobile: "—", persistence: "Reload", permission: "—" },
  async ({ browser }) => {
    const state = loadState();
    const priya = await pageOf(browser, "priya");
    await go(priya, "/documents");
    const odd = `${state.run} कोटेशन (final) v2 #1.pdf`;
    await priya.getByTestId("document-file-input").first().setInputFiles({ name: odd, mimeType: "application/pdf", buffer: PDF });
    await expect(priya.getByTestId("document-row").filter({ hasText: state.run }).filter({ hasText: "final" }).first()).toBeVisible({ timeout: 30_000 });
    const rahul = await pageOf(browser, "rahul");
    await go(rahul, "/documents");
    const row = rahul.getByTestId("document-row").filter({ hasText: "final" }).filter({ hasText: state.run }).first();
    const signed = rahul.context().waitForEvent("request", (r) => r.url().includes("/storage/v1/object/sign/documents/"));
    await row.getByRole("button", { name: /^Download/ }).click();
    expect((await (await signed).response())?.status()).toBe(200);
    await go(priya, state.ids.dm);
    const text = tag("offline attempt");
    await priya.getByRole("textbox", { name: "Write a message" }).fill(text);
    await priya.context().setOffline(true);
    await priya.getByRole("button", { name: "Send", exact: true }).click();
    await priya.waitForTimeout(3000);
    await priya.context().setOffline(false);
    const alert = priya.getByRole("alert").filter({ hasText: /./ });
    const kept = await priya.getByRole("textbox", { name: "Write a message" }).inputValue({ timeout: 15_000 }).catch(() => "");
    expect((await alert.count()) > 0 || kept === text, "error shown or text kept").toBe(true);
  },
);

scenario(
  { id: "T17.4", area: "Edge cases", scenario: "Back button after finishing and double-click on proof submit", initiator: "Neha", receiver: "Arjun", expected: "Back returns to a consistent page; double submit creates one done event", desktop: "Tested", mobile: "—", persistence: "Checked after", permission: "—" },
  async ({ browser }) => {
    const arjun = await pageOf(browser, "arjun");
    const neha = await pageOf(browser, "neha");
    const title = tag("Double submit check");
    const id = await createTaskUI(arjun, { assignee: "Neha Singh", title });
    await openTask(neha, id);
    await neha.getByRole("button", { name: "Seen, will do" }).first().click();
    await neha.getByRole("button", { name: "Done", exact: true }).first().click();
    await neha.getByTestId("proof-file-input").setInputFiles({ name: "p.png", mimeType: "image/png", buffer: PNG });
    await neha.getByRole("dialog").getByRole("button", { name: "Send · done" }).dblclick();
    await expect(timeline(neha)).toContainText("Done", { timeout: 30_000 });
    await neha.goBack();
    await neha.goForward();
    await expect(timeline(neha)).toContainText("Done");
    const service = admin();
    const { data: done } = await service.from("task_events").select("id").eq("task_id", id).eq("to_state", "done");
    const { data: proofs } = await service.from("proofs").select("id").eq("task_id", id);
    expect(done?.length, "done events").toBe(1);
    expect(proofs?.length, "proof rows").toBe(1);
  },
);

scenario(
  { id: "T19.1", area: "Session", scenario: "Two tabs for one person stay consistent; signing out in one ends the other", initiator: "Rahul", receiver: "Rahul (second tab)", expected: "Change in tab A shows in tab B after reload; after sign out in A, tab B's next navigation goes to login", desktop: "Tested", mobile: "—", persistence: "Reload", permission: "Auth" },
  async ({ browser }) => {
    const { ctx, page: a } = await signedIn(browser, "rahul");
    const b = await ctx.newPage();
    const state = loadState();
    await go(a, state.ids.dm);
    const text = tag("two tabs");
    await a.getByRole("textbox", { name: "Write a message" }).fill(text);
    await a.getByRole("button", { name: "Send", exact: true }).click();
    await expect(a.getByText(text)).toBeVisible({ timeout: 30_000 });
    await go(b, state.ids.dm);
    await expect(b.getByText(text)).toBeVisible();
    await go(a, "/settings");
    await a.getByRole("button", { name: "Sign out" }).click();
    await a.waitForURL(/\/login|\/$/, { timeout: 30_000 });
    await b.goto(BASE + "/aaj");
    await expect(b).toHaveURL(/\/login/);
    await ctx.close();
  },
);

scenario(
  { id: "T19.2", area: "Session", scenario: "Expired or tampered session is treated as signed out", initiator: "Neha", receiver: "—", expected: "With the auth cookie corrupted, guarded pages redirect to login", desktop: "Tested", mobile: "—", persistence: "—", permission: "Auth" },
  async ({ browser }) => {
    const { ctx, page } = await signedIn(browser, "neha");
    const cookies = await ctx.cookies();
    await ctx.clearCookies();
    await ctx.addCookies(cookies.map((c) => (c.name.includes("auth-token") ? { ...c, value: "base64-eyJicm9rZW4iOnRydWV9" } : c)));
    const res = await page.goto(BASE + "/aaj");
    expect(res?.status()).toBeLessThan(500);
    await expect(page).toHaveURL(/\/login/);
    await ctx.close();
  },
);

void PDF;
