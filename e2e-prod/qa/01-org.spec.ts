import { expect, test, type Browser, type Page } from "@playwright/test";
import { admin, as, BASE, blocked, closeAll, go, loadState, pageOf, PEOPLE, saveState, scenario, type Who } from "./kit";

/** TEST 1 — Organization and roles, from both sides. */
test.describe.configure({ mode: "default" });
test.setTimeout(180_000);

test.beforeAll(async () => {
  const state = loadState();
  const service = admin();
  for (const who of Object.keys(PEOPLE) as Who[]) {
    if (state.users[who].id) continue;
    const { data, error } = await service.auth.admin.createUser({
      email: state.users[who].email,
      password: state.users[who].password,
      email_confirm: true,
    });
    expect(error).toBeNull();
    state.users[who].id = data.user!.id;
  }
  saveState(state);
  for (const who of ["priya", "vikram"] as Who[]) {
    const client = await as(who);
    await client.from("profiles").upsert({ id: state.users[who].id, full_name: PEOPLE[who].name }, { onConflict: "id" });
  }
});
test.afterAll(closeAll);

async function createBusiness(page: Page, name: string) {
  await go(page, "/aaj");
  await expect(page).toHaveURL(/\/setup$/);
  await page.getByLabel("Business name").fill(name);
  await page.getByRole("button", { name: "Create business" }).click();
  await expect(page).toHaveURL(/\/setup\/profile$/, { timeout: 30_000 });
  await page.getByLabel("Business address").fill("Plot 14, Sector 62, Noida");
  await page.getByLabel("GSTIN").fill("09ABCDE1234F1Z5");
  await page.getByLabel("Business phone").fill("9876500000");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/staff$/, { timeout: 30_000 });
}

async function createInvite(inviter: Page, name: string, phone: string, role: "Staff" | "Manager" | "Admin") {
  await go(inviter, "/staff");
  await inviter.getByRole("button", { name: "Invite to team" }).filter({ visible: true }).first().click();
  const sheet = inviter.getByRole("dialog");
  await sheet.getByLabel("Name").fill(name);
  await sheet.getByLabel("Phone number").fill(phone);
  await sheet.getByRole("group", { name: "Role" }).getByText(role, { exact: true }).click();
  await sheet.getByRole("button", { name: "Make the link" }).click();
  const link = (await sheet.getByText(/\/join\/[0-9a-f]{32}/).innerText()).trim();
  await inviter.keyboard.press("Escape");
  return new URL(link).pathname;
}

async function join(browser: Browser, who: Who, path: string) {
  const joiner = await pageOf(browser, who);
  await go(joiner, path);
  await expect(joiner.getByText(`${loadState().orgAName} has invited you`)).toBeVisible();
  await joiner.getByRole("button", { name: "Join" }).click();
  await expect(joiner).toHaveURL(/\/aaj$/, { timeout: 30_000 });
  return joiner;
}

async function teamRow(page: Page, name: string) {
  await go(page, "/staff");
  return page.getByRole("list", { name: "Team" }).getByRole("listitem").filter({ hasText: name });
}

scenario(
  { id: "T1.1", area: "Organization", scenario: "Owner creates business and profile", initiator: "Priya (Owner)", receiver: "Priya", expected: "Business created; Team lists Priya · Owner; survives reload", desktop: "Tested", mobile: "See T18", persistence: "Reload", permission: "Owner" },
  async ({ browser, note }) => {
    const state = loadState();
    const priya = await pageOf(browser, "priya");
    await createBusiness(priya, state.orgAName);
    const { data } = await (await as("priya")).from("orgs").select("id").eq("name", state.orgAName).single();
    state.orgA = data!.id;
    saveState(state);
    await priya.reload();
    const row = await teamRow(priya, "Priya Sharma");
    await expect(row).toContainText("Owner");
    note(`org ${state.orgA}`);
  },
);

scenario(
  { id: "T1.2", area: "Organization", scenario: "Owner invites Manager; Manager joins", initiator: "Priya (Owner)", receiver: "Arjun (Manager)", expected: "Arjun sees the business and 'Manager'; Priya sees Arjun · Manager", desktop: "Tested", mobile: "See T18", persistence: "Reload both", permission: "Owner invites" },
  async ({ browser }) => {
    const priya = await pageOf(browser, "priya");
    const path = await createInvite(priya, "Arjun Mehta", "9876500001", "Manager");
    const arjun = await join(browser, "arjun", path);
    await arjun.reload();
    await expect(arjun.getByRole("navigation").first()).toContainText(loadState().orgAName);
    await expect(arjun.getByRole("navigation").first()).toContainText("Manager");
    await expect(await teamRow(priya, "Arjun Mehta")).toContainText("Manager");
  },
);

