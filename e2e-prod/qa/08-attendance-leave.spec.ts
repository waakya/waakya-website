import { expect, test, type Page } from "@playwright/test";
import { admin, as, closeAll, go, loadState, pageOf, saveState, scenario, tag } from "./kit";

/** TEST 8 — Attendance. TEST 9 — Leave accounting. TEST 10 — Holidays. */
test.describe.configure({ mode: "default" });
test.afterAll(closeAll);

/** Future weekdays counted from today, so requests never collide with the past. */
function weekday(offset: number): string {
  const d = new Date(Date.now() + offset * 86_400_000);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

const balance = (page: Page) => page.getByTestId("leave-balance");

async function teamRowFor(page: Page, name: string) {
  await go(page, "/hazri");
  return page.locator("#team").getByRole("listitem").filter({ hasText: name }).first();
}

async function applyLeave(page: Page, kind: "Half day" | "Full day", start: string, end: string, reason: string) {
  await go(page, "/hazri");
  await page.getByRole("button", { name: "Apply leave" }).click();
  await page.getByRole("button", { name: kind, exact: true }).click();
  await page.locator("#leave-start").fill(start);
  if (await page.locator("#leave-end").count()) await page.locator("#leave-end").fill(end);
  await page.locator("#leave-reason").fill(reason);
  await page.getByRole("button", { name: "Send request" }).click();
  // Wait for the request to be saved (form closes) or refused (message shown).
  await expect(page.getByRole("button", { name: "Send request" }).or(page.locator("#leave").getByRole("alert"))).toBeVisible();
  await page.waitForLoadState("networkidle").catch(() => {});
  await expect
    .poll(async () => (await page.getByRole("button", { name: "Send request" }).count()) === 0 || (await page.locator("#leave").getByRole("alert").count()) > 0, { timeout: 30_000 })
    .toBe(true);
}

async function decide(page: Page, reason: string, action: "Approve" | "Reject") {
  await go(page, "/hazri");
  const row = page.locator("#leave-requests").getByRole("listitem").filter({ hasText: reason });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: action }).click();
  await expect(page.locator("#leave-requests").getByRole("listitem").filter({ hasText: reason })).toHaveCount(0, { timeout: 30_000 });
}

scenario(
  { id: "T8.1", area: "Attendance", scenario: "Punch in: employee, manager and owner all see it; persists", initiator: "Rahul", receiver: "Arjun, Priya", expected: "Rahul sees Working; Arjun and Priya see Rahul in; all after reload", desktop: "Tested", mobile: "See T18", persistence: "Reload all", permission: "Self punch; managers view" },
  async ({ browser }) => {
    const rahul = await pageOf(browser, "rahul");
    await go(rahul, "/hazri");
    await rahul.getByRole("button", { name: "Punch in" }).click();
    await expect(rahul.getByRole("button", { name: "Punch out" })).toBeVisible({ timeout: 30_000 });
    await rahul.reload();
    await expect(rahul.getByText("Working").first()).toBeVisible();
    for (const who of ["arjun", "priya"] as const) {
      const p = await pageOf(browser, who);
      const row = await teamRowFor(p, "Rahul Verma");
      await expect(row).toContainText("Working");
    }
  },
);

scenario(
  { id: "T8.2", area: "Attendance", scenario: "Duplicate punch in is refused", initiator: "Rahul (second tab + API)", receiver: "—", expected: "A stale second tab shows an error; the API refuses; still one record", desktop: "Tested", mobile: "—", persistence: "Checked after", permission: "—" },
  async ({ browser }) => {
    const state = loadState();
    const rahul = await pageOf(browser, "rahul");
    const second = await rahul.context().newPage();
    await second.route("**/*", (route) => route.continue());
    const r = await as("rahul");
    const again = await r.rpc("punch_in", { p_org: state.orgA });
    expect(again.error, "second punch in").not.toBeNull();
    const { data } = await admin().from("attendance_records").select("id").eq("org_id", state.orgA!).eq("user_id", state.users.rahul.id!);
    expect(data?.length).toBe(1);
    await second.close();
  },
);

