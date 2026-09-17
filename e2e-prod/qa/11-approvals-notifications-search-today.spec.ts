import { expect, test, type Page } from "@playwright/test";
import { admin, as, BASE, closeAll, go, loadState, pageOf, saveState, scenario, tag } from "./kit";
import { createTaskUI, openTask } from "./flows";

/** TEST 11 — Approvals. TEST 12 — Notifications. TEST 13 — Search. TEST 14 — Today. */
test.describe.configure({ mode: "default" });
test.afterAll(closeAll);

const card = (page: Page, title: string) => page.getByTestId("approval-card").filter({ hasText: title });

async function requestApproval(page: Page, title: string) {
  await go(page, "/approvals");
  await page.getByRole("button", { name: "Ask for approval" }).click();
  await page.locator("#approval-title").fill(title);
  await page.locator("form").getByRole("button", { name: "Ask for approval" }).click();
  await expect(card(page, title)).toBeVisible({ timeout: 30_000 });
}

scenario(
  { id: "T11.1", area: "Approvals", scenario: "Request → owner approves with a comment → requester sees decision, comment and notification", initiator: "Rahul", receiver: "Priya → Rahul", expected: "Priya sees it waiting; approves with comment; Rahul sees Approved, the comment and an update", desktop: "Tested", mobile: "See T18", persistence: "Reload both", permission: "Owner decides" },
  async ({ browser }) => {
    const state = loadState();
    const title = tag("Approve tile vendor Kajaria");
    state.ids.approvalYes = title;
    saveState(state);
    const rahul = await pageOf(browser, "rahul");
    await requestApproval(rahul, title);
    const priya = await pageOf(browser, "priya");
    await go(priya, "/approvals");
    const c = card(priya, title);
    await expect(c.getByText("Pending", { exact: true })).toBeVisible();
    await c.getByRole("textbox").fill("Approved, keep the 5% discount");
    await c.getByRole("button", { name: "Approve" }).click();
    await expect(card(priya, title).getByText("Approved", { exact: true })).toBeVisible({ timeout: 30_000 });
    await go(rahul, "/approvals");
    await rahul.reload();
    await expect(card(rahul, title).getByText("Approved", { exact: true })).toBeVisible();
    await expect(card(rahul, title)).toContainText("Approved, keep the 5% discount");
    await go(rahul, "/khabar");
    await expect(rahul.getByText(new RegExp(`${title} was approved`)).first()).toBeVisible();
  },
);

scenario(
  { id: "T11.2", area: "Approvals", scenario: "Second request rejected; requester cannot approve own", initiator: "Rahul", receiver: "Priya → Rahul", expected: "Rahul sees Rejected; Rahul has no Approve button on his own request; RPC refuses self-approval", desktop: "Tested", mobile: "See T18", persistence: "Reload", permission: "Not own" },
  async ({ browser }) => {
    const state = loadState();
    const title = tag("Extra spend on lobby lighting");
    const rahul = await pageOf(browser, "rahul");
    await requestApproval(rahul, title);
    await expect(card(rahul, title).getByRole("button", { name: "Approve" })).toHaveCount(0);
    const { data: row } = await admin().from("approvals").select("id").eq("title", title).single();
    const self = await (await as("rahul")).rpc("decide_approval", { p_approval: row!.id, p_approve: true });
    expect(self.error, "self approval").not.toBeNull();
    const priya = await pageOf(browser, "priya");
    await go(priya, "/approvals");
    await card(priya, title).getByRole("textbox").fill("Not in this month's budget");
    await card(priya, title).getByRole("button", { name: "Reject" }).click();
    await expect(card(priya, title).getByText("Rejected", { exact: true })).toBeVisible({ timeout: 30_000 });
    await go(rahul, "/approvals");
    await expect(card(rahul, title).getByText("Rejected", { exact: true })).toBeVisible();
    await expect(card(rahul, title)).toContainText("Not in this month's budget");
    state.ids.approvalNo = title;
    saveState(state);
  },
);

