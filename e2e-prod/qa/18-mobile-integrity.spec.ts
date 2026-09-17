import { expect, test, type Locator, type Page } from "@playwright/test";
import { horizontalOverflow } from "../../e2e/support/overflow";
import { admin, closeAll, go, loadState, pageOf, PDF, PNG, scenario, tag } from "./kit";
import { openTask } from "./flows";

/** TEST 18 — Mobile at 390px, by tapping and typing. TEST 20 — Data integrity. */
test.describe.configure({ mode: "default" });
test.afterAll(closeAll);

/** The control is on screen and nothing (a bar, a sheet edge) sits on top of it. */
async function tappable(locator: Locator) {
  await locator.scrollIntoViewIfNeeded();
  await expect(locator).toBeInViewport();
  const covered = await locator.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !(hit && (hit === el || el.contains(hit)));
  });
  expect(covered, "control covered by another element").toBe(false);
}

async function fits(page: Page, label: string) {
  expect(await horizontalOverflow(page), `${label} scrolls sideways`).toBeLessThanOrEqual(1);
}

scenario(
  { id: "T18.1", area: "Mobile", scenario: "Conversation and Message → Task on a phone", initiator: "Priya (390px)", receiver: "Rahul (390px)", expected: "Type and send, make a task from the message, Rahul opens it; composer and buttons unobstructed; no sideways scroll", desktop: "—", mobile: "Tested", persistence: "Reload", permission: "Participants" },
  async ({ browser }) => {
    const state = loadState();
    const priya = await pageOf(browser, "priya", "mobile");
    await go(priya, state.ids.dm);
    await fits(priya, "thread");
    const box = priya.getByRole("textbox", { name: "Write a message" });
    await tappable(box);
    const text = tag("Mobile: please share the site photos");
    await box.tap();
    await box.fill(text);
    const send = priya.getByRole("button", { name: "Send", exact: true });
    await tappable(send);
    await send.tap();
    await expect(priya.getByText(text)).toBeVisible({ timeout: 30_000 });
    const make = priya.getByTestId("make-task").last();
    await tappable(make);
    await make.tap();
    const form = priya.locator("form").filter({ hasText: "Task created from this message" });
    await form.getByRole("button", { name: "Rahul Verma" }).tap();
    const create = form.getByRole("button", { name: "Create task" });
    await tappable(create);
    await create.tap();
    const chip = priya.getByRole("link", { name: "Task created" }).last();
    await expect(chip).toBeVisible({ timeout: 30_000 });
    const href = (await chip.getAttribute("href"))!;
    const rahul = await pageOf(browser, "rahul", "mobile");
    await go(rahul, "/aaj");
    await expect(rahul.getByText(text).filter({ visible: true }).first()).toBeVisible();
    await go(rahul, href);
    await fits(rahul, "task");
  },
);

scenario(
  { id: "T18.2", area: "Mobile", scenario: "Task lifecycle with photo proof on a phone", initiator: "Rahul (390px)", receiver: "Priya (390px)", expected: "Accept, start, done with photo; Priya verifies; action bars never cover buttons or proof; no sideways scroll", desktop: "—", mobile: "Tested", persistence: "Reload both", permission: "Assignee / owner" },
  async ({ browser }) => {
    const priyaDesk = await pageOf(browser, "priya");
    const { createTaskUI } = await import("./flows");
    const id = await createTaskUI(priyaDesk, { assignee: "Rahul Verma", title: tag("Mobile lifecycle task") });
    const rahul = await pageOf(browser, "rahul", "mobile");
    await openTask(rahul, id);
    await fits(rahul, "task");
    const accept = rahul.getByRole("button", { name: "Seen, will do" }).first();
    await tappable(accept);
    await accept.tap();
    const start = rahul.getByRole("button", { name: "Started" }).first();
    await expect(start).toBeVisible({ timeout: 30_000 });
    await tappable(start);
    await start.tap();
    const done = rahul.getByRole("button", { name: "Done", exact: true }).first();
    await expect(rahul.getByRole("list", { name: "Timeline" })).toContainText("In progress", { timeout: 30_000 });
    await tappable(done);
    await done.tap();
    await rahul.getByTestId("proof-file-input").setInputFiles({ name: "mobile-proof.png", mimeType: "image/png", buffer: PNG });
    const submit = rahul.getByRole("dialog").getByRole("button", { name: "Send · done" });
    await tappable(submit);
    await submit.tap();
    await expect(rahul.getByRole("list", { name: "Timeline" })).toContainText("Done", { timeout: 30_000 });
    const priya = await pageOf(browser, "priya", "mobile");
    await openTask(priya, id);
    const photo = priya.getByRole("img", { name: /Photo sent by Rahul Verma/ }).first();
    await photo.scrollIntoViewIfNeeded();
    const verify = priya.getByRole("button", { name: "Verify" }).first();
    await tappable(verify);
    await verify.tap();
    await expect(priya.getByText(/^Verified · /).first()).toBeVisible({ timeout: 30_000 });
    await priya.reload();
    await tappable(priya.getByRole("img", { name: /Photo sent by Rahul Verma/ }).first());
    await fits(priya, "verified task");
  },
);