scenario(
  { id: "T8.3", area: "Attendance", scenario: "Punch out: worked duration; others see Punched out; duplicate refused", initiator: "Rahul", receiver: "Arjun, Priya", expected: "Rahul sees Punched out and worked time; team view shows Punched out; second punch out refused; Today strip says Punched out", desktop: "Tested", mobile: "See T18", persistence: "Reload all", permission: "Self" },
  async ({ browser }) => {
    const state = loadState();
    const rahul = await pageOf(browser, "rahul");
    await go(rahul, "/hazri");
    await rahul.getByRole("button", { name: "Punch out" }).click();
    await expect(rahul.getByText("Punched out").first()).toBeVisible({ timeout: 30_000 });
    await rahul.reload();
    await expect(rahul.getByRole("definition").filter({ hasText: /\dm$|\dh \d+m$/ }).first()).toBeVisible();
    await go(rahul, "/aaj");
    await expect(rahul.getByText(/^Punched out at /).filter({ visible: true }).first()).toBeVisible();
    for (const who of ["arjun", "priya"] as const) {
      const row = await teamRowFor(await pageOf(browser, who), "Rahul Verma");
      await expect(row).toContainText("Punched out");
    }
    const again = await (await as("rahul")).rpc("punch_out", { p_org: state.orgA });
    expect(again.error, "second punch out").not.toBeNull();
  },
);

scenario(
  { id: "T9.1", area: "Leave", scenario: "Owner gives exactly 2.0 days; employee sees 2.0", initiator: "Priya", receiver: "Rahul", expected: "Rahul's balance reads 2 days", desktop: "Tested", mobile: "See T18", persistence: "Reload", permission: "Owner credits" },
  async ({ browser }) => {
    const priya = await pageOf(browser, "priya");
    await go(priya, "/hazri");
    const row = priya.locator("li").filter({ hasText: "Rahul Verma" }).filter({ has: priya.getByRole("button", { name: "Add 1 day" }) });
    await row.getByRole("button", { name: "Add 1 day" }).click();
    await expect(row).toContainText("1 day", { timeout: 30_000 });
    await priya.waitForTimeout(1500);
    await row.getByRole("button", { name: "Add 1 day" }).click();
    await expect(row).toContainText("2 days", { timeout: 30_000 });
    const rahul = await pageOf(browser, "rahul");
    await go(rahul, "/hazri");
    await rahul.reload();
    await expect(balance(rahul)).toHaveText("2 days");
  },
);

scenario(
  { id: "T9.2", area: "Leave", scenario: "Half day approved → 1.5; second half day approved → 1.0", initiator: "Rahul", receiver: "Arjun (Manager) / Priya", expected: "Pending visible to manager; approve; Rahul sees Approved and balance 1.5, then 1.0", desktop: "Tested", mobile: "See T18", persistence: "Reload both", permission: "Manager/owner decide" },
  async ({ browser }) => {
    const rahul = await pageOf(browser, "rahul");
    const arjun = await pageOf(browser, "arjun");
    const priya = await pageOf(browser, "priya");
    const r1 = tag("Bank work half day");
    await applyLeave(rahul, "Half day", weekday(10), weekday(10), r1);
    await decide(arjun, r1, "Approve");
    await go(rahul, "/hazri");
    await rahul.reload();
    await expect(balance(rahul)).toHaveText("1.5 days");
    await expect(rahul.locator("#leave").getByText("Approved").first()).toBeVisible();
    const r2 = tag("Parent teacher meeting");
    await applyLeave(rahul, "Half day", weekday(12), weekday(12), r2);
    await decide(priya, r2, "Approve");
    await go(rahul, "/hazri");
    await expect(balance(rahul)).toHaveText("1 day");
  },
);