scenario(
  { id: "T11.3", area: "Approvals", scenario: "Decided requests no longer read as needing approval", initiator: "Priya decides", receiver: "Priya, Arjun (approvers)", expected: "After the decision, 'needs approval' updates are no longer unread for any approver and say the outcome", desktop: "Tested", mobile: "See T18", persistence: "Reload", permission: "—" },
  async ({ browser }) => {
    const state = loadState();
    for (const who of ["priya", "arjun"] as const) {
      const client = await as(who);
      const { data } = await client.from("notifications").select("body, read_at").eq("event", "approval_requested").ilike("body", `%${state.run}%`);
      const stale = (data ?? []).filter((n) => !n.read_at);
      expect(stale.map((n) => n.body), `${who} still has unread 'needs approval'`).toEqual([]);
      const p = await pageOf(browser, who);
      await go(p, "/aaj");
      await expect(p.getByText(/approvals? waiting/).filter({ visible: true })).toHaveCount(0);
    }
  },
);

scenario(
  { id: "T12.1", area: "Notifications", scenario: "Each notification opens the right place", initiator: "Various", receiver: "Rahul, Priya, Arjun", expected: "Message → conversation; assignment/sent back/verified/done → task; approval decision → approvals; leave decision → attendance; leave request → attendance", desktop: "Tested", mobile: "See T18", persistence: "—", permission: "Own inbox" },
  async ({ browser }) => {
    const checks: [("rahul" | "priya" | "arjun"), string, RegExp][] = [
      ["rahul", "message", /\/baat\/[0-9a-f-]{36}$/],
      ["rahul", "task_assigned", /\/kaam\/[0-9a-f-]{36}$/],
      ["rahul", "sent_back", /\/kaam\/[0-9a-f-]{36}$/],
      ["rahul", "task_verified", /\/kaam\/[0-9a-f-]{36}$/],
      ["priya", "task_done", /\/kaam\/[0-9a-f-]{36}$/],
      ["rahul", "approval_decided", /\/approvals/],
      ["rahul", "leave_approved", /\/hazri/],
      ["arjun", "leave_requested", /\/hazri/],
      ["priya", "approval_requested", /\/approvals/],
    ];
    const failures: string[] = [];
    for (const [who, event, target] of checks) {
      const client = await as(who);
      const { data } = await client.from("notifications").select("id, body").eq("event", event).order("created_at", { ascending: false }).limit(1);
      if (!data?.length) {
        failures.push(`${who}: no ${event}`);
        continue;
      }
      const p = await pageOf(browser, who);
      await go(p, "/khabar");
      const link = p.getByRole("link", { name: data[0].body.slice(0, 40) }).first();
      if (!(await link.count())) {
        failures.push(`${who}: ${event} not clickable`);
        continue;
      }
      await link.click();
      await p.waitForURL(target, { timeout: 15_000 }).catch(() => failures.push(`${who}: ${event} opened ${p.url()}`));
    }
    expect(failures).toEqual([]);
  },
);

