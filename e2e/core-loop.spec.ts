import { expect, test, type Page } from "@playwright/test";
import { signInAs, signOut } from "./support/auth";

/**
 * Finishing always offers the proof sheet. These tasks ask for no photo, so
 * the sheet offers "without a proof" and the task closes from there.
 */
async function finish(page: Page) {
  await page.getByRole("button", { name: "Ho gaya" }).click();
  await page.getByRole("button", { name: "Bina proof ke" }).click();
}

/**
 * The core path the whole product exists for:
 * create → acknowledge → accept → in progress → done → verify.
 *
 * Two real browser contexts, so the owner and the staff member are genuinely
 * two people and every transition goes through the server's authorization.
 */
test.describe.configure({ mode: "serial" });

async function createTask(page: Page, title: string) {
  await page.goto("/naya");
  await page.getByRole("button", { name: /^Kisko/ }).click();
  await page.getByRole("button", { name: "Raju" }).click();
  await page.getByRole("button", { name: /^Kya/ }).click();
  await page.getByRole("textbox", { name: "Kya" }).fill(title);
  await page.getByRole("button", { name: "Save" }).click();
  await page.getByRole("button", { name: "Bhejo" }).click();
  await expect(page).toHaveURL(/\/aaj$/);
}

async function openTask(page: Page, title: string) {
  await page.goto("/aaj");
  await page.getByText(title).click();
  await expect(page).toHaveURL(/\/kaam\/[0-9a-f-]{36}$/);
}

test("create → acknowledge → done → verify", async ({ page, browser }) => {
  const title = `Loop ${Date.now()}`;

  // --- The owner sends the work.
  await signOut(page);
  await signInAs(page, "owner");
  await createTask(page, title);

  // --- The staff member sees it, and the stepper starts at Bheja.
  const staffContext = await browser.newContext();
  const staff = await staffContext.newPage();
  await staff.request.post("/api/test-login", {
    data: { email: "staff@vaakya.test", password: "vaakya-e2e-staff-pass" },
  });
  await openTask(staff, title);
  await expect(staff.getByRole("heading", { name: "Naya kaam" })).toBeVisible();
  await expect(
    staff.getByRole("progressbar", { name: /Dekhna/ }),
  ).toBeVisible();

  // Each step waits on the audit trail rather than on a timer: the timeline
  // gaining the entry is both the assertion and the signal that the screen has
  // caught up.
  const staffTimeline = staff.getByRole("list", { name: "Timeline" });

  // --- One tap says two things: seen, and it will be done.
  await staff.getByRole("button", { name: "Dekh liya, ho jayega" }).click();
  await expect(staffTimeline).toContainText("Dekha");
  await expect(staffTimeline).toContainText("Maana");

  // The acknowledge clock has stopped, so it is green rather than counting on.
  await expect(
    staff.getByRole("progressbar", { name: /Dekhna/ }),
  ).toHaveAttribute("aria-valuetext", /Dekha/);

  // --- Chal raha, then Ho gaya.
  await staff.getByRole("button", { name: "Shuru kiya" }).click();
  await expect(staffTimeline).toContainText("Chal raha");
  await finish(staff);
  await expect(staffTimeline).toContainText("Ho gaya");

  // The staff member cannot verify their own work.
  await expect(staff.getByRole("button", { name: "Verify karein" })).toHaveCount(0);
  await staffContext.close();

  // --- The owner sees it waiting, and verifies it.
  await openTask(page, title);
  await expect(page.getByRole("button", { name: "Verify karein" })).toBeVisible();
  await page.getByRole("button", { name: "Verify karein" }).click();
  // Wait for the record, not for a timer: navigating early would race the
  // server action rather than test it.
  await expect(page.getByRole("list", { name: "Timeline" })).toContainText(
    "Verified",
  );

  // The glyph on the list is now the green verified tick.
  await page.goto("/aaj");
  const row = page.locator("li", { hasText: title }).first();
  await expect(row.getByRole("img", { name: "Verified" })).toBeVisible();

  // And the timeline records every step, in order, with who did it.
  await openTask(page, title);
  const timeline = page.getByRole("list", { name: "Timeline" });
  await expect(timeline).toContainText("Bheja");
  await expect(timeline).toContainText("Dekha");
  await expect(timeline).toContainText("Maana");
  await expect(timeline).toContainText("Chal raha");
  await expect(timeline).toContainText("Ho gaya");
  await expect(timeline).toContainText("Verified");
  await expect(timeline).toContainText("Raju");
  await expect(timeline).toContainText("Rakesh");
});

