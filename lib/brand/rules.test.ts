import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import {
  LOCALES,
  dictionaries,
  BRAND_NAME,
  BRAND_NAME_DEVANAGARI,
  PRIVACY_POLICY_NAME,
  brandName,
} from "@/lib/i18n";
import {
  TICKS_BAR_COLOUR,
  TICKS_TICK_COLOUR,
} from "@/components/vaakya/ticks";

/**
 * These are not tests of behaviour, they are tests of the brand rules the
 * Design Direction says must never drift. A screen that breaks one of them is
 * a bug the same way a wrong SLA is a bug.
 */

describe("the ticks glyph", () => {
  it("shows Haldi on exactly one state: done", () => {
    const haldi = Object.entries(TICKS_TICK_COLOUR).filter(([, colour]) =>
      colour?.includes("haldi"),
    );
    expect(haldi).toEqual([["done", "var(--haldi-400)"]]);
  });

  it("never paints the bars Haldi", () => {
    for (const colour of Object.values(TICKS_BAR_COLOUR)) {
      expect(colour).not.toContain("haldi");
    }
  });

  it("draws no tick before the task is committed", () => {
    expect(TICKS_TICK_COLOUR.sent).toBeNull();
    expect(TICKS_TICK_COLOUR.seen).toBeNull();
    expect(TICKS_TICK_COLOUR.accepted).not.toBeNull();
  });

  it("turns bars and tick green only on verified", () => {
    expect(TICKS_BAR_COLOUR.verified).toContain("hara");
    expect(TICKS_TICK_COLOUR.verified).toContain("hara");
    for (const state of ["sent", "seen", "accepted", "done"] as const) {
      expect(TICKS_BAR_COLOUR[state]).not.toContain("hara");
    }
  });
});

describe("the dictionaries", () => {
  it("give every locale the same keys", () => {
    const shape = (value: unknown, prefix = ""): string[] => {
      if (typeof value !== "object" || value === null) return [prefix];
      return Object.entries(value).flatMap(([key, child]) =>
        shape(child, prefix ? `${prefix}.${key}` : key),
      );
    };
    const reference = shape(dictionaries.hi).sort();
    for (const locale of LOCALES) {
      expect(shape(dictionaries[locale]).sort(), locale).toEqual(reference);
    }
  });

  it("keeps the fixed vocabulary and invents no synonyms", () => {
    // Character document §2.4: a task is never "completed", "closed" or
    // "resolved"; it is *ho gaya* and then *verified*.
    expect(dictionaries["hi-Latn"].ticks.done).toBe("Ho gaya");
    expect(dictionaries["hi-Latn"].ticks.seen).toBe("Dekh liya");
    expect(dictionaries["hi-Latn"].ticks.accepted).toBe("Ho jayega");
    expect(dictionaries["hi-Latn"].common.tagline).toBe("Bolo. Ho jayega.");
    for (const banned of ["Completed", "Closed", "Resolved"]) {
      expect(JSON.stringify(dictionaries.en)).not.toContain(banned);
    }
  });

  it("uses no emoji and no exclamation marks in product copy", () => {
    for (const locale of LOCALES) {
      const copy = collectStrings(dictionaries[locale]);
      for (const line of copy) {
        expect(line, `${locale}: ${line}`).not.toMatch(/!/);
        expect(line, `${locale}: ${line}`).not.toMatch(
          /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u,
        );
      }
    }
  });

  it("never bakes the brand name into a translatable string", () => {
    // *Vaakya* means "sentence" in Hindi. The moment the name sits inside copy
    // that somebody translates, the consent line reads "I agree to the
    // sentence's Privacy Policy" — which is exactly what happened. The name is
    // a proper noun, so it is interpolated from lib/i18n/brand.ts and never
    // typed into a dictionary.
    for (const locale of LOCALES) {
      for (const line of collectStrings(dictionaries[locale])) {
        expect(line, `${locale}: ${line}`).not.toContain(BRAND_NAME);
        expect(line, `${locale}: ${line}`).not.toContain(BRAND_NAME_DEVANAGARI);
      }
    }
  });

  it("never writes Devanagari numerals — Latin digits in every language", () => {
    for (const locale of LOCALES) {
      for (const line of collectStrings(dictionaries[locale])) {
        expect(line, `${locale}: ${line}`).not.toMatch(/[०-९]/);
      }
    }
  });
});

