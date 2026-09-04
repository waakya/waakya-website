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
