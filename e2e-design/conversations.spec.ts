import { expect, test } from "@playwright/test";
import { admin, overflowPx, sharmaId, signIn } from "./support";

/**
 * Conversations after Design V2: the thread opens at the newest message, the
 * composer never covers a message, and Message → Task asks who and by when
 * before anything is created — then shows the task's real state.
 */
test.describe.configure({ mode: "serial" });

// Re-runnable: the task this file makes from a message is removed first, so
// the message is free to become work again.
test.beforeAll(async () => {
  await admin().from("tasks").delete().eq("title", "Meet the electrician on site at 2:45");
});

test("a thread opens at the newest message with the composer clear of it", async ({ page }) => {
  await signIn(page, "priya");
  const id = await sharmaId("conversation", "Site team");
  await page.goto(`/baat/${id}`);

  const newest = page.getByRole("main").getByText("Main kal subah 9 baje site pe safai karwa dungi.");
  await expect(newest).toBeInViewport();
  const composer = page.getByRole("textbox", { name: "Write a message" });
  const [msg, box] = await Promise.all([newest.boundingBox(), composer.boundingBox()]);
  expect(msg!.y + msg!.height).toBeLessThanOrEqual(box!.y);

  // Desktop keeps the list beside the thread, with this one marked current.
  const list = page.getByRole("list", { name: "Conversations" });
  await expect(list.getByRole("link", { name: /Site team/ })).toHaveAttribute("aria-current", "page");
});

test("Message → Task: always visible, asks who and by when, shows live state", async ({ page }) => {
  await signIn(page, "priya");
  const id = await sharmaId("conversation", "Site team");
  await page.goto(`/baat/${id}`);

  const message = page.getByRole("main").getByText("I'll be there by 2:45.");
  const action = page
    .getByRole("main")
    .locator("li")
    .filter({ hasText: "I'll be there by 2:45." })
    .getByTestId("make-task");
  // Design V3: the core loop is never hidden behind hover — quiet but
  // visible at rest, with a real target (it was invisible on desktop in V2).
  await expect(action).toBeVisible();
  await expect(action).toHaveCSS("opacity", "1");
  expect((await action.boundingBox())!.height).toBeGreaterThanOrEqual(40);
  await message.hover();
  await action.click();

  const form = page.locator("form").filter({ hasText: "Task created from this message" });
  await expect(form.getByRole("textbox", { name: "What needs doing" })).toHaveValue("I'll be there by 2:45.");
  await form.getByRole("textbox", { name: "What needs doing" }).fill("Meet the electrician on site at 2:45");
  await expect(form.getByRole("group", { name: "Who owns it" })).toBeVisible();
  // The author of someone else's message is the default owner.
  await expect(form.getByRole("button", { name: "Arjun Mehta" })).toHaveAttribute("aria-pressed", "true");
  const byWhen = form.getByRole("group", { name: "By when" });
  await expect(byWhen.getByRole("button")).toHaveCount(3);
  await byWhen.getByRole("button", { name: "Tomorrow, 10 am" }).click();
  await expect(byWhen.getByRole("button", { name: "Tomorrow, 10 am" })).toHaveAttribute("aria-pressed", "true");
  await form.getByRole("button", { name: "Create task" }).click();

  const link = page.getByRole("link", { name: /Task created · Arjun Mehta · Sent/ });
  await expect(link).toBeVisible({ timeout: 30_000 });

  // The deadline chosen is the deadline stored: 10:00 tomorrow, India time.
  const { data } = await admin().from("tasks").select("due_at, source_message_id").eq("title", "Meet the electrician on site at 2:45").single();
  expect(data!.source_message_id).toBeTruthy();
  const due = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" }).format(new Date(data!.due_at!));
  expect(due).toBe("10:00");

  // The link survives a reload, because it is read from the database.
  await page.reload();
  await expect(page.getByRole("link", { name: /Task created · Arjun Mehta/ })).toBeVisible();
});

test("@phone the thread fits a phone and Make task sits on the message line", async ({ page }) => {
  await signIn(page, "priya");
  const id = await sharmaId("conversation", "Site team");
  await page.goto(`/baat/${id}`);
  await expect(page.getByTestId("make-task").first()).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Write a message" })).toBeInViewport();
  expect(await overflowPx(page)).toBeLessThanOrEqual(0);
});
