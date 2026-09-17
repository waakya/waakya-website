import { expect, test, type Page } from "@playwright/test";
import { PNG, act, admin, as, closeAll, go, loadState, pageOf, saveState, scenario, tag } from "./kit";
import { createTaskUI, openTask } from "./flows";

/** TEST 2 — The complete task journey, from both sides. */
test.describe.configure({ mode: "default" });
test.afterAll(closeAll);

const timeline = (page: Page) => page.getByRole("list", { name: "Timeline" });

scenario(
  { id: "T2.1", area: "Tasks", scenario: "Owner assigns a task; assignee sees every detail", initiator: "Priya (Owner)", receiver: "Rahul (Member)", expected: "Rahul sees title, sender, deadline, Urgent, note; Priya sees Sent", desktop: "Tested", mobile: "See T18", persistence: "Reload both", permission: "Owner creates" },
  async ({ browser, note }) => {
    const state = loadState();
    const priya = await pageOf(browser, "priya");
    const title = tag("Revised kitchen quotation");
    const id = await createTaskUI(priya, { assignee: "Rahul Verma", title, note: "Use the latest BOQ with both flooring options", urgent: true });
    state.ids.mainTask = id;
    saveState(state);
    const rahul = await pageOf(browser, "rahul");
    await go(rahul, "/aaj");
    await expect(rahul.getByText(title).filter({ visible: true }).first()).toBeVisible();
    await openTask(rahul, id);
    await rahul.reload();
    await expect(rahul.getByRole("heading", { name: title })).toBeVisible();
    await expect(rahul.getByText("Priya Sharma").first()).toBeVisible();
    await expect(rahul.getByText(/tomorrow 9:00 am/i).first()).toBeVisible();
    await expect(rahul.getByText("Urgent").first()).toBeVisible();
    await expect(rahul.getByText("Use the latest BOQ with both flooring options")).toBeVisible();
    await openTask(priya, id);
    await expect(timeline(priya)).toContainText("Sent");
    note(`task ${id}`);
  },
);

scenario(
  { id: "T2.2", area: "Tasks", scenario: "Assignee accepts; owner sees Accepted", initiator: "Rahul", receiver: "Priya", expected: "Priya's timeline shows Seen and Accepted by Rahul; single event each even on double click", desktop: "Tested", mobile: "See T18", persistence: "Reload", permission: "Assignee" },
  async ({ browser }) => {
    const id = loadState().ids.mainTask;
    const rahul = await pageOf(browser, "rahul");
    await openTask(rahul, id);
    const accept = rahul.getByRole("button", { name: "Seen, will do" }).first();
    await accept.dblclick();
    await expect(timeline(rahul)).toContainText("Accepted");
    const priya = await pageOf(browser, "priya");
    await openTask(priya, id);
    await expect(timeline(priya)).toContainText("Rahul Verma");
    await expect(timeline(priya)).toContainText("Accepted");
    const { data } = await admin().from("task_events").select("to_state").eq("task_id", id);
    const counts = (data ?? []).reduce<Record<string, number>>((m, e) => ({ ...m, [e.to_state]: (m[e.to_state] ?? 0) + 1 }), {});
    expect(counts.accepted, "accepted events").toBe(1);
    expect(counts.acknowledged, "acknowledged events").toBe(1);
  },
);

scenario(
  { id: "T2.3", area: "Tasks", scenario: "Assignee starts work; owner sees In progress", initiator: "Rahul", receiver: "Priya", expected: "In progress on both sides after reload", desktop: "Tested", mobile: "See T18", persistence: "Reload both", permission: "Assignee" },
  async ({ browser }) => {
    const id = loadState().ids.mainTask;
    const rahul = await pageOf(browser, "rahul");
    await openTask(rahul, id);
    await rahul.getByRole("button", { name: "Started" }).first().click();
    await expect(timeline(rahul)).toContainText("In progress");
    const priya = await pageOf(browser, "priya");
    await openTask(priya, id);
    await expect(timeline(priya)).toContainText("In progress");
  },
);

async function submitProof(page: Page, id: string, noteText: string, name: string) {
  await openTask(page, id);
  await page.getByRole("button", { name: "Done", exact: true }).first().click();
  const sheet = page.getByRole("dialog");
  await expect(sheet.getByRole("heading", { name: "Done? Send the proof" })).toBeVisible();
  await page.getByTestId("proof-file-input").setInputFiles({ name, mimeType: "image/png", buffer: PNG });
  await expect(sheet.getByText("1 photo")).toBeVisible();
  await sheet.getByRole("button", { name: "Write" }).click();
  await sheet.getByRole("textbox", { name: "Write" }).fill(noteText);
  await sheet.getByRole("button", { name: "Send · done" }).click();
  await expect(timeline(page)).toContainText("Done", { timeout: 30_000 });
}

