"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { InputOTP } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Wordmark } from "@/components/waakya/wordmark";
import { getUx } from "@/lib/i18n/ux";
import { LanguageSwitch } from "@/components/waakya/language-switch";
import {
  brandName,
  getDictionary,
  PRIVACY_POLICY_NAME,
  type Locale,
} from "@/lib/i18n";
import {
  requestOtp,
  setLoginLocale,
  startGoogleSignIn,
  verifyOtp,
} from "./actions";
import { guestLogin } from "./guest-actions";
import { BrandText } from "@/components/waakya/brand-text";
import { GoogleMark } from "@/components/waakya/google-mark";

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
 *
 * Google comes first: one tap, no code to wait for, nothing to pay per login.
 * The consent line sits above both doors because it gates both.
 */
export function LoginForm({
  locale,
  next,
  guest = false,
  oauthFailed = false,
}: {
  locale: Locale;
  /** Where to land after sign-in — an invite link, usually. Same-site only. */
  next?: string | null;
  /** Show the guest button. The page passes it only when ALLOW_GUEST_LOGIN is on. */
  guest?: boolean;
  /** Google sent the reader back without a session. */
  oauthFailed?: boolean;
}) {
  // The dictionary is looked up here rather than passed in: it holds formatter
  // functions, and functions cannot cross the server/client boundary. Every
  // client component in Waakya takes a `locale` and resolves its own copy.
  const t = getDictionary(locale);
  const ux = getUx(locale);
  const router = useRouter();
  const [step, setStep] = React.useState<"email" | "code" | "guest">("email");
  const [email, setEmail] = React.useState("");
  const [guestName, setGuestName] = React.useState("");
  const [guestReason, setGuestReason] = React.useState("");
  const [code, setCode] = React.useState("");
  const [consent, setConsent] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  /**
   * The Google door's own error, shown under its button. "oauthFailed" is a
   * marker rather than text so it follows the language switch.
   */
  const [googleError, setGoogleError] = React.useState<string | null>(
    oauthFailed ? "oauthFailed" : null,
  );

  /**
   * An error belongs to the step that produced it and, when it is about a
   * particular field, to that field.
   *
   * Both matter. A wrong code must not still be on screen after the reader
   * goes back to change their email; and "too many codes sent" is not a
   * problem with the address, so it must not ring the email box red.
   */
  const [error, setError] = React.useState<{
    step: "email" | "code" | "guest";
    message: string;
    field?: string;
  } | null>(null);

  const stepError = error?.step === step ? error : null;
  const emailInvalid = stepError?.field === "email";
  const codeInvalid = stepError?.field === "code";
  const nameInvalid = stepError?.field === "name";
  const reasonInvalid = stepError?.field === "reason";

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

  function continueWithGoogle() {
    setError(null);
    setGoogleError(null);
    startTransition(async () => {
      const result = await startGoogleSignIn({ consent, locale, next: next ?? null });
      if (!result.ok) {
        setGoogleError(result.message);
        return;
      }
      window.location.assign(result.data.url);
    });
  }

  function enterAsGuest(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await guestLogin({
        name: guestName,
        email,
        reason: guestReason,
        locale,
      });
      if (!result.ok) {
        setError({ step: "guest", message: result.message, field: result.field });
        return;
      }
      router.replace(next ?? "/aaj");
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
        <Wordmark size={32} className="mx-auto" />

        {step === "email" ? (
          <form onSubmit={send} noValidate className="mt-9">
            <h1 className="text-[24px] leading-[30px] font-bold text-ink-900">
              {t.auth.title}
            </h1>
            <p className="mt-1 text-[15px] leading-[20px] text-ink-500">
              {t.auth.subtitle}
            </p>

            <label className="mt-5 flex min-h-tap items-start gap-3">
              <span className="pt-0.5">
                <Checkbox
                  checked={consent}
                  onCheckedChange={(checked) => {
                    setConsent(checked);
                    setGoogleError(null);
                  }}
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

            <Button
              type="button"
              variant="outline"
              size="block"
              disabled={pending}
              onClick={continueWithGoogle}
              aria-describedby={googleError ? "google-error" : undefined}
              className="mt-4 gap-3"
            >
              <GoogleMark className="size-5" />
              {t.auth.google}
            </Button>

            <ErrorLine
              id="google-error"
              error={
                googleError === "oauthFailed" ? t.auth.oauthFailed : googleError
              }
            />

            <div className="mt-5 flex items-center gap-3">
              <span aria-hidden="true" className="h-px flex-1 bg-paper-200" />
              <span className="text-[13px] leading-[18px] text-ink-400">
                {t.auth.orEmail}
              </span>
              <span aria-hidden="true" className="h-px flex-1 bg-paper-200" />
            </div>

            <div className="mt-4">
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

            <ErrorLine error={stepError?.message ?? null} />

            <Button type="submit" size="block" disabled={pending} className="mt-4">
              {pending ? t.common.loading : t.auth.sendOtp}
            </Button>

            {guest ? (
              <Button
                type="button"
                variant="outline"
                size="block"
                disabled={pending}
                onClick={() => {
                  setStep("guest");
                  setError(null);
                }}
                className="mt-3"
              >
                {t.auth.guestLogin}
              </Button>
            ) : null}
          </form>
        ) : step === "guest" ? (
          <form onSubmit={enterAsGuest} noValidate className="mt-9">
            <h1 className="text-[24px] leading-[30px] font-bold text-ink-900">
              {t.auth.guestTitle}
            </h1>
            <p className="mt-1 text-[15px] leading-[20px] text-ink-500">
              {t.auth.guestSubtitle}
            </p>

            <div className="mt-5 flex flex-col gap-3">
              <div>
                <Label htmlFor="guest-name" className="sr-only">
                  {t.auth.guestNameLabel}
                </Label>
                <Input
                  id="guest-name"
                  name="name"
                  autoComplete="name"
                  required
                  value={guestName}
                  onChange={(event) => {
                    setGuestName(event.target.value);
                    if (stepError) setError(null);
                  }}
                  placeholder={t.auth.guestNamePlaceholder}
                  aria-invalid={nameInvalid || undefined}
                  aria-describedby={stepError ? "login-error" : undefined}
                  className="h-tap-staff"
                />
              </div>
              <div>
                <Label htmlFor="guest-email" className="sr-only">
                  {t.auth.emailLabel}
                </Label>
                <Input
                  id="guest-email"
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
                    if (stepError) setError(null);
                  }}
                  placeholder={t.auth.emailPlaceholder}
                  aria-invalid={emailInvalid || undefined}
                  aria-describedby={stepError ? "login-error" : undefined}
                  className="h-tap-staff"
                />
              </div>
              <div>
                <Label htmlFor="guest-reason" className="sr-only">
                  {t.auth.guestReasonLabel}
                </Label>
                <textarea
                  id="guest-reason"
                  name="reason"
                  required
                  rows={3}
                  value={guestReason}
                  onChange={(event) => {
                    setGuestReason(event.target.value);
                    if (stepError) setError(null);
                  }}
                  placeholder={t.auth.guestReasonPlaceholder}
                  aria-invalid={reasonInvalid || undefined}
                  aria-describedby={stepError ? "login-error" : undefined}
                  className="w-full rounded-button border-2 border-paper-200 bg-paper-0 px-4 py-3 text-[17px] font-semibold text-ink-900 outline-none transition-colors placeholder:font-normal placeholder:text-ink-400 focus:border-neel-600 aria-invalid:border-laal-600"
                />
              </div>
            </div>

            <ErrorLine error={stepError?.message ?? null} />

            <Button type="submit" size="block" disabled={pending} className="mt-4">
              {pending ? t.common.loading : t.auth.guestEnter}
            </Button>

            <div className="mt-2 flex justify-start">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setStep("email");
                  setError(null);
                }}
              >
                {t.auth.guestBack}
              </Button>
            </div>
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

      {step === "email" ? (
        <div className="mt-8 flex flex-col gap-3">
          {/* A new owner sees what comes after this screen; staff see where
              their door is. */}
          <ol className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[13px] text-ink-500">
            {ux.login.nextSteps.map((label, index) => (
              <li key={label} className="flex items-center gap-2 whitespace-nowrap">
                <span className="num grid size-5 place-items-center rounded-full border border-paper-300 text-[11px] font-bold text-ink-700">
                  {index + 1}
                </span>
                {label}
                {index < ux.login.nextSteps.length - 1 ? <span aria-hidden="true" className="text-ink-400">→</span> : null}
              </li>
            ))}
          </ol>
          <p className="rounded-card border border-neel-100 bg-neel-50 px-3.5 py-2.5 text-center text-[14px] leading-[20px] text-neel-800">
            {t.auth.staffHint}
          </p>
        </div>
      ) : null}

      <footer className="mt-6 flex flex-col items-center gap-2 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <LanguageSwitch value={locale} onChange={setLoginLocale} />
      </footer>
    </div>
  );
}

function ErrorLine({
  error,
  id = "login-error",
}: {
  error: string | null;
  id?: string;
}) {
  if (!error) return null;
  return (
    <p
      id={id}
      role="alert"
      className="mt-3 rounded-card bg-laal-100 px-3 py-2 text-[15px] leading-[20px] text-laal-700"
    >
      {error}
    </p>
  );
}
