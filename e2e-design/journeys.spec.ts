import { expect, test } from "@playwright/test";
import { admin, overflowPx, sharmaId, signIn } from "./support";

/**
 * The three journeys, operated for real on the redesigned screens:
 *  - the employee on a phone: Today → open → accept → start → proof → done;
 *  - the owner on a desk: verify it, and the record stays;
 *  - the manager on a desk: decide an approval, and it looks decided.
 * Each test first puts its seeded records back, so the file re-runs.
 */
test.describe.configure({ mode: "serial" });

const TASK = "Call Kapoor ji to confirm the site visit time for Saturday";
const APPROVAL = "Extra tile spacers for the master bath — ₹1,200";

test.beforeAll(async () => {
  const db = admin();
  const id = await sharmaId("task", TASK);
  // Service-role writes skip the task guard (no auth.uid), exactly as the SLA
  // job does; this only rewinds seeded demo data on the local stack.
  await db.from("proofs").delete().eq("task_id", id);
  await db.from("task_events").delete().eq("task_id", id).neq("to_state", "delivered");
  await db
    .from("tasks")
    .update({ state: "delivered", acknowledged_at: null, accepted_at: null, started_at: null, done_at: null, verified_at: null })
    .eq("id", id);
  // A request addressed to the manager, pending again.
  const { data: org } = await db.from("orgs").select("id").eq("name", "Sharma Interiors").single();
  const users = (await db.auth.admin.listUsers({ perPage: 1000 })).data.users;
  const uid = (email: string) => users.find((u) => u.email === email)!.id;
  await db.from("approvals").delete().eq("title", APPROVAL);
  await db.from("approvals").insert({
    org_id: org!.id,
    title: APPROVAL,
    details: "Two packets of 3 mm spacers from the Sector 18 hardware shop.",
    status: "pending",
    requested_by: uid("imran@sharma.test"),
    approver_id: uid("arjun@sharma.test"),
  });
});

test("@phone employee does the work on a phone; the owner verifies on a desk", async ({ page, browser }) => {
  await signIn(page, "rahul");
  await page.goto("/aaj");
  expect(await overflowPx(page)).toBeLessThanOrEqual(0);

  await page.getByRole("link", { name: TASK }).first().click();
  await expect(page).toHaveURL(/\/kaam\//);

  // One obvious next step at a time, always in the bottom third.
  const accept = page.getByRole("button", { name: "Seen, will do" });
  await expect(accept).toBeInViewport();
  await accept.click();
  const timeline = page.getByRole("list", { name: "Timeline" });
  await expect(timeline).toContainText("Accepted");

  await page.getByRole("button", { name: "Started" }).click();
  await expect(timeline).toContainText("In progress");

  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Done? Send the proof" })).toBeVisible();
  await page.getByRole("button", { name: "Write" }).click();
  await page.getByRole("textbox", { name: "Write" }).fill("Called Kapoor ji: Saturday 11 am confirmed.");
  await page.getByRole("button", { name: "Send · done" }).click();

  await expect(timeline).toContainText("Done");
  await expect(page.getByText("Called Kapoor ji: Saturday 11 am confirmed.")).toBeVisible();
  // Finished work is a record, not a countdown.
  await expect(page.getByRole("progressbar", { name: /Acknowledge/ })).toHaveCount(0);

  // --- the owner, at a desk ------------------------------------------------
  const desk = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const owner = await desk.newPage();
  await signIn(owner, "priya");
  const id = await sharmaId("task", TASK);
  await owner.goto(`/kaam/${id}`);
  const verify = owner.getByRole("button", { name: "Verify", exact: true });
  // Desktop: the next step sits beside the record, in the first viewport.
  await expect(verify).toBeInViewport();
  await expect(owner.getByText("Called Kapoor ji: Saturday 11 am confirmed.")).toBeVisible();
  await verify.click();
  const record = owner.getByRole("list", { name: "Timeline" });
  await expect(record).toContainText("Verified");
  await expect(owner.getByRole("button", { name: "Verify", exact: true })).toHaveCount(0);
  await owner.reload();
  await expect(owner.getByRole("list", { name: "Timeline" })).toContainText("Verified");
  await desk.close();
});

test("manager: an approval decided looks decided, with no controls left", async ({ page }) => {
  await signIn(page, "arjun");
  await page.goto("/approvals");
  // Addressed to Arjun, so it waits on him — and only then offers a decision.
  const waiting = page.getByRole("list", { name: "Waiting for you" });
  const card = waiting.getByTestId("approval-card").filter({ hasText: APPROVAL });
  await expect(card).toBeVisible();
  await card.getByLabel("Details").fill("Go ahead, two helpers for three days.");
  await card.getByRole("button", { name: "Approve" }).click();
  const decided = page.getByTestId("approval-card").filter({ hasText: APPROVAL }).first();
  await expect(decided.getByText("Approved", { exact: true })).toBeVisible();
  await expect(decided.getByRole("button", { name: "Approve" })).toHaveCount(0);
});

test("@phone navigation: four places and More; detail screens bring their own bar", async ({ page }) => {
  await signIn(page, "priya");
  await page.goto("/aaj");
  const nav = page.getByRole("navigation", { name: "Main" });
  // Design V3: the places used most days; attendance is a line on Today.
  for (const place of ["Today", "Conversations", "Work", "More"]) {
    await expect(nav.getByRole("link", { name: place })).toBeVisible();
  }
  await nav.getByRole("link", { name: "More" }).click();
  await expect(page).toHaveURL(/\/more$/);
  for (const place of ["Projects", "Documents", "Attendance", "Approvals", "Team"]) {
    await expect(page.getByRole("main").getByRole("link", { name: new RegExp(place) }).first()).toBeVisible();
  }
  expect(await overflowPx(page)).toBeLessThanOrEqual(0);

  const id = await sharmaId("conversation", "Site team");
  await page.goto(`/baat/${id}`);
  await expect(page.getByRole("navigation", { name: "Main" })).toHaveCount(0);
});
