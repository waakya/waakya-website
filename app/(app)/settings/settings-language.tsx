"use client";

import { LanguageSwitch } from "@/components/waakya/language-switch";
import { setUserLocale } from "@/lib/actions/org";
import type { Locale } from "@/lib/i18n";

/** The choice is stored on the profile, so it follows the person across devices. */
export function SettingsLanguage({ locale }: { locale: Locale }) {
  return <LanguageSwitch value={locale} onChange={setUserLocale} />;
}
