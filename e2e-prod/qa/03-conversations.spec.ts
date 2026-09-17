import { expect, test, type Page } from "@playwright/test";
import { BASE, PDF, act, admin, as, closeAll, go, loadState, pageOf, saveState, scenario, tag, type Who } from "./kit";
import { openTask } from "./flows";

/** TEST 3 — Conversation → Task → Conversation. TEST 4 — Group conversation. */
test.describe.configure({ mode: "default" });
test.afterAll(closeAll);

async function send(page: Page, text: string) {
  await page.getByRole("textbox", { name: "Write a message" }).fill(text);
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByText(text).first()).toBeVisible({ timeout: 30_000 });
}

async function openThreadWith(page: Page, name: string) {
  await go(page, "/baat");
  const row = page.getByRole("link").filter({ hasText: name }).first();
  if (await row.count()) {
    await row.click();
  } else {
    await page.getByRole("button", { name: "New conversation" }).click();
    await page.getByRole("button", { name: new RegExp(name) }).first().click();
  }
  await expect(page).toHaveURL(/\/baat\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  return page.url().replace(BASE, "");
}

scenario(
  { id: "T3.1", area: "Conversations", scenario: "Direct message both ways", initiator: "Priya", receiver: "Rahul", expected: "Rahul sees Priya's message and replies; Priya sees the reply; both persist after reload", desktop: "Tested", mobile: "See T18", persistence: "Reload both", permission: "Participants" },
  async ({ browser }) => {
    const state = loadState();
    const priya = await pageOf(browser, "priya");
    const path = await openThreadWith(priya, "Rahul Verma");
    state.ids.dm = path;
    saveState(state);
    const ask = tag("Rahul, the client wants a revised BOQ for the Tower B kitchen");
    await send(priya, ask);
    const rahul = await pageOf(browser, "rahul");
    await go(rahul, "/baat");
    await expect(rahul.getByText(ask).first()).toBeVisible();
    await go(rahul, path);
    await expect(rahul.getByText(ask)).toBeVisible();
    const reply = tag("Understood, I will prepare it today");
    await send(rahul, reply);
    await priya.reload();
    await expect(priya.getByText(reply)).toBeVisible();
    await rahul.reload();
    await expect(rahul.getByText(ask)).toBeVisible();
    await expect(rahul.getByText(reply)).toBeVisible();
  },
);

scenario(
  { id: "T3.2", area: "Conversations", scenario: "Unread count clears after reading", initiator: "Priya", receiver: "Rahul", expected: "A new message shows unread for Rahul; after he opens the thread the unread badge and Today item clear", desktop: "Tested", mobile: "See T18", persistence: "Reload", permission: "—" },
  async ({ browser }) => {
    const path = loadState().ids.dm;
    const priya = await pageOf(browser, "priya");
    await go(priya, path);
    await send(priya, tag("One more thing on the BOQ"));
    const rahul = await pageOf(browser, "rahul");
    await go(rahul, "/baat");
    const row = rahul.getByRole("link", { name: /Priya Sharma/ }).first();
    await expect(row, "unread badge before reading").toContainText(/\d/);
    await row.click();
    await expect(rahul).toHaveURL(new RegExp(path));
    await go(rahul, "/baat");
    await rahul.reload();
    const after = (await rahul.getByRole("link", { name: /Priya Sharma/ }).first().innerText()).trim();
    expect(after, "no unread count after reading").not.toMatch(/\n\d+$/);
    await go(rahul, "/aaj");
    await expect(rahul.getByText(/unread conversation/).filter({ visible: true })).toHaveCount(0);
  },
);

scenario(
  { id: "T3.3", area: "Conversations", scenario: "File attachment is visible and opens for the receiver", initiator: "Priya", receiver: "Rahul", expected: "Rahul sees the attachment and gets a signed link to open it", desktop: "Tested", mobile: "See T18", persistence: "Reload", permission: "Participants" },
  async ({ browser }) => {
    const path = loadState().ids.dm;
    const priya = await pageOf(browser, "priya");
    await go(priya, path);
    const file = `${tag("site-measurements")}.pdf`.replace(/ /g, "-");
    await priya.getByTestId("thread-file-input").setInputFiles({ name: file, mimeType: "application/pdf", buffer: PDF });
    await expect(priya.getByRole("button", { name: file })).toBeVisible({ timeout: 30_000 });
    const rahul = await pageOf(browser, "rahul");
    await go(rahul, path);
    await rahul.reload();
    const signed = rahul.context().waitForEvent("request", (r) => r.url().includes("/storage/v1/object/sign/documents/"));
    await rahul.getByRole("button", { name: file }).click();
    await signed;
    for (const extra of rahul.context().pages()) if (extra !== rahul) await extra.close();
  },
);

scenario(
  { id: "T3.4", area: "Conversations", scenario: "Receiver turns the owner's message into his own task; links both ways", initiator: "Rahul", receiver: "Priya", expected: "Task created from Priya's message; task shows 'From a conversation'; message shows Task created; both links navigate; persists", desktop: "Tested", mobile: "See T18", persistence: "Reload both", permission: "Participant" },
  async ({ browser }) => {
    const state = loadState();
    const rahul = await pageOf(browser, "rahul");
    await go(rahul, state.ids.dm);
    const message = rahul.getByText(/client wants a revised BOQ/).first();
    await expect(message).toBeVisible();
    const makeTask = rahul.getByTestId("make-task").first();
    await makeTask.click();
    const form = rahul.locator("form").filter({ hasText: "Task created from this message" });
    await form.getByRole("button", { name: "Rahul Verma" }).click();
    await form.getByRole("button", { name: "Create task" }).click();
    const chip = rahul.getByRole("link", { name: "Task created" }).first();
    await expect(chip).toBeVisible({ timeout: 30_000 });
    await rahul.reload();
    await rahul.getByRole("link", { name: "Task created" }).first().click();
    await expect(rahul).toHaveURL(/\/kaam\/[0-9a-f-]{36}$/);
    const taskId = rahul.url().split("/kaam/")[1];
    state.ids.fromMessage = taskId;
    saveState(state);
    await expect(rahul.getByText("From a conversation")).toBeVisible();
    await rahul.getByRole("link", { name: /Open conversation/ }).click();
    await expect(rahul).toHaveURL(new RegExp(state.ids.dm));
    const priya = await pageOf(browser, "priya");
    await openTask(priya, taskId);
    await expect(priya.getByText("From a conversation")).toBeVisible();
    await go(priya, "/aaj");
    await expect(priya.getByText(/client wants a revised BOQ/).filter({ visible: true }).first()).toBeVisible();
  },
);

scenario(
  { id: "T3.5", area: "Conversations", scenario: "Task made from the owner's OWN message; completed and verified; link survives", initiator: "Priya", receiver: "Rahul", expected: "Priya makes a task from her own message assigned to Rahul; Rahul completes; Priya verifies; conversation still links the task", desktop: "Tested", mobile: "See T18", persistence: "Reload both", permission: "Owner" },
  async ({ browser }) => {
    const state = loadState();
    const priya = await pageOf(browser, "priya");
    await go(priya, state.ids.dm);
    const text = tag("Please call the tile vendor about delivery");
    await send(priya, text);
    const bubble = priya.locator("div").filter({ hasText: text }).last();
    await priya.getByTestId("make-task").last().click();
    const form = priya.locator("form").filter({ hasText: "Task created from this message" });
    await expect(form.getByRole("textbox"), "the message text is carried into the task").toHaveValue(new RegExp(loadState().run));
    await form.getByRole("button", { name: "Rahul Verma" }).click();
    await form.getByRole("button", { name: "Create task" }).click();
    // Wait for this exact task, not "the newest one": the thread already carries
    // a chip from T3.4, so a read that lands too early picks up the wrong task.
    const db = await as("priya");
    let data: { id: string; assigned_to: string | null; source_message_id: string | null } | null = null;
    // The task is written first and its link to the message a moment later.
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const { data: row } = await db.from("tasks").select("id, assigned_to, source_message_id").eq("title", text).maybeSingle();
      data = row ?? null;
      if (data?.source_message_id) break;
      await priya.waitForTimeout(1000);
    }
    expect(data, "task created from the owner's own message").toBeTruthy();
    expect(data!.source_message_id, "the task remembers the message it came from").toBeTruthy();
    await expect(priya.getByRole("link", { name: "Task created" }).last()).toHaveAttribute("href", `/kaam/${data!.id}`, { timeout: 30_000 });
    expect(data!.assigned_to).toBe(state.users.rahul.id);
    const rahul = await pageOf(browser, "rahul");
    await openTask(rahul, data!.id);
    await rahul.getByRole("button", { name: "Seen, will do" }).first().click();
    await rahul.getByRole("button", { name: "Done", exact: true }).first().click();
    await rahul.getByRole("dialog").getByRole("button", { name: /Without a proof/ }).click();
    await expect(rahul.getByRole("list", { name: "Timeline" })).toContainText("Done", { timeout: 30_000 });
    await openTask(priya, data!.id);
    await act(priya, "Verify");
    await expect(priya.getByText(/^Verified · /).first()).toBeVisible({ timeout: 30_000 });
    await go(priya, state.ids.dm);
    await priya.reload();
    await expect(priya.getByRole("link", { name: "Task created" }).last()).toHaveAttribute("href", `/kaam/${data!.id}`);
    void bubble;
  },
);