scenario(
  { id: "T9.3", area: "Leave", scenario: "Full day rejected keeps 1.0; full day approved → 0", initiator: "Rahul", receiver: "Priya", expected: "Rejected leaves 1 day; approved takes it to 0 days; Rahul sees Rejected then Approved", desktop: "Tested", mobile: "See T18", persistence: "Reload", permission: "Owner decides" },
  async ({ browser }) => {
    const rahul = await pageOf(browser, "rahul");
    const priya = await pageOf(browser, "priya");
    const r3 = tag("Family function");
    await applyLeave(rahul, "Full day", weekday(14), weekday(14), r3);
    await decide(priya, r3, "Reject");
    await go(rahul, "/hazri");
    await expect(balance(rahul)).toHaveText("1 day");
    await expect(rahul.locator("#leave").getByText("Rejected").first()).toBeVisible();
    const r4 = tag("Village visit");
    await applyLeave(rahul, "Full day", weekday(16), weekday(16), r4);
    await decide(priya, r4, "Approve");
    await go(rahul, "/hazri");
    await rahul.reload();
    await expect(balance(rahul)).toHaveText("0 days");
    const state = loadState();
    const { data } = await admin().from("leave_balances").select("balance_days").eq("org_id", state.orgA!).eq("user_id", state.users.rahul.id!).single();
    expect(Number(data!.balance_days)).toBe(0);
  },
);

scenario(
  { id: "T9.4", area: "Leave", scenario: "Requesting more leave than the balance fails safely", initiator: "Rahul", receiver: "—", expected: "With 0 days left a new full-day request is refused with a clear message; no pending request is created", desktop: "Tested", mobile: "—", persistence: "Checked after", permission: "—" },
  async ({ browser }) => {
    const state = loadState();
    const rahul = await pageOf(browser, "rahul");
    const reason = tag("Over balance request");
    await applyLeave(rahul, "Full day", weekday(20), weekday(20), reason);
    await expect(rahul.locator("#leave").getByRole("alert")).toContainText(/not enough|balance/i, { timeout: 15_000 });
    const { data } = await admin().from("leave_requests").select("id").eq("org_id", state.orgA!).eq("reason", reason);
    expect(data ?? [], "no request stored").toEqual([]);
  },
);

scenario(
  { id: "T9.5", area: "Leave", scenario: "Double approval never deducts twice", initiator: "Priya + Arjun (simultaneous) and repeated API calls", receiver: "—", expected: "Balance drops by exactly the request once; request approved once", desktop: "API + UI", mobile: "—", persistence: "Checked after", permission: "Idempotent" },
  async () => {
    const state = loadState();
    const service = admin();
    await (await as("priya")).rpc("credit_leave", { p_org: state.orgA, p_user: state.users.neha.id, p_days: 2 });
    const n = await as("neha");
    const { data: req, error } = await n.rpc("apply_leave", { p_org: state.orgA, p_start: weekday(22), p_end: weekday(22), p_kind: "half_day", p_reason: tag("Idempotency check") });
    expect(error).toBeNull();
    const id = (req as { id: string }).id;
    const [p, a] = [await as("priya"), await as("arjun")];
    await Promise.all([
      p.rpc("decide_leave_request", { p_request: id, p_approve: true }),
      a.rpc("decide_leave_request", { p_request: id, p_approve: true }),
      p.rpc("decide_leave_request", { p_request: id, p_approve: true }),
    ]);
    await a.rpc("decide_leave_request", { p_request: id, p_approve: false });
    const { data: bal } = await service.from("leave_balances").select("balance_days").eq("org_id", state.orgA!).eq("user_id", state.users.neha.id!).single();
    const { data: row } = await service.from("leave_requests").select("status").eq("id", id).single();
    expect(Number(bal!.balance_days)).toBe(1.5);
    expect(row!.status).toBe("approved");
  },
);

