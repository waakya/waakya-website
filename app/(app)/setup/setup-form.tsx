"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OnboardingFrame } from "@/components/waakya/onboarding-frame";
import { LanguageSwitch } from "@/components/waakya/language-switch";
import { getDictionary, type Locale } from "@/lib/i18n";
import { createOrg } from "@/lib/actions/org";
import { setLoginLocale } from "@/app/(auth)/login/actions";

/**
 * One field and one language, and the language is a single control with a
 * single meaning: the language of this business. Picking it changes this screen
 * too, so the owner sees what their staff will see before committing.
 *
 * That language becomes `orgs.language`, which a newly invited staff member
 * inherits — Hinglish is a choice, never the forced default.
 */
export function SetupForm({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createOrg({ name, language: locale });
      if (!result.ok) setError(result.message);
      else router.replace("/setup/profile");
    });
  }

  return (
    <OnboardingFrame locale={locale} step={1} illustration="team">
      <div>
        <h1 className="font-display text-[28px] leading-[1.1] font-extrabold text-ink-900">
          {t.org.setupTitle}
        </h1>
        <p className="mt-2 text-[15px] leading-[21px] text-ink-500">
          {t.org.setupSubtitle}
        </p>

        <form onSubmit={submit} noValidate className="mt-6">
          <Label htmlFor="org-name">{t.org.businessName}</Label>
          <Input
            id="org-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t.org.businessNamePlaceholder}
            autoFocus
            className="mt-1.5 h-tap-staff"
            aria-describedby={error ? "setup-error" : undefined}
            aria-invalid={error ? true : undefined}
          />

          <p
            id="org-language-label"
            className="mt-5 mb-1.5 text-[13px] leading-[18px] font-semibold text-ink-700"
          >
            {t.org.languageLabel}
          </p>
          <LanguageSwitch
            value={locale}
            onChange={setLoginLocale}
            aria-labelledby="org-language-label"
          />

          {error ? (
            <p
              id="setup-error"
              role="alert"
              className="mt-4 rounded-card bg-laal-100 px-3 py-2 text-[15px] leading-[20px] text-laal-700"
            >
              {error}
            </p>
          ) : null}

          <Button type="submit" size="block" disabled={pending} className="mt-6">
            {pending ? t.common.loading : t.org.createBusiness}
          </Button>
        </form>
      </div>
    </OnboardingFrame>
  );
}
