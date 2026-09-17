import { expect, type Page } from "@playwright/test";
import { as, go } from "./kit";

/** UI flows shared by several scenarios. */
export async function createTaskUI(
  page: Page,
  opts: { assignee: string; title: string; note?: string; urgent?: boolean; proof?: boolean },
) {
  await go(page, "/naya");
  await page.getByRole("button", { name: /^Who/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: opts.assignee }).click();
  await page.getByRole("button", { name: /^What/ }).click();
  await page.getByRole("textbox", { name: "What" }).fill(opts.title);
  await page.getByRole("button", { name: "Save" }).click();
  if (opts.note) {
    await page.getByRole("button", { name: /^Note/ }).click();
    await page.getByRole("textbox", { name: "Note" }).fill(opts.note);
    await page.getByRole("button", { name: "Save" }).click();
  }
  await page.getByRole("group", { name: "By when?" }).getByText(/Tomorrow morning/).click();
  if (opts.urgent) await page.getByRole("group", { name: "Priority" }).getByText("Urgent", { exact: true }).click();
  if (opts.proof) await page.getByRole("switch").click();
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page).toHaveURL(/\/aaj$/, { timeout: 30_000 });
  const { data } = await (await as("priya")).from("tasks").select("id").eq("title", opts.title).single();
  return data!.id as string;
}

export async function openTask(page: Page, id: string) {
  await go(page, `/kaam/${id}`);
  await expect(page.getByRole("list", { name: "Timeline" })).toBeVisible();
}