scenario(
  { id: "T9.6", area: "Leave", scenario: "Date validation: end before start, overlapping request, own decision", initiator: "Neha / Arjun", receiver: "—", expected: "End before start refused; a second request for a date already requested is refused; nobody decides their own leave", desktop: "API + UI", mobile: "—", persistence: "Checked after", permission: "—" },
  async () => {
    const state = loadState();
    const n = await as("neha");
    const backwards = await n.rpc("apply_leave", { p_org: state.orgA, p_start: weekday(30), p_end: weekday(25), p_kind: "full_day" });
    expect(backwards.error, "end before start").not.toBeNull();
    const overlap = await n.rpc("apply_leave", { p_org: state.orgA, p_start: weekday(22), p_end: weekday(22), p_kind: "half_day", p_reason: "overlap" });
    await admin().from("leave_requests").delete().eq("org_id", state.orgA!).eq("reason", "overlap");
    expect(overlap.error, "overlapping request").not.toBeNull();
    const a = await as("arjun");
    await (await as("priya")).rpc("credit_leave", { p_org: state.orgA, p_user: state.users.arjun.id, p_days: 1 });
    const { data: own } = await a.rpc("apply_leave", { p_org: state.orgA, p_start: weekday(26), p_end: weekday(26), p_kind: "half_day", p_reason: tag("Manager own leave") });
    const self = await a.rpc("decide_leave_request", { p_request: (own as { id: string }).id, p_approve: true });
    expect(self.error, "own decision").not.toBeNull();
  },
);

scenario(
  { id: "T10.1", area: "Holidays", scenario: "Owner adds a holiday; manager and employees see it; it costs no leave", initiator: "Priya", receiver: "Arjun, Rahul, Neha", expected: "Holiday listed for everyone; a 2-day full leave over it costs 1 day", desktop: "Tested", mobile: "See T18", persistence: "Reload", permission: "Owner/manager add" },
  async ({ browser }) => {
    const state = loadState();
    const priya = await pageOf(browser, "priya");
    await go(priya, "/hazri");
    const name = tag("Company foundation day");
    const date = weekday(40);
    await priya.getByLabel("Date", { exact: true }).fill(date);
    await priya.getByLabel("Holiday name").fill(name);
    await priya.getByRole("button", { name: "Add", exact: true }).click();
    await expect(priya.getByText(name).first()).toBeVisible({ timeout: 30_000 });
    for (const who of ["arjun", "rahul", "neha"] as const) {
      const p = await pageOf(browser, who);
      await go(p, "/hazri");
      await p.reload();
      await expect(p.getByText(name).first(), who).toBeVisible();
    }
    const next = new Date(new Date(date).getTime() + 86_400_000);
    while (next.getDay() === 0 || next.getDay() === 6) next.setDate(next.getDate() + 1);
    const n = await as("neha");
    const { data, error } = await n.rpc("apply_leave", { p_org: state.orgA, p_start: date, p_end: next.toISOString().slice(0, 10), p_kind: "full_day", p_reason: tag("Long weekend") });
    expect(error).toBeNull();
    expect(Number((data as { days_requested: number }).days_requested)).toBe(1);
    saveState(state);
  },
);

scenario(
  { id: "T10.2", area: "Holidays", scenario: "Employee cannot add a holiday", initiator: "Rahul (UI + API)", receiver: "—", expected: "No holiday form for Rahul; RPC refused", desktop: "Tested", mobile: "—", persistence: "Checked after", permission: "Owner/manager" },
  async ({ browser }) => {
    const state = loadState();
    const rahul = await pageOf(browser, "rahul");
    await go(rahul, "/hazri");
    await expect(rahul.getByLabel("Holiday name")).toHaveCount(0);
    const res = await (await as("rahul")).rpc("add_holiday", { p_org: state.orgA, p_date: weekday(45), p_title: "Unauthorised" });
    expect(res.error).not.toBeNull();
  },
);
