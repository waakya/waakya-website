import { expect, test, type Page } from "@playwright/test";
import { admin, PASSWORD } from "./support";

/**
 * Found in manual review: a signed-in member was sent to "Create your
 * business", and creating one failed. The browser carried a session minted by
 * ANOTHER local Supabase stack — same default signing key, same cookie name on
 * localhost — for a user id this stack has never seen.
 *
 * Every sign-in here goes through the real screen: email → the 6-digit code
 * from the local mail inbox → Continue.
 */
test.describe.configure({ mode: "serial" });

const MAILPIT = process.env.MAILPIT_URL ?? "http://127.0.0.1:56424";

// The app allows 5 codes per address per 15 minutes, and this file asks for
// several. The rule is not relaxed: the LOCAL stack's counter rows are cleared
// before the run, so the suite can be re-run without waiting (the config
// refuses any non-local stack).
test.beforeAll(async () => {
  await admin().from("otp_requests").delete().gte("created_at", "1970-01-01");
});
const APP = process.env.DESIGN_BASE ?? "http://localhost:3200";

async function inboxIds(): Promise<Set<string>> {
  const list = await (await fetch(`${MAILPIT}/api/v1/messages?limit=50`)).json();
  return new Set((list.messages ?? []).map((m: { ID: string }) => m.ID));
}

/** The code from the first email to this address that was not there before. */
async function newCode(email: string, before: Set<string>): Promise<string> {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const list = await (await fetch(`${MAILPIT}/api/v1/messages?limit=50`)).json();
    for (const m of list.messages ?? []) {
      if (before.has(m.ID) || m.To?.[0]?.Address !== email) continue;
      const full = await (await fetch(`${MAILPIT}/api/v1/message/${m.ID}`)).json();
      const code = /\b(\d{6})\b/.exec(full.Text ?? "")?.[1];
      if (code) return code;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`no new code email for ${email}`);
}

/** The real sign-in: consent, email, Send code, the emailed code, Continue. */
async function otpSignIn(page: Page, email: string) {
  await page.context().addCookies([{ name: "waakya_lang", value: "en", url: APP }]);
  await page.goto("/login");
  await page.getByRole("checkbox").first().check();
  await page.getByPlaceholder("name@example.com").fill(email);
  const before = await inboxIds();
  await page.getByRole("button", { name: "Send code" }).click();
  const code = await newCode(email, before);
  const box = page.locator('input[autocomplete="one-time-code"]').first();
  await box.click();
  await page.keyboard.type(code);
  await page.locator("form button[type=submit]").first().click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 30_000 });
}

async function signOut(page: Page) {
  await page.goto("/settings");
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL(/\/login|\/$/, { timeout: 20_000 });
}

for (const [who, email, business] of [
  ["owner", "priya@sharma.test", "Sharma Interiors"],
  ["manager", "arjun@sharma.test", "Sharma Interiors"],
  ["staff", "rahul@sharma.test", "Sharma Interiors"],
] as const) {
  test(`existing ${who}: code sign-in lands on Today, never on setup`, async ({ page }) => {
    await otpSignIn(page, email);
    await expect(page).toHaveURL(/\/aaj$/);
    await expect(page.getByText(business).first()).toBeVisible();
    // A refresh and a typed URL are decided on the server, not by client state.
    await page.reload();
    await expect(page).toHaveURL(/\/aaj$/);
    await page.goto("/setup");
    await expect(page).not.toHaveURL(/\/setup$/);
    await page.goto("/work");
    await expect(page).toHaveURL(/\/work$/);
  });
}

test("sign out and in again: the membership holds", async ({ page }) => {
  await otpSignIn(page, "priya@sharma.test");
  await expect(page).toHaveURL(/\/aaj$/);
  await signOut(page);
  await page.goto("/aaj");
  await expect(page).toHaveURL(/\/login/);
  await otpSignIn(page, "priya@sharma.test");
  await expect(page).toHaveURL(/\/aaj$/);
  await expect(page.getByText("Sharma Interiors").first()).toBeVisible();
});

test("another business: only its own data", async ({ page }) => {
  await otpSignIn(page, "kavita@verma.test");
  await expect(page).toHaveURL(/\/aaj$/);
  await expect(page.getByText("Verma Constructions").first()).toBeVisible();
  for (const path of ["/aaj", "/work", "/baat", "/projects", "/documents", "/approvals"]) {
    await page.goto(path);
    await expect(page.getByText(/Sharma Interiors|Kapoor|Sector 76/)).toHaveCount(0);
  }
});

test("a brand-new person: setup creates the business and onboarding finishes", async ({ page }) => {
  const email = `new-owner-${Date.now().toString(36)}@design.test`;
  const name = `Kumar Hardware ${Date.now().toString(36).slice(-4)}`;
  try {
    await otpSignIn(page, email);
    await expect(page).toHaveURL(/\/setup$/);
    await page.getByLabel("Business name").fill(name);
    await page.getByRole("button", { name: "Create business" }).click();
    await expect(page).toHaveURL(/\/setup\/profile$/, { timeout: 30_000 });
    // The failure the reviewer saw; Next's route announcer is also an "alert",
    // so the check is on the words.
    await expect(page.getByText("That did not go through")).toHaveCount(0);
    await page.getByLabel("Business address").fill("Shop 12, Sector 18, Noida");
    await page.getByLabel("Business phone").fill("9876512345");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL(/\/staff$/, { timeout: 30_000 });
    await expect(page.getByText(name).first()).toBeVisible();

    // And it is theirs the next time too.
    await signOut(page);
    await otpSignIn(page, email);
    await expect(page).toHaveURL(/\/aaj$/);
    await expect(page.getByText(name).first()).toBeVisible();
  } finally {
    const db = admin();
    await db.from("orgs").delete().eq("name", name);
    const users = (await db.auth.admin.listUsers({ perPage: 1000 })).data.users;
    const created = users.find((u) => u.email === email);
    if (created) await db.auth.admin.deleteUser(created.id);
  }
});

test("a valid session for a user this stack does not have is signed out, not sent to setup", async ({ page }) => {
  // The same shape as the bug: a genuinely signed session whose user id does
  // not exist here. Made by signing a throwaway user in, then removing them.
  const db = admin();
  const email = `ghost-${Date.now().toString(36)}@design.test`;
  const { data } = await db.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true });
  const r = await page.request.post("/api/test-login", { data: { email, password: PASSWORD } });
  expect(r.ok()).toBe(true);
  await db.auth.admin.deleteUser(data.user!.id);

  await page.goto("/aaj");
  await expect(page).toHaveURL(/\/login/);
  await page.goto("/setup");
  await expect(page).toHaveURL(/\/login/);
});

test("a session cookie from another local stack is not this app's session", async ({ page }) => {
  // The other Waakya stack on this machine writes sb-127-auth-token on
  // localhost; this app's session lives in sb-localhost-auth-token.
  await page.context().addCookies([
    { name: "sb-127-auth-token", value: "base64-eyJhY2Nlc3NfdG9rZW4iOiJ4In0", url: APP },
  ]);
  await page.goto("/aaj");
  await expect(page).toHaveURL(/\/login/);
  await otpSignIn(page, "neha@sharma.test");
  await expect(page).toHaveURL(/\/aaj$/);
  const names = (await page.context().cookies(APP)).map((c) => c.name);
  expect(names.some((n) => n.startsWith("sb-localhost-auth-token"))).toBe(true);
});