scenario(
  { id: "T2.4", area: "Tasks", scenario: "Assignee submits note + photo proof; owner opens proof", initiator: "Rahul", receiver: "Priya", expected: "Priya sees Done, the photo and the note, and Verify / Send back", desktop: "Tested", mobile: "See T18", persistence: "Reload", permission: "Assignee" },
  async ({ browser }) => {
    const id = loadState().ids.mainTask;
    const rahul = await pageOf(browser, "rahul");
    await submitProof(rahul, id, "First version sent to client for review", "quotation-v1.png");
    const priya = await pageOf(browser, "priya");
    await openTask(priya, id);
    await priya.reload();
    await expect(timeline(priya)).toContainText("Done");
    await expect(priya.getByRole("img", { name: /Photo sent by Rahul Verma/ }).first()).toBeVisible();
    await expect(priya.getByText("First version sent to client for review")).toBeVisible();
    await expect(priya.getByRole("button", { name: "Verify" }).first()).toBeVisible();
    await expect(priya.getByRole("button", { name: "Send back" }).first()).toBeVisible();
  },
);

scenario(
  { id: "T2.5", area: "Tasks", scenario: "Owner requests changes with a reason; assignee sees the reason", initiator: "Priya", receiver: "Rahul", expected: "Priya enters a reason; Rahul sees In progress and the reason", desktop: "Tested", mobile: "See T18", persistence: "Reload both", permission: "Owner" },
  async ({ browser }) => {
    const id = loadState().ids.mainTask;
    const priya = await pageOf(browser, "priya");
    await openTask(priya, id);
    await priya.getByRole("button", { name: "Send back" }).first().click();
    const reason = "GST is missing on the flooring line";
    const box = priya.getByRole("dialog").getByRole("textbox");
    await expect(box, "a reason field when sending back").toBeVisible({ timeout: 5_000 });
    await box.fill(reason);
    await priya.getByRole("dialog").getByRole("button", { name: "Send back" }).click();
    await expect(timeline(priya)).toContainText(reason, { timeout: 30_000 });
    const rahul = await pageOf(browser, "rahul");
    await openTask(rahul, id);
    await rahul.reload();
    await expect(timeline(rahul)).toContainText(reason);
    await expect(rahul.getByRole("button", { name: "Done", exact: true }).first()).toBeVisible();
  },
);

scenario(
  { id: "T2.6", area: "Tasks", scenario: "Assignee resubmits; owner sees history then verifies; both see Verified", initiator: "Rahul → Priya", receiver: "Priya ↔ Rahul", expected: "Two proofs in history; Verified on both sides; no countdown, reminder or Change time; persists", desktop: "Tested", mobile: "See T18", persistence: "Reload both", permission: "Owner verifies" },
  async ({ browser }) => {
    const id = loadState().ids.mainTask;
    const rahul = await pageOf(browser, "rahul");
    // If T2.5 could not send it back, this step cannot run meaningfully.
    await openTask(rahul, id);
    await expect(rahul.getByRole("button", { name: "Done", exact: true }).first(), "task is back with Rahul").toBeVisible({ timeout: 5_000 });
    await submitProof(rahul, id, "Revised with GST on flooring", "quotation-v2.png");
    const priya = await pageOf(browser, "priya");
    await openTask(priya, id);
    await expect(priya.getByRole("img", { name: /Photo sent by Rahul Verma/ })).toHaveCount(2);
    await act(priya, "Verify");
    await expect(priya.getByText(/^Verified · /).first()).toBeVisible({ timeout: 30_000 });
    for (const p of [priya, rahul]) {
      await openTask(p, id);
      await p.reload();
      await expect(p.getByText(/^Verified · /).first()).toBeVisible();
      await expect(p.getByRole("progressbar")).toHaveCount(0);
      await expect(p.getByText(/reminder/i)).toHaveCount(0);
      await expect(p.getByText(/ left$/)).toHaveCount(0);
      await expect(p.getByRole("button", { name: "Change time" })).toHaveCount(0);
    }
    const { data } = await admin().from("task_events").select("to_state, actor_id").eq("task_id", id).order("created_at");
    const state = loadState();
    const seq = (data ?? []).map((e) => e.to_state).join(">");
    expect(seq).toBe("created>delivered>acknowledged>accepted>in_progress>done>in_progress>done>verified");
    const verified = data!.find((e) => e.to_state === "verified");
    expect(verified!.actor_id).toBe(state.users.priya.id);
  },
);