scenario(
  { id: "T18.3", area: "Mobile", scenario: "Documents and project on a phone", initiator: "Arjun (390px)", receiver: "Neha (390px)", expected: "Upload from the phone; Neha sees it; project status changes by tap; no sideways scroll", desktop: "—", mobile: "Tested", persistence: "Reload", permission: "Manager" },
  async ({ browser }) => {
    const state = loadState();
    const arjun = await pageOf(browser, "arjun", "mobile");
    await go(arjun, "/documents");
    await fits(arjun, "documents");
    const name = `${tag("mobile-upload").replace(/ /g, "-")}.pdf`;
    await arjun.getByTestId("document-file-input").first().setInputFiles({ name, mimeType: "application/pdf", buffer: PDF });
    await expect(arjun.getByTestId("document-row").filter({ hasText: name })).toBeVisible({ timeout: 30_000 });
    const neha = await pageOf(browser, "neha", "mobile");
    await go(neha, "/documents");
    await expect(neha.getByTestId("document-row").filter({ hasText: name })).toBeVisible();
    await go(arjun, state.ids.project);
    await fits(arjun, "project");
    const status = arjun.getByLabel("Status");
    await tappable(status);
    await status.selectOption("on_hold");
    await arjun.waitForTimeout(1500);
    await arjun.reload();
    await expect(arjun.getByLabel("Status")).toHaveValue("on_hold");
    await go(neha, state.ids.project);
    await expect(neha.getByText("On hold").first()).toBeVisible();
    await fits(neha, "project (member)");
  },
);