async function createGroup(page: Page, title: string, members: string[]) {
  await go(page, "/baat");
  await page.getByRole("button", { name: "New group" }).click();
  await page.getByLabel("Group name").fill(title);
  for (const name of members) await page.getByRole("button", { name: new RegExp(name) }).first().click();
  await page.getByRole("button", { name: "Create group" }).click();
  await expect(page).toHaveURL(/\/baat\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  return page.url().replace(BASE, "");
}

scenario(
  { id: "T4.1", area: "Group conversation", scenario: "Group of four; everyone sees it and each other's messages", initiator: "Priya", receiver: "Arjun, Rahul, Neha", expected: "Each participant sees the group and messages from different people", desktop: "Tested", mobile: "See T18", persistence: "Reload all", permission: "Participants" },
  async ({ browser }) => {
    const state = loadState();
    const title = tag("Tower B site team");
    const priya = await pageOf(browser, "priya");
    const path = await createGroup(priya, title, ["Arjun Mehta", "Rahul Verma", "Neha Singh"]);
    state.ids.group = path;
    saveState(state);
    const lines: [Who, string][] = [
      ["priya", tag("Morning all, lobby tiles arrive at 11")],
      ["arjun", tag("I will be on site to receive them")],
      ["neha", tag("Uploading the lobby photos after delivery")],
    ];
    for (const [who, text] of lines) {
      const p = await pageOf(browser, who);
      await go(p, "/baat");
      await expect(p.getByText(title).first()).toBeVisible();
      await go(p, path);
      await send(p, text);
    }
    for (const who of ["priya", "arjun", "rahul", "neha"] as Who[]) {
      const p = await pageOf(browser, who);
      await go(p, path);
      await p.reload();
      for (const [, text] of lines) await expect(p.getByText(text)).toBeVisible();
    }
  },
);

scenario(
  { id: "T4.2", area: "Group conversation", scenario: "Group attachment and Message → Task inside the group", initiator: "Neha, Arjun", receiver: "Rahul, Neha", expected: "Rahul opens Neha's file; Arjun turns Neha's message into a task for Neha which she sees", desktop: "Tested", mobile: "See T18", persistence: "Reload", permission: "Participants" },
  async ({ browser }) => {
    const state = loadState();
    const neha = await pageOf(browser, "neha");
    await go(neha, state.ids.group);
    const file = `${tag("lobby-photos")}.pdf`.replace(/ /g, "-");
    await neha.getByTestId("thread-file-input").setInputFiles({ name: file, mimeType: "application/pdf", buffer: PDF });
    await expect(neha.getByRole("button", { name: file })).toBeVisible({ timeout: 30_000 });
    const rahul = await pageOf(browser, "rahul");
    await go(rahul, state.ids.group);
    const signed = rahul.context().waitForEvent("request", (r) => r.url().includes("/storage/v1/object/sign/documents/"));
    await rahul.getByRole("button", { name: file }).click();
    await signed;
    for (const extra of rahul.context().pages()) if (extra !== rahul) await extra.close();
    const arjun = await pageOf(browser, "arjun");
    await go(arjun, state.ids.group);
    const nehaMessage = arjun.getByText(/Uploading the lobby photos/).first();
    await expect(nehaMessage).toBeVisible();
    const index = await arjun.getByTestId("make-task").count();
    await arjun.getByTestId("make-task").nth(Math.max(0, index - 2)).click();
    const form = arjun.locator("form").filter({ hasText: "Task created from this message" });
    await form.getByRole("textbox").fill(tag("Upload lobby delivery photos"));
    await form.getByRole("button", { name: "Neha Singh" }).click();
    await form.getByRole("button", { name: "Create task" }).click();
    await expect(arjun.getByRole("link", { name: "Task created" }).first()).toBeVisible({ timeout: 30_000 });
    await go(neha, "/aaj");
    await expect(neha.getByText(tag("Upload lobby delivery photos")).filter({ visible: true }).first()).toBeVisible();
  },
);

scenario(
  { id: "T4.3", area: "Group conversation", scenario: "Outsiders cannot read the group or its files", initiator: "Vikram (Org B), direct API", receiver: "—", expected: "Org B owner cannot open the URL, list messages, list or sign the files", desktop: "Tested", mobile: "—", persistence: "—", permission: "RLS" },
  async ({ browser }) => {
    const state = loadState();
    const id = state.ids.group.split("/baat/")[1];
    const vikram = await pageOf(browser, "vikram");
    await go(vikram, state.ids.group);
    await expect(vikram.getByText(/lobby tiles arrive/)).toHaveCount(0);
    const v = await as("vikram");
    const { data: msgs } = await v.from("messages").select("id").eq("conversation_id", id);
    expect(msgs ?? []).toEqual([]);
    const { data: docs } = await admin().from("documents").select("storage_key").eq("org_id", state.orgA!).not("message_id", "is", null).limit(1);
    const signed = await v.storage.from("documents").createSignedUrl(docs![0].storage_key, 60);
    expect(signed.data?.signedUrl ?? null).toBeNull();
    const post = await v.rpc("post_message", { p_conversation: id, p_body: "intrusion" });
    expect(post.error).not.toBeNull();
  },
);

scenario(
  { id: "T4.4", area: "Group conversation", scenario: "Same-org non-participant cannot read a direct conversation", initiator: "Neha (not in Priya↔Rahul DM)", receiver: "—", expected: "Neha cannot see the DM messages in the UI or the database", desktop: "Tested", mobile: "—", persistence: "—", permission: "RLS" },
  async ({ browser }) => {
    const state = loadState();
    const neha = await pageOf(browser, "neha");
    await go(neha, state.ids.dm);
    await expect(neha.getByText(/client wants a revised BOQ/)).toHaveCount(0);
    const n = await as("neha");
    const { data } = await n.from("messages").select("id").eq("conversation_id", state.ids.dm.split("/baat/")[1]);
    expect(data ?? []).toEqual([]);
  },
);