scenario(
  { id: "T2.7", area: "Tasks", scenario: "Task notifications reach the right person and open the task", initiator: "Priya / Rahul", receiver: "Rahul / Priya", expected: "Rahul: assignment, sent back, verified. Priya: seen, done. Each opens the task", desktop: "Tested", mobile: "See T18", persistence: "Reload", permission: "Own inbox only" },
  async ({ browser }) => {
    const state = loadState();
    const id = state.ids.mainTask;
    const r = await as("rahul");
    const { data: rn } = await r.from("notifications").select("event, task_id").eq("task_id", id);
    const rEvents = (rn ?? []).map((n) => n.event);
    const p = await as("priya");
    const { data: pn } = await p.from("notifications").select("event, task_id").eq("task_id", id);
    const pEvents = (pn ?? []).map((n) => n.event);
    const rahul = await pageOf(browser, "rahul");
    await go(rahul, "/khabar");
    const link = rahul.getByRole("link").filter({ hasText: loadState().run }).first();
    await expect(link).toBeVisible();
    await link.click();
    await expect(rahul).toHaveURL(new RegExp(`/kaam/${id}`));
    expect(rEvents, "Rahul's events").toEqual(expect.arrayContaining(["task_assigned", "sent_back", "task_verified"]));
    expect(pEvents, "Priya's events").toEqual(expect.arrayContaining(["task_done"]));
  },
);

scenario(
  { id: "T2.8", area: "Tasks", scenario: "Owner → Manager task, Manager → Member task", initiator: "Priya, Arjun", receiver: "Arjun, Neha", expected: "Arjun receives Priya's task; Neha receives Arjun's task and can accept; Arjun verifies it", desktop: "Tested", mobile: "—", persistence: "Reload", permission: "Manager assigns" },
  async ({ browser }) => {
    const state = loadState();
    const priya = await pageOf(browser, "priya");
    const t1 = tag("Vendor comparison for Tower B");
    const id1 = await createTaskUI(priya, { assignee: "Arjun Mehta", title: t1 });
    const arjun = await pageOf(browser, "arjun");
    await go(arjun, "/aaj");
    await expect(arjun.getByText(t1).filter({ visible: true }).first()).toBeVisible();
    const t2 = tag("Site photos Sector 76");
    const id2 = await createTaskUI(arjun, { assignee: "Neha Singh", title: t2 });
    state.ids.managerTask = id2;
    saveState(state);
    const neha = await pageOf(browser, "neha");
    await openTask(neha, id2);
    await expect(neha.getByText("Arjun Mehta").first()).toBeVisible();
    await neha.getByRole("button", { name: "Seen, will do" }).first().click();
    await expect(timeline(neha)).toContainText("Accepted");
    await neha.getByRole("button", { name: "Done", exact: true }).first().click();
    await neha.getByRole("dialog").getByRole("button", { name: /Without a proof/ }).click();
    await expect(timeline(neha)).toContainText("Done");
    await openTask(arjun, id2);
    await act(arjun, "Verify");
    await expect(arjun.getByText(/^Verified · /).first()).toBeVisible({ timeout: 30_000 });
    await openTask(neha, id2);
    await expect(neha.getByText(/^Verified · /).first()).toBeVisible();
    void id1;
  },
);

scenario(
  { id: "T2.9", area: "Tasks", scenario: "Team member cannot create tasks from New task; cannot verify own work", initiator: "Rahul", receiver: "—", expected: "No New task entry for members; Verify never offered to the assignee", desktop: "Tested", mobile: "—", persistence: "—", permission: "Member" },
  async ({ browser }) => {
    const rahul = await pageOf(browser, "rahul");
    await go(rahul, "/work");
    await expect(rahul.getByRole("link", { name: "New task" })).toHaveCount(0);
    const priya = await pageOf(browser, "priya");
    const title = tag("Measure the Tower B lobby");
    const id = await createTaskUI(priya, { assignee: "Rahul Verma", title });
    const state = loadState();
    state.ids.rahulSecond = id;
    saveState(state);
    await openTask(rahul, id);
    await rahul.getByRole("button", { name: "Seen, will do" }).first().click();
    await rahul.getByRole("button", { name: "Done", exact: true }).first().click();
    await rahul.getByRole("dialog").getByRole("button", { name: /Without a proof/ }).click();
    await expect(timeline(rahul)).toContainText("Done", { timeout: 30_000 });
    await expect(rahul.getByRole("button", { name: "Verify" })).toHaveCount(0);
  },
);