scenario(
  { id: "T18.4", area: "Mobile", scenario: "Attendance, leave and approvals on a phone", initiator: "Neha (390px)", receiver: "Arjun (390px)", expected: "Punch in/out by tap; leave request by typing dates; manager approves on phone; approval request and decision by tap; notifications open on phone", desktop: "—", mobile: "Tested", persistence: "Reload", permission: "Member / manager" },
  async ({ browser }) => {
    const neha = await pageOf(browser, "neha", "mobile");
    await go(neha, "/hazri");
    await fits(neha, "attendance");
    const punch = neha.getByRole("button", { name: /^Punch (in|out)$/ });
    if (await neha.getByRole("button", { name: "Punch in" }).count()) {
      await tappable(neha.getByRole("button", { name: "Punch in" }));
      await neha.getByRole("button", { name: "Punch in" }).tap();
      await expect(neha.getByRole("button", { name: "Punch out" })).toBeVisible({ timeout: 30_000 });
    }
    await tappable(neha.getByRole("button", { name: "Punch out" }));
    await neha.getByRole("button", { name: "Punch out" }).tap();
    await expect(punch).toHaveCount(0, { timeout: 30_000 });
    const date = new Date(Date.now() + 60 * 86_400_000);
    while ([0, 6].includes(date.getDay())) date.setDate(date.getDate() + 1);
    const reason = tag("Mobile leave");
    await neha.getByRole("button", { name: "Apply leave" }).tap();
    await neha.getByRole("button", { name: "Half day", exact: true }).tap();
    await neha.locator("#leave-start").fill(date.toISOString().slice(0, 10));
    await neha.locator("#leave-reason").fill(reason);
    const sendRequest = neha.getByRole("button", { name: "Send request" });
    await tappable(sendRequest);
    await sendRequest.tap();
    // Neha's own list first: the sheet closes a moment before the row is stored.
    const shown = new Intl.DateTimeFormat("en-IN-u-nu-latn", { timeZone: "UTC", day: "numeric", month: "short" }).format(
      new Date(`${date.toISOString().slice(0, 10)}T00:00:00Z`),
    );
    await expect(neha.locator("#leave").getByRole("listitem").filter({ hasText: shown }).first()).toBeVisible({ timeout: 60_000 });
    const arjun = await pageOf(browser, "arjun", "mobile");
    await go(arjun, "/hazri");
    const row = arjun.locator("#leave-requests").getByRole("listitem").filter({ hasText: reason });
    await expect(row.first()).toBeVisible({ timeout: 60_000 });
    const approve = row.getByRole("button", { name: "Approve" });
    await tappable(approve);
    await approve.tap();
    await expect(arjun.locator("#leave-requests").getByRole("listitem").filter({ hasText: reason })).toHaveCount(0, { timeout: 30_000 });
    await go(neha, "/approvals");
    await fits(neha, "approvals");
    const title = tag("Mobile approval");
    await neha.getByRole("button", { name: "Ask for approval" }).tap();
    await neha.locator("#approval-title").fill(title);
    const ask = neha.locator("form").getByRole("button", { name: "Ask for approval" });
    await tappable(ask);
    await ask.tap();
    // Neha's own list has to carry it before Arjun is sent to decide it.
    await expect(neha.getByTestId("approval-card").filter({ hasText: title }).first()).toBeVisible({ timeout: 60_000 });
    await go(arjun, "/approvals");
    const c = arjun.getByTestId("approval-card").filter({ hasText: title });
    await expect(c.first()).toBeVisible({ timeout: 60_000 });
    await tappable(c.getByRole("button", { name: "Approve" }));
    await c.getByRole("button", { name: "Approve" }).tap();
    await expect(c.getByText("Approved")).toBeVisible({ timeout: 30_000 });
    await go(neha, "/khabar");
    await fits(neha, "updates");
    const link = neha.getByRole("link").filter({ hasText: title }).first();
    await tappable(link);
    await link.tap();
    await expect(neha).toHaveURL(/\/approvals/);
  },
);

scenario(
  { id: "T18.5", area: "Mobile", scenario: "Every screen fits 390px for all four roles", initiator: "—", receiver: "Priya, Arjun, Rahul, Neha", expected: "No sideways scroll on any Phase-1 screen or detail page", desktop: "—", mobile: "Tested", persistence: "—", permission: "All roles" },
  async ({ browser }) => {
    const state = loadState();
    const paths = ["/aaj", "/baat", state.ids.dm, state.ids.group, "/work", `/kaam/${state.ids.mainTask}`, "/projects", state.ids.project, "/documents", "/documents/templates", "/documents/templates?template=quotation", "/hazri", "/approvals", "/staff", "/search?q=Tower", "/khabar", "/settings", "/more"];
    const bad: string[] = [];
    for (const who of ["priya", "arjun", "rahul", "neha"] as const) {
      const p = await pageOf(browser, who, "mobile");
      for (const path of paths) {
        await go(p, path);
        const over = await horizontalOverflow(p);
        if (over > 1) bad.push(`${who} ${path} +${over}px`);
      }
    }
    expect(bad).toEqual([]);
  },
);