test("a verified task is finished — no button moves it again", async ({ page }) => {
  const title = `Final ${Date.now()}`;
  await signOut(page);
  await signInAs(page, "owner");
  await createTask(page, title);

  const staffContext = await page.context().browser()!.newContext();
  const staff = await staffContext.newPage();
  await staff.request.post("/api/test-login", {
    data: { email: "staff@vaakya.test", password: "vaakya-e2e-staff-pass" },
  });
  await openTask(staff, title);
  const trail = staff.getByRole("list", { name: "Timeline" });
  await staff.getByRole("button", { name: "Dekh liya, ho jayega" }).click();
  await expect(trail).toContainText("Maana");
  // Straight to done, without signalling a start: that is allowed on purpose.
  await finish(staff);
  await expect(trail).toContainText("Ho gaya");
  await staffContext.close();

  await openTask(page, title);
  await page.getByRole("button", { name: "Verify karein" }).click();
  await expect(page.getByRole("list", { name: "Timeline" })).toContainText(
    "Verified",
  );

  // Terminal: verify is gone, and so are cancel and reassign.
  await expect(page.getByRole("button", { name: "Verify karein" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Cancel" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Kisi aur ko" })).toBeDisabled();
});

test("the assignee can decline, and it lands with the owner rather than dying", async ({
  page,
  browser,
}) => {
  const title = `Decline ${Date.now()}`;
  await signOut(page);
  await signInAs(page, "owner");
  await createTask(page, title);

  const staffContext = await browser.newContext();
  const staff = await staffContext.newPage();
  await staff.request.post("/api/test-login", {
    data: { email: "staff@vaakya.test", password: "vaakya-e2e-staff-pass" },
  });
  await openTask(staff, title);
  await staff.getByRole("button", { name: "Nahi ho payega" }).first().click();
  await staff
    .getByRole("textbox", { name: "Kaaran" })
    .fill("gaadi kharab hai");
  await staff
    .getByRole("button", { name: "Nahi ho payega" })
    .last()
    .click();
  await expect(staff.getByRole("list", { name: "Timeline" })).toContainText(
    "Aap tak aaya",
  );
  await staffContext.close();

  // The owner's row says so twice — in the meta line and on the chip that
  // replaces the glyph — so the state never depends on colour alone (D-03).
  await page.goto("/aaj");
  const row = page.locator("li", { hasText: title }).first();
  await expect(row.locator("p", { hasText: "Aap tak aaya" })).toBeVisible();
  await expect(
    row.locator("[data-slot='state-chip']", { hasText: "Aap tak aaya" }),
  ).toBeVisible();
  // The glyph is not also shown: a row never carries both (D-11).
  await expect(row.locator("[data-slot='ticks']")).toHaveCount(0);

  await openTask(page, title);
  await expect(page.getByText("gaadi kharab hai")).toBeVisible();

  // Not a dead end: the task can still be reassigned or cancelled.
  await expect(page.getByRole("button", { name: "Kisi aur ko" })).toBeEnabled();
});

test("the reply thread records both sides", async ({ page, browser }) => {
  const title = `Thread ${Date.now()}`;
  await signOut(page);
  await signInAs(page, "owner");
  await createTask(page, title);
  await openTask(page, title);

  await page.getByRole("textbox", { name: "Baat-cheet" }).fill("Kitna time lagega?");
  await page.getByRole("button", { name: "Bhejo" }).click();
  await expect(page.getByText("Kitna time lagega?")).toBeVisible();

  const staffContext = await browser.newContext();
  const staff = await staffContext.newPage();
  await staff.request.post("/api/test-login", {
    data: { email: "staff@vaakya.test", password: "vaakya-e2e-staff-pass" },
  });
  await openTask(staff, title);
  await expect(staff.getByText("Kitna time lagega?")).toBeVisible();
  await staff.getByRole("textbox", { name: "Baat-cheet" }).fill("Do ghante");
  await staff.getByRole("button", { name: "Bhejo" }).click();
  await expect(staff.getByText("Do ghante")).toBeVisible();
  await staffContext.close();

  await page.reload();
  await expect(page.getByText("Do ghante")).toBeVisible();
});
