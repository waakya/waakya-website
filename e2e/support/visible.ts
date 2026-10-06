import type { Locator, Page } from "@playwright/test";

/**
 * The one on screen.
 *
 * The app renders the phone layout and the desktop layout in the same tree and
 * lets a Tailwind breakpoint choose between them, which is what makes one
 * component tree serve both. The cost is that both are in the DOM, so a plain
 * text selector matches twice — once in the layout you can see and once in the
 * one you cannot. These tests run at a phone viewport, so they mean the
 * visible one.
 */
export function onScreen(locator: Locator): Locator {
  return locator.filter({ visible: true });
}

/** The visible text node, wherever it is. */
export function textOnScreen(page: Page, text: string): Locator {
  return onScreen(page.getByText(text));
}

/**
 * Reach a task the way an owner does on Design V3's Today: on the "Aapke
 * liye" list if it is among the first rows of its group, otherwise through
 * that group's "N aur · <group>" link into Work — the busy-day fold. Returns
 * the visible row (a list item) holding the task.
 */
export async function rowFromToday(page: Page, title: string, group: string): Promise<Locator> {
  await page.goto("/aaj");
  // Visual V2: decisions are in "Aapke liye", late and unseen work in "Atka
  // hua"; rows sit inside each band's groups.
  const onToday = onScreen(page.locator('ul[aria-label="Aapke liye"] ul > li, ul[aria-label="Atka hua"] ul > li').filter({ hasText: title }));
  if ((await onToday.count()) > 0) return onToday.first();
  await onScreen(page.getByRole("link", { name: new RegExp(`^\\d+ aur · ${group}`) })).first().click();
  await page.waitForURL(/\/work\?need=/);
  return onScreen(page.getByTestId("work-list").locator("li", { hasText: title })).first();
}