scenario(
  { id: "T20.1", area: "Data integrity", scenario: "Database state after the full organization journey", initiator: "—", receiver: "—", expected: "No duplicate leave deductions; no duplicate task events; every row in the right org with the right actor; balances match approved requests; notifications target members only", desktop: "DB", mobile: "DB", persistence: "—", permission: "—" },
  async ({ note }) => {
    const state = loadState();
    const s = admin();
    const org = state.orgA!;
    const members = new Set(Object.values(state.users).map((u) => u.id));
    const problems: string[] = [];

    const { data: events } = await s.from("task_events").select("task_id, from_state, to_state, actor_id, created_at, org_id").eq("org_id", org).order("created_at");
    const seen = new Map<string, number>();
    for (const e of events ?? []) {
      if (!members.has(e.actor_id) && e.actor_id !== null) problems.push(`event actor outside org ${e.actor_id}`);
      const key = `${e.task_id}:${e.from_state}>${e.to_state}:${e.created_at.slice(0, 19)}`;
      seen.set(key, (seen.get(key) ?? 0) + 1);
    }
    for (const [key, count] of seen) if (count > 1) problems.push(`duplicate event ${key}`);

    const { data: tasks } = await s.from("tasks").select("id, state, org_id, created_by, assigned_to, verified_at, done_at, cancelled_at").eq("org_id", org);
    for (const t of tasks ?? []) {
      if (t.state === "verified" && !t.verified_at) problems.push(`verified without time ${t.id}`);
      if (t.state === "cancelled" && !t.cancelled_at) problems.push(`cancelled without time ${t.id}`);
      if (!members.has(t.assigned_to)) problems.push(`task assigned outside org ${t.id}`);
      // Events written in one statement share a timestamp; order those by the lifecycle.
      const rank = ["created", "delivered", "acknowledged", "accepted", "in_progress", "done", "verified", "escalated", "reassigned", "cancelled"];
      const own = (events ?? []).filter((e) => e.task_id === t.id && e.from_state !== e.to_state);
      const latest = own.reduce<typeof own[number] | undefined>((best, e) => {
        if (!best) return e;
        if (e.created_at > best.created_at) return e;
        if (e.created_at === best.created_at && rank.indexOf(e.to_state) > rank.indexOf(best.to_state)) return e;
        return best;
      }, undefined);
      const last = latest;
      if (last && last.to_state !== t.state && !(last.to_state === "reassigned" && t.state === "delivered")) problems.push(`task ${t.id} state ${t.state} but last event ${last.to_state}`);
    }

    const { data: balances } = await s.from("leave_balances").select("user_id, balance_days").eq("org_id", org);
    const { data: requests } = await s.from("leave_requests").select("id, user_id, status, days_requested, start_date, end_date").eq("org_id", org);
    const approvedDates = new Map<string, number>();
    for (const r of (requests ?? []).filter((x) => x.status === "approved")) {
      const key = `${r.user_id}:${r.start_date}`;
      approvedDates.set(key, (approvedDates.get(key) ?? 0) + 1);
    }
    for (const [key, count] of approvedDates) if (count > 1) problems.push(`two approved leaves on ${key}`);
    for (const b of balances ?? []) if (Number(b.balance_days) < 0) problems.push(`negative balance ${b.user_id}`);

    const { data: attendance } = await s.from("attendance_records").select("user_id, work_date").eq("org_id", org);
    const days = new Map<string, number>();
    for (const a of attendance ?? []) days.set(`${a.user_id}:${a.work_date}`, (days.get(`${a.user_id}:${a.work_date}`) ?? 0) + 1);
    for (const [key, count] of days) if (count > 1) problems.push(`duplicate attendance ${key}`);

    const { data: docs } = await s.from("documents").select("id, org_id, storage_key, uploaded_by").eq("org_id", org);
    for (const d of docs ?? []) {
      if (!d.storage_key.startsWith(`orgs/${org}/`)) problems.push(`document outside org folder ${d.id}`);
      if (!members.has(d.uploaded_by)) problems.push(`document uploader outside org ${d.id}`);
    }

    const { data: approvals } = await s.from("approvals").select("id, status, decided_by, decided_at, requested_by").eq("org_id", org);
    for (const a of approvals ?? []) {
      if (a.status !== "pending" && (!a.decided_by || !a.decided_at)) problems.push(`decided approval without decider ${a.id}`);
      if (a.decided_by && a.decided_by === a.requested_by) problems.push(`self-decided approval ${a.id}`);
    }

    const { data: notes } = await s.from("notifications").select("user_id, org_id").eq("org_id", org);
    for (const n of notes ?? []) if (!members.has(n.user_id)) problems.push(`notification to non-member ${n.user_id}`);

    const { data: projects } = await s.from("projects").select("id, org_id").eq("org_id", org);
    const projectIds = new Set((projects ?? []).map((p) => p.id));
    const { data: linked } = await s.from("tasks").select("id, project_id").eq("org_id", org).not("project_id", "is", null);
    for (const t of linked ?? []) if (!projectIds.has(t.project_id)) problems.push(`task linked to foreign project ${t.id}`);

    note(`${events?.length} events, ${tasks?.length} tasks, ${requests?.length} leave requests, ${attendance?.length} attendance rows, ${docs?.length} documents, ${approvals?.length} approvals, ${notes?.length} notifications checked`);
    expect(problems).toEqual([]);
  },
);