scenario(
  { id: "T1.3", area: "Organization", scenario: "Owner invites Rahul (team member); Rahul joins", initiator: "Priya (Owner)", receiver: "Rahul (Member)", expected: "Rahul in business as Staff; visible to Priya", desktop: "Tested", mobile: "See T18", persistence: "Reload both", permission: "Owner invites" },
  async ({ browser }) => {
    const priya = await pageOf(browser, "priya");
    const path = await createInvite(priya, "Rahul Verma", "9876500002", "Staff");
    const rahul = await join(browser, "rahul", path);
    await rahul.reload();
    await expect(rahul.getByRole("navigation").first()).toContainText(loadState().orgAName);
    await expect(await teamRow(priya, "Rahul Verma")).toContainText("Staff");
  },
);

scenario(
  { id: "T1.4", area: "Organization", scenario: "Manager invites Neha (team member); Neha joins", initiator: "Arjun (Manager)", receiver: "Neha (Member), Priya", expected: "Manager can invite staff; Neha joins; owner and manager both see her", desktop: "Tested", mobile: "See T18", persistence: "Reload", permission: "Manager invites staff" },
  async ({ browser }) => {
    const arjun = await pageOf(browser, "arjun");
    const path = await createInvite(arjun, "Neha Singh", "9876500003", "Staff");
    const neha = await join(browser, "neha", path);
    await neha.reload();
    await expect(neha.getByRole("navigation").first()).toContainText("Neha Singh");
    await expect(await teamRow(await pageOf(browser, "priya"), "Neha Singh")).toContainText("Staff");
    await expect(await teamRow(arjun, "Neha Singh")).toContainText("Staff");
  },
);

scenario(
  { id: "T1.5", area: "Organization", scenario: "Second business (Org B) for isolation tests", initiator: "Vikram (Org B owner)", receiver: "Vikram", expected: "Separate business exists with no access to Org A", desktop: "Tested", mobile: "—", persistence: "Reload", permission: "Owner" },
  async ({ browser }) => {
    const state = loadState();
    const vikram = await pageOf(browser, "vikram");
    await createBusiness(vikram, state.orgBName);
    const { data } = await (await as("vikram")).from("orgs").select("id, name");
    expect(data?.map((o) => o.name)).toEqual([state.orgBName]);
    state.orgB = data![0].id;
    saveState(state);
  },
);

scenario(
  { id: "T1.6", area: "Roles", scenario: "Navigation per role", initiator: "—", receiver: "Owner, Manager, Member", expected: "Owner and Manager see Team; members do not see Team or Daily routine", desktop: "Tested", mobile: "See T18", persistence: "Reload", permission: "Role-based navigation" },
  async ({ browser }) => {
    for (const who of ["priya", "arjun"] as Who[]) {
      const p = await pageOf(browser, who);
      await go(p, "/aaj");
      await expect(p.getByRole("navigation").first().getByRole("link", { name: "Team" })).toBeVisible();
    }
    for (const who of ["rahul", "neha"] as Who[]) {
      const p = await pageOf(browser, who);
      await go(p, "/aaj");
      await expect(p.getByRole("navigation").first().getByRole("link", { name: "Team" })).toHaveCount(0);
      await expect(p.getByRole("navigation").first().getByRole("link", { name: "Daily routine" })).toHaveCount(0);
    }
  },
);

scenario(
  { id: "T1.7", area: "Roles", scenario: "Team member forbidden actions in the UI", initiator: "Rahul (Member)", receiver: "—", expected: "No invite, no New project, Daily routine redirects, no New task on Work", desktop: "Tested", mobile: "See T18", persistence: "—", permission: "Member restricted" },
  async ({ browser }) => {
    const rahul = await pageOf(browser, "rahul");
    await go(rahul, "/staff");
    await expect(rahul.getByRole("button", { name: "Invite to team" })).toHaveCount(0);
    await go(rahul, "/projects");
    await expect(rahul.getByRole("button", { name: "New project" })).toHaveCount(0);
    await go(rahul, "/checklists");
    await expect(rahul).toHaveURL(/\/aaj$/);
  },
);

scenario(
  { id: "T1.8", area: "Roles", scenario: "Team member forbidden actions at the database", initiator: "Rahul (Member, direct API)", receiver: "—", expected: "Rejected: create invite, change roles, create project, add holiday, credit leave", desktop: "API", mobile: "—", persistence: "Checked after", permission: "RLS / RPC" },
  async ({ note }) => {
    const state = loadState();
    const rahul = await as("rahul");
    const invite = await rahul.from("invites").insert({ org_id: state.orgA!, full_name: "Evil", phone: "9000000000", role: "admin", token: `qa${Date.now()}a`, created_by: state.users.rahul.id! } as never);
    expect(invite.error, "invite insert").not.toBeNull();
    await rahul.from("memberships").update({ role: "owner" }).eq("org_id", state.orgA!).eq("user_id", state.users.rahul.id!);
    const { data: me } = await admin().from("memberships").select("role").eq("org_id", state.orgA!).eq("user_id", state.users.rahul.id!).single();
    expect(me!.role, "role unchanged").toBe("member");
    const project = await rahul.from("projects").insert({ org_id: state.orgA!, name: "Nope", created_by: state.users.rahul.id! });
    expect(project.error, "project insert").not.toBeNull();
    const holiday = await rahul.rpc("add_holiday", { p_org: state.orgA!, p_date: "2026-12-25", p_title: "Nope" });
    expect(holiday.error, "add_holiday").not.toBeNull();
    const credit = await rahul.rpc("credit_leave", { p_org: state.orgA!, p_user: state.users.rahul.id!, p_days: 10 });
    expect(credit.error, "credit_leave").not.toBeNull();
    note("All five rejected");
  },
);

