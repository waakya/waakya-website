"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { InputOTP } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { LanguageSwitch } from "@/components/waakya/language-switch";
import {
  brandName,
  getDictionary,
  PRIVACY_POLICY_NAME,
  type Locale,
} from "@/lib/i18n";
import { requestOtp, setLoginLocale, verifyOtp } from "./actions";
import { BrandText } from "@/components/waakya/brand-text";

/**
 * Login, in the layout of screens/Login.png: the stacked logo, one field, the
 * consent line under it, one primary button, the language switch at the bottom
 * and the staff hint below that.
 *
 * The forms are `noValidate` on purpose: the browser's own validation bubble
 * speaks the browser's language and cannot be styled, so Waakya answers in the
 * reader's language instead (§9 — errors say what to do next).
 *
 * The field is an *email* field, not the phone field in the PNG: the MVP signs
 * in with an email OTP, and showing a phone box that mails a code would be a
 * lie. The phone layout returns unchanged the day MSG91 and DLT are ready —
 * only `activeAuthProvider()` and this one field change.
 */
export function LoginForm({
  locale,
  next,
}: {
  locale: Locale;
  /** Where to land after sign-in — an invite link, usually. Same-site only. */
  next?: string | null;
}) {
  // The dictionary is looked up here rather than passed in: it holds formatter
  // functions, and functions cannot cross the server/client boundary. Every
  // client component in Waakya takes a `locale` and resolves its own copy.
  const t = getDictionary(locale);
  const router = useRouter();
  const [step, setStep] = React.useState<"email" | "code">("email");
  const [email, setEmail] = React.useState("");
  const [code, setCode] = React.useState("");
  const [consent, setConsent] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  /**
   * An error belongs to the step that produced it and, when it is about a
   * particular field, to that field.
   *
   * Both matter. A wrong code must not still be on screen after the reader
   * goes back to change their email; and "too many codes sent" is not a
   * problem with the address, so it must not ring the email box red.
   */
  const [error, setError] = React.useState<{
    step: "email" | "code";
    message: string;
    field?: string;
  } | null>(null);

  const stepError = error?.step === step ? error : null;
  const emailInvalid = stepError?.field === "email";
  const codeInvalid = stepError?.field === "code";

  function send(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await requestOtp({ email, consent, locale });
      if (!result.ok) {
        setError({ step: "email", message: result.message, field: result.field });
        return;
      }
      setStep("code");
    });
  }

  function verify(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await verifyOtp({ email, code, locale });
      if (!result.ok) {
        setError({ step: "code", message: result.message, field: result.field });
        return;
      }
      router.replace(next ?? "/aaj");
    });
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex flex-1 flex-col pt-[8vh]">
        <Image
          src="/brand/logo/logo-stacked.svg"
          alt="Waakya — Bolo. Ho jayega."
          width={300}
          height={203}
          priority
          unoptimized
          className="mx-auto h-auto w-[150px]"
        />

        {step === "email" ? (
          <form onSubmit={send} noValidate className="mt-9">
            <h1 className="text-[24px] leading-[30px] font-bold text-ink-900">
              {t.auth.title}
            </h1>
            <p className="mt-1 text-[15px] leading-[20px] text-ink-500">
              {t.auth.subtitle}
            </p>

            <div className="mt-5">
              <Label htmlFor="email" className="sr-only">
                {t.auth.emailLabel}
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                required
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  // They are addressing it; stop telling them.
                  if (stepError) setError(null);
                }}
                placeholder={t.auth.emailPlaceholder}
                aria-invalid={emailInvalid || undefined}
                aria-describedby={stepError ? "login-error" : undefined}
                className="h-tap-staff"
              />
            </div>

            <label className="mt-4 flex min-h-tap items-start gap-3">
              <span className="pt-0.5">
                <Checkbox
                  checked={consent}
                  onCheckedChange={setConsent}
                  name="consent"
                />
              </span>
              <span className="text-[15px] leading-[22px] text-ink-900">
                <BrandText text={t.auth.consentPrefix(brandName(locale))} brand={brandName(locale)} />
                <Link
                  href="/privacy"
                  className="font-semibold text-neel-700 underline underline-offset-2"
                >
                  {PRIVACY_POLICY_NAME}
                </Link>
                {t.auth.consentSuffix}
              </span>
            </label>

            <ErrorLine error={stepError?.message ?? null} />

            <Button type="submit" size="block" disabled={pending} className="mt-4">
              {pending ? t.common.loading : t.auth.sendOtp}
            </Button>
          </form>
        ) : (
          <form onSubmit={verify} noValidate className="mt-9">
            <h1 className="text-[24px] leading-[30px] font-bold text-ink-900">
              {t.auth.codeTitle}
            </h1>
            <p className="mt-1 text-[15px] leading-[20px] break-words text-ink-500">
              {t.auth.codeSubtitle(email)}
            </p>

            <div className="mt-5">
              <InputOTP
                value={code}
                onValueChange={(next) => {
                  setCode(next);
                  if (stepError) setError(null);
                }}
                aria-label={t.auth.codeTitle}
                aria-invalid={codeInvalid || undefined}
                aria-describedby={stepError ? "login-error" : undefined}
              />
            </div>

            <ErrorLine error={stepError?.message ?? null} />

            <Button
              type="submit"
              size="block"
              disabled={pending || code.length < 6}
              className="mt-4"
            >
              {pending ? t.common.loading : t.auth.verify}
            </Button>

            <div className="mt-2 flex justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setStep("email");
                  setCode("");
                  setError(null);
                }}
              >
                {t.auth.changeEmail}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const result = await requestOtp({ email, consent: true, locale });
                    setError(
                      result.ok
                        ? null
                        : { step: "code", message: result.message },
                    );
                  })
                }
              >
                {t.auth.resend}
              </Button>
            </div>
          </form>
        )}
      </div>

      <footer className="flex flex-col items-center gap-2 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <LanguageSwitch value={locale} onChange={setLoginLocale} />
        <p className="text-center text-[13px] text-ink-400">{t.auth.staffHint}</p>
      </footer>
    </div>
  );
}

function ErrorLine({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p
      id="login-error"
      role="alert"
      className="mt-3 rounded-card bg-laal-100 px-3 py-2 text-[15px] leading-[20px] text-laal-700"
    >
      {error}
    </p>
  );
}