describe("the brand name", () => {
  it("is the same name in both scripts, and never a translation of it", () => {
    expect(brandName("en")).toBe("Vaakya");
    expect(brandName("hi-Latn")).toBe("Vaakya");
    // The Devanagari wordmark, not a different word (Design Direction §2.3).
    expect(brandName("hi")).toBe("वाक्य");
  });

  it("reads as a possessive in the consent line, in every language", () => {
    for (const locale of LOCALES) {
      const line =
        dictionaries[locale].auth.consentPrefix(brandName(locale)) +
        PRIVACY_POLICY_NAME +
        dictionaries[locale].auth.consentSuffix;

      expect(line, locale).toContain(brandName(locale));
      expect(line, locale).toContain(PRIVACY_POLICY_NAME);
      // "the Vaakya Privacy Policy" reads as a category; it is Vaakya's.
      expect(line, locale).not.toContain("the Vaakya ");
    }

    expect(
      dictionaries.en.auth.consentPrefix("Vaakya") +
        PRIVACY_POLICY_NAME +
        dictionaries.en.auth.consentSuffix,
    ).toBe("I agree to Vaakya's Privacy Policy.");

    expect(
      dictionaries.hi.auth.consentPrefix("वाक्य") +
        PRIVACY_POLICY_NAME +
        dictionaries.hi.auth.consentSuffix,
    ).toBe("मैं वाक्य की Privacy Policy से सहमत हूँ।");
  });

  it("keeps the notice's own name untranslated, so the link and the page agree", () => {
    for (const locale of LOCALES) {
      expect(dictionaries[locale].privacy.title, locale).toBe(
        PRIVACY_POLICY_NAME,
      );
    }
  });
});

describe("the source tree", () => {
  const sourceFiles = walk("components").concat(walk("app"), walk("lib"));

  it("never uses a Haldi token outside the ticks glyph and the logo mark", () => {
    // Prose may name the rule ("never Haldi"); only real token usage counts.
    const usage = /(?:bg|text|border|stroke|fill|from|to|via)-haldi-|var\(--haldi|--haldi-\d|#F4B41A/i;
    const allowed = new Set([
      "components/vaakya/ticks.tsx",
      "components/vaakya/mark.tsx",
      "lib/brand/rules.test.ts",
      "app/globals.css",
    ]);
    const offenders = sourceFiles.filter(
      (file) => !allowed.has(file) && usage.test(stripComments(readFileSync(file, "utf8"))),
    );
    expect(offenders).toEqual([]);
  });

  it("never says AI on a screen", () => {
    // Comments may discuss the rule; the rendered tree may not say the word.
    const offenders = sourceFiles.filter((file) => {
      if (file === "lib/brand/rules.test.ts") return false;
      return /\bAI\b/.test(stripComments(readFileSync(file, "utf8")));
    });
    expect(offenders).toEqual([]);
  });
});

/** Drop //, /* *\/ and JSX {/* *\/} comments so prose about a rule is not read as a breach. */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

function collectStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (typeof value === "function") {
    // Formatter functions are exercised with a neutral sample.
    const out = (value as (input: never) => unknown)("10 min" as never);
    return typeof out === "string" ? [out] : [];
  }
  if (typeof value === "object" && value !== null) {
    return Object.values(value).flatMap(collectStrings);
  }
  return [];
}

function walk(dir: string): string[] {
  let out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out = out.concat(walk(full));
    else if (/\.(ts|tsx|css)$/.test(entry)) out.push(full);
  }
  return out;
}