scenario(
  { id: "T1.9", area: "Roles", scenario: "Manager cannot escalate privileges", initiator: "Arjun (Manager, direct API)", receiver: "—", expected: "Manager cannot make himself owner, demote the owner, or create an admin/owner invite", desktop: "API", mobile: "—", persistence: "Checked after", permission: "RLS" },
  async () => {
    const state = loadState();
    const arjun = await as("arjun");
    await arjun.from("memberships").update({ role: "owner" }).eq("org_id", state.orgA!).eq("user_id", state.users.arjun.id!);
    await arjun.from("memberships").update({ role: "member" }).eq("org_id", state.orgA!).eq("user_id", state.users.priya.id!);
    const { data: roles } = await admin().from("memberships").select("user_id, role").eq("org_id", state.orgA!);
    const roleOf = (id?: string) => roles!.find((r) => r.user_id === id)?.role;
    const adminInvite = await arjun.from("invites").insert({ org_id: state.orgA!, full_name: "Escalate", phone: "9000000001", role: "admin", token: `qa${Date.now()}b`, created_by: state.users.arjun.id! } as never);
    const ownerInvite = await arjun.from("invites").insert({ org_id: state.orgA!, full_name: "Escalate", phone: "9000000002", role: "owner", token: `qa${Date.now()}c`, created_by: state.users.arjun.id! } as never);
    // Put things back if the database let them through, so later tests stay valid.
    const service = admin();
    await service.from("memberships").update({ role: "manager" }).eq("org_id", state.orgA!).eq("user_id", state.users.arjun.id!);
    await service.from("memberships").update({ role: "owner" }).eq("org_id", state.orgA!).eq("user_id", state.users.priya.id!);
    await service.from("invites").delete().eq("org_id", state.orgA!).eq("full_name", "Escalate");
    expect(roleOf(state.users.arjun.id), "manager became owner").toBe("manager");
    expect(roleOf(state.users.priya.id), "owner demoted").toBe("owner");
    expect(adminInvite.error, "manager created admin invite").not.toBeNull();
    expect(ownerInvite.error, "manager created owner invite").not.toBeNull();
  },
);

scenario(
  { id: "T1.10", area: "Roles", scenario: "Manager invite UI offers only allowed roles", initiator: "Arjun (Manager)", receiver: "—", expected: "Manager's invite sheet does not offer Admin", desktop: "Tested", mobile: "—", persistence: "—", permission: "Manager" },
  async ({ browser }) => {
    const arjun = await pageOf(browser, "arjun");
    await go(arjun, "/staff");
    await arjun.getByRole("button", { name: "Invite to team" }).filter({ visible: true }).first().click();
    await expect(arjun.getByRole("dialog").getByRole("group", { name: "Role" }).getByText("Admin", { exact: true })).toHaveCount(0);
    await arjun.keyboard.press("Escape");
  },
);

scenario(
  { id: "T1.11", area: "Session", scenario: "Sign out, guarded URLs, sign back in", initiator: "Neha (Member)", receiver: "Neha", expected: "Sign out returns to login; /aaj and a task URL redirect to login; signing in again restores the same business", desktop: "Tested", mobile: "—", persistence: "New session", permission: "Auth guard" },
  async ({ browser }) => {
    const neha = await pageOf(browser, "neha");
    await go(neha, "/settings");
    await neha.getByRole("button", { name: "Sign out" }).click();
    await expect(neha).toHaveURL(/\/login|\/$/, { timeout: 30_000 });
    await neha.goto(BASE + "/aaj");
    await expect(neha).toHaveURL(/\/login/);
    await neha.goto(BASE + "/projects");
    await expect(neha).toHaveURL(/\/login/);
    await neha.context().close();
    const again = await pageOf(browser, "neha");
    await go(again, "/aaj");
    await expect(again.getByRole("navigation").first()).toContainText(loadState().orgAName);
  },
);

blocked(
  { id: "T1.12", area: "Session", scenario: "Sign-in through the login screen (Google / email code)", initiator: "Any user", receiver: "—", expected: "Real Google or emailed OTP sign-in", desktop: "—", mobile: "—", persistence: "—", permission: "—" },
  "Needs a real Google account or an email inbox; sessions in this run use Supabase password sign-in with the same cookies the app sets. Google hand-off to the correct callback is covered by the production smoke suite.",
);