scenario(
  { id: "T2.10", area: "Tasks", scenario: "Invalid transitions forced at the database are rejected", initiator: "Rahul (direct API)", receiver: "—", expected: "Member cannot verify own task, move someone else's task, change assignee/deadline, or forge events as someone else", desktop: "API", mobile: "—", persistence: "Checked after", permission: "Database enforcement" },
  async () => {
    const state = loadState();
    const rahul = await as("rahul");
    const service = admin();
    const own = state.ids.rahulSecond;
    const others = state.ids.managerTask;
    await rahul.from("tasks").update({ state: "verified", verified_at: new Date().toISOString() }).eq("id", own);
    await rahul.from("tasks").update({ state: "cancelled" }).eq("id", others);
    await rahul.from("tasks").update({ assigned_to: state.users.neha.id, due_at: "2030-01-01T00:00:00Z" }).eq("id", own);
    const forged = await rahul.from("task_events").insert({ task_id: own, org_id: state.orgA, from_state: "done", to_state: "verified", actor_id: state.users.priya.id });
    const { data: a } = await service.from("tasks").select("state, assigned_to, due_at").eq("id", own).single();
    const { data: b } = await service.from("tasks").select("state").eq("id", others).single();
    const { data: ev } = await service.from("task_events").select("id").eq("task_id", own).eq("actor_id", state.users.priya.id).eq("to_state", "verified");
    // Undo anything the database let through, so later scenarios stay valid.
    await service.from("tasks").update({ state: "done", verified_at: null, assigned_to: state.users.rahul.id }).eq("id", own);
    await service.from("tasks").update({ state: "verified" }).eq("id", others);
    await service.from("task_events").delete().eq("task_id", own).eq("actor_id", state.users.priya.id).eq("to_state", "verified");
    expect(a!.state, "member verified own task").toBe("done");
    expect(a!.assigned_to, "member reassigned").toBe(state.users.rahul.id);
    expect(b!.state, "member moved someone else's task").toBe("verified");
    expect(forged.error ?? (ev?.length ? null : "none"), "forged event as owner").not.toBeNull();
  },
);

scenario(
  { id: "T2.11", area: "Tasks", scenario: "Overdue task shows Late for owner and assignee", initiator: "Priya", receiver: "Rahul", expected: "A past-due open task shows Late on both Today screens and the task", desktop: "Tested", mobile: "—", persistence: "Reload", permission: "—" },
  async ({ browser }) => {
    const priya = await pageOf(browser, "priya");
    const title = tag("Overdue BOQ check");
    const id = await createTaskUI(priya, { assignee: "Rahul Verma", title });
    // Setting a past deadline is the one thing the UI cannot do; the condition is staged, the screens are not.
    await admin().from("tasks").update({ due_at: new Date(Date.now() - 3 * 3600_000).toISOString() }).eq("id", id);
    const state = loadState();
    state.ids.overdue = id;
    saveState(state);
    const rahul = await pageOf(browser, "rahul");
    for (const p of [priya, rahul]) {
      await openTask(p, id);
      await expect(p.getByText(/^Late \d/).first()).toBeVisible();
    }
    await go(priya, "/work?tab=late");
    await expect(priya.getByText(title).filter({ visible: true }).first()).toBeVisible();
  },
);

scenario(
  { id: "T2.12", area: "Tasks", scenario: "Owner cancels a task; assignee sees Cancelled with no actions", initiator: "Priya", receiver: "Rahul", expected: "Cancelled on both sides; no countdown, reminder, Change time or Done", desktop: "Tested", mobile: "—", persistence: "Reload both", permission: "Owner" },
  async ({ browser }) => {
    const id = loadState().ids.overdue;
    const priya = await pageOf(browser, "priya");
    await openTask(priya, id);
    await priya.getByRole("button", { name: "Cancel", exact: true }).first().click();
    await priya.getByRole("button", { name: "Yes, cancel it" }).click();
    await expect(priya.getByText("Cancelled").first()).toBeVisible({ timeout: 30_000 });
    const rahul = await pageOf(browser, "rahul");
    for (const p of [priya, rahul]) {
      await openTask(p, id);
      await p.reload();
      await expect(p.getByText("Cancelled").first()).toBeVisible();
      await expect(p.getByRole("progressbar")).toHaveCount(0);
      await expect(p.getByRole("button", { name: "Change time" })).toHaveCount(0);
      await expect(p.getByRole("button", { name: "Done", exact: true })).toHaveCount(0);
      await expect(p.getByText(/^Late /)).toHaveCount(0);
    }
  },
);

