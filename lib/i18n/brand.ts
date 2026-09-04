import type { Locale } from "./locales";

/**
 * The brand name is a proper noun and is **never translated**.
 *
 * It lives here rather than in the dictionary on purpose. *Vaakya* means
 * "sentence" in Hindi, so the moment the name sits inside translatable copy
 * somebody eventually renders it as the common noun and the consent line reads
 * "I agree to the sentence's Privacy Policy". Keeping it out of the dictionary
 * makes that impossible rather than merely discouraged — `lib/brand/rules.test.ts`
 * fails the build if the name reappears in a dictionary string.
 *
 * The Devanagari wordmark is वाक्य: the same name in the other script, not a
 * translation of it (Design Direction §2.3, `logo/logo-hindi.svg`).
 */
export const BRAND_NAME = "Vaakya";
export const BRAND_NAME_DEVANAGARI = "वाक्य";

export function brandName(locale: Locale): string {
  return locale === "hi" ? BRAND_NAME_DEVANAGARI : BRAND_NAME;
}

/**
 * The privacy notice's own name, in every language.
 *
 * Left in English on purpose: it is the title of a specific document, and in
 * Devanagari the transliteration ("प्राइवेसी पॉलिसी") reads as a description
 * rather than a name, which is what made "वाक्य की प्राइवेसी पॉलिसी" scan as
 * a sentence about sentences.
 */
export const PRIVACY_POLICY_NAME = "Privacy Policy";