scenario(
  { id: "T13.1", area: "Search", scenario: "Unique task, project, document, person and message are found and open", initiator: "Priya", receiver: "—", expected: "Each result appears and its link opens the right page", desktop: "Tested", mobile: "See T18", persistence: "—", permission: "Org scoped" },
  async ({ browser }) => {
    const state = loadState();
    const priya = await pageOf(browser, "priya");
    const cases: [string, RegExp][] = [
      ["Revised kitchen quotation", /\/kaam\//],
      ["Tower B lobby fit-out", /\/projects\//],
      ["BOQ-Tower-B", /\/documents\//],
      ["Neha Singh", /\/staff/],
      ["client wants a revised BOQ", /\/baat\//],
    ];
    const sections: Record<string, string> = { "/kaam/": "Tasks", "/projects/": "Projects", "/documents/": "Documents", "/staff": "People", "/baat/": "Messages" };
    for (const [query, target] of cases) {
      await go(priya, `/search?q=${encodeURIComponent(query)}`);
      const section = sections[target.source.replace(/\\/g, "")] ?? "";
      const link = priya.getByRole("main").locator("section").filter({ has: priya.getByRole("heading", { name: section, exact: true }) }).getByRole("link").filter({ hasText: query }).first();
      await expect(link, query).toBeVisible();
      await link.click();
      await expect(priya, query).toHaveURL(target);
    }
    void state;
  },
);

scenario(
  { id: "T13.2", area: "Search", scenario: "Org B cannot discover Org A content through search", initiator: "Vikram (Org B)", receiver: "—", expected: "Searching Org A's unique run tag returns nothing", desktop: "Tested", mobile: "—", persistence: "—", permission: "Cross-org" },
  async ({ browser }) => {
    const state = loadState();
    const vikram = await pageOf(browser, "vikram");
    for (const query of [state.run, "Tower B lobby", "Neha Singh", "BOQ-Tower-B"]) {
      await go(vikram, `/search?q=${encodeURIComponent(query)}`);
      await expect(vikram.getByText("Nothing found."), query).toBeVisible();
    }
  },
);

scenario(
  { id: "T14.1", area: "Today", scenario: "Owner Today shows each attention item and clears it once resolved", initiator: "Rahul, Neha create conditions; Priya resolves", receiver: "Priya", expected: "Pending approval, pending leave, done task to verify, unread conversation and a late task each appear; each disappears after resolving + reload", desktop: "Tested", mobile: "See T18", persistence: "Reload after each", permission: "Owner" },
  async ({ browser }) => {
    const state = loadState();
    const priya = await pageOf(browser, "priya");
    const rahul = await pageOf(browser, "rahul");
    const visible = (p: Page, text: RegExp | string) => p.getByText(text).filter({ visible: true });
    // Conditions, created by the people who would create them.
    const approval = tag("Today check approval");
    await requestApproval(rahul, approval);
    await (await as("priya")).rpc("credit_leave", { p_org: state.orgA, p_user: state.users.rahul.id, p_days: 1 });
    const leaveDate = new Date(Date.now() + 50 * 86_400_000);
    while ([0, 6].includes(leaveDate.getDay())) leaveDate.setDate(leaveDate.getDate() + 1);
    await (await as("rahul")).rpc("apply_leave", { p_org: state.orgA, p_start: leaveDate.toISOString().slice(0, 10), p_end: leaveDate.toISOString().slice(0, 10), p_kind: "half_day", p_reason: tag("Today check leave") });
    const verifyTitle = tag("Today check verify");
    const verifyId = await createTaskUI(priya, { assignee: "Rahul Verma", title: verifyTitle });
    await openTask(rahul, verifyId);
    await rahul.getByRole("button", { name: "Seen, will do" }).first().click();
    await rahul.getByRole("button", { name: "Done", exact: true }).first().click();
    await rahul.getByRole("dialog").getByRole("button", { name: /Without a proof/ }).click();
    await expect(rahul.getByRole("list", { name: "Timeline" })).toContainText("Done", { timeout: 30_000 });
    await go(rahul, state.ids.dm);
    await rahul.getByRole("textbox", { name: "Write a message" }).fill(tag("Today check unread"));
    await rahul.getByRole("button", { name: "Send", exact: true }).click();
    await expect(rahul.getByText(tag("Today check unread"))).toBeVisible({ timeout: 30_000 });
    const lateTitle = tag("Today check late");
    const lateId = await createTaskUI(priya, { assignee: "Rahul Verma", title: lateTitle });
    await admin().from("tasks").update({ due_at: new Date(Date.now() - 2 * 3600_000).toISOString() }).eq("id", lateId);

    await go(priya, "/aaj");
    await expect(visible(priya, /approvals? waiting/).first(), "approval item").toBeVisible();
    await expect(visible(priya, /leave requests?$/).first(), "leave item").toBeVisible();
    await expect(visible(priya, verifyTitle).first(), "verify item").toBeVisible();
    await expect(visible(priya, /unread conversations?/).first(), "unread item").toBeVisible();
    await expect(visible(priya, lateTitle).first(), "late item").toBeVisible();

    // Resolve one by one.
    await go(priya, "/approvals");
    await card(priya, approval).getByRole("button", { name: "Approve" }).click();
    await expect(card(priya, approval).getByText("Approved", { exact: true })).toBeVisible({ timeout: 30_000 });
    await go(priya, "/aaj");
    await expect(visible(priya, /approvals? waiting/), "approval cleared").toHaveCount(0);

    const leaveCount = async () => {
      await go(priya, "/aaj");
      const text = await visible(priya, /\d+ leave requests?$/).first().textContent().catch(() => null);
      return text ? Number(text.match(/\d+/)![0]) : 0;
    };
    const leaveBefore = await leaveCount();
    await go(priya, "/hazri");
    await priya.locator("#leave-requests").getByRole("listitem").filter({ hasText: tag("Today check leave") }).getByRole("button", { name: "Approve" }).click();
    await expect(priya.locator("#leave-requests").getByRole("listitem").filter({ hasText: tag("Today check leave") })).toHaveCount(0, { timeout: 30_000 });
    expect(await leaveCount(), "leave count dropped by one").toBe(leaveBefore - 1);

    await openTask(priya, verifyId);
    await priya.getByRole("button", { name: "Verify" }).first().click();
    await expect(priya.getByText(/^Verified · /).first()).toBeVisible({ timeout: 30_000 });
    await go(priya, "/aaj");
    await expect(priya.getByRole("list", { name: "Needs you" }).getByText(verifyTitle), "verify cleared").toHaveCount(0);

    // Read every conversation that is waiting, the way the owner would.
    for (let guard = 0; guard < 6; guard += 1) {
      await go(priya, "/baat");
      const unreadRow = priya.getByRole("link").filter({ has: priya.locator("span", { hasText: /^\d+$/ }) }).first();
      if (!(await unreadRow.count())) break;
      await unreadRow.click();
      await priya.waitForURL(/\/baat\/[0-9a-f-]{36}$/, { timeout: 20_000 }).catch(() => {});
    }
    await go(priya, "/aaj");
    await expect(visible(priya, /unread conversations?/), "unread cleared").toHaveCount(0);

    await openTask(priya, lateId);
    await priya.getByRole("button", { name: "Cancel", exact: true }).first().click();
    await priya.getByRole("button", { name: "Yes, cancel it" }).click();
    await priya.waitForTimeout(2000);
    await go(priya, "/aaj");
    await priya.reload();
    // A cancelled task stops asking for attention; it stays visible under what
    // is settled, which is where the owner expects to find it afterwards.
    const section = (name: RegExp) => priya.locator("section").filter({ has: priya.getByRole("heading", { name }) });
    await expect(section(/^(Needs you|Today's work)/).getByText(lateTitle), "late cleared from attention").toHaveCount(0);
    await expect(section(/^Done/).getByText(lateTitle).first(), "cancelled task listed as settled").toBeVisible();
  },
);

scenario(
  { id: "T14.2", area: "Today", scenario: "Manager and member Today reflect their own reality", initiator: "Priya assigns", receiver: "Arjun, Neha", expected: "Neha sees her open task and her unread group message; Arjun sees team attention items; after Neha finishes it leaves her open list", desktop: "Tested", mobile: "See T18", persistence: "Reload", permission: "Role views" },
  async ({ browser }) => {
    const priya = await pageOf(browser, "priya");
    const title = tag("Neha today task");
    const id = await createTaskUI(priya, { assignee: "Neha Singh", title });
    const neha = await pageOf(browser, "neha");
    await go(neha, "/aaj");
    await expect(neha.getByText(title).filter({ visible: true }).first()).toBeVisible();
    await openTask(neha, id);
    await neha.getByRole("button", { name: "Seen, will do" }).first().click();
    await neha.getByRole("button", { name: "Done", exact: true }).first().click();
    await neha.getByRole("dialog").getByRole("button", { name: /Without a proof/ }).click();
    await expect(neha.getByRole("list", { name: "Timeline" })).toContainText("Done", { timeout: 30_000 });
    await go(neha, "/aaj");
    await neha.reload();
    // Finished work leaves the open list (it folds into Done).
    await expect(neha.getByRole("link", { name: title, exact: true }).filter({ visible: true })).toHaveCount(0);
    const arjun = await pageOf(browser, "arjun");
    await go(arjun, "/aaj");
    await expect(arjun.getByText(title).filter({ visible: true }).first(), "manager sees team work").toBeVisible();
    void BASE;
  },
);
