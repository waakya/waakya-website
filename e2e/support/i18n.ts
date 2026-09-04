import { expect, type Page } from "@playwright/test";
import { dictionaries, isLocale, type Dictionary } from "@/lib/i18n";

/**
 * The copy the page is actually rendering in.
 *
 * Screens follow the *reader's* language — their own choice if they have made
 * one, else their business's. A test that hard-codes Hinglish therefore breaks
 * the moment somebody switches language in Settings, and breaks for a reason
 * that has nothing to do with what it is testing. Reading `<html lang>` keeps
 * the assertion about the behaviour instead.
 */
export async function pageDictionary(page: Page): Promise<Dictionary> {
  const lang = await page.locator("html").getAttribute("lang");
  expect(isLocale(lang), `unexpected <html lang>: ${lang}`).toBe(true);
  return dictionaries[lang as keyof typeof dictionaries];
}
