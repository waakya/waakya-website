"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OnboardingFrame } from "@/components/waakya/onboarding-frame";
import { type Locale } from "@/lib/i18n";
import { getPhase1 } from "@/lib/i18n/phase1";
import { updateBusinessProfile } from "@/lib/actions/business";

interface Profile {
  name: string;
  address: string;
  gstin: string;
  phone: string;
  email: string;
}

/**
 * The business profile. During onboarding it is step two of three and moves on
 * to inviting the team; in Settings it simply saves.
 */
export function BusinessProfileForm({
  locale,
  initial,
  onboarding = false,
}: {
  locale: Locale;
  initial: Profile;
  onboarding?: boolean;
}) {
  const p = getPhase1(locale);
  const router = useRouter();
  const [form, setForm] = React.useState<Profile>(initial);
  const [error, setError] = React.useState<{ message: string; field?: string } | null>(null);
  const [saved, setSaved] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateBusinessProfile(form);
      if (!result.ok) return setError({ message: result.message, field: result.field });
      if (onboarding) router.replace("/staff");
      else {
        setSaved(true);
        router.refresh();
      }
    });
  }

  const field = (key: keyof Profile, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <div>
      <Label htmlFor={`biz-${key}`}>{label}</Label>
      <Input
        id={`biz-${key}`}
        className="mt-1"
        value={form[key]}
        aria-invalid={error?.field === key || undefined}
        onChange={(event) => setForm({ ...form, [key]: event.target.value })}
        {...props}
      />
    </div>
  );

  const body = (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3">
      {field("name", "Business name", { maxLength: 120 })}
      <div>
        <Label htmlFor="biz-address">{p.onboarding.address}</Label>
        <textarea
          id="biz-address"
          rows={2}
          value={form.address}
          onChange={(event) => setForm({ ...form, address: event.target.value })}
          className="mt-1 w-full rounded-button border border-paper-200 bg-paper-0 px-3 py-2 text-[15px] outline-none focus:border-neel-600"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {field("gstin", p.onboarding.gstin, { maxLength: 15, autoCapitalize: "characters" })}
        {field("phone", p.onboarding.phone, { inputMode: "tel", maxLength: 20 })}
      </div>
      {field("email", p.onboarding.email, { type: "email", inputMode: "email", maxLength: 120 })}
      {error ? (
        <p role="alert" data-testid="profile-error" className="rounded-card bg-laal-100 px-3 py-2 text-[14px] text-laal-700">
          {error.message}
        </p>
      ) : null}
      {saved ? (
        <p className="flex items-center gap-2 text-[14px] font-semibold text-hara-700">
          <Check className="size-4" aria-hidden="true" />
          {p.common.save}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size={onboarding ? "block" : "owner"} disabled={pending}>
          {pending ? p.common.loading : onboarding ? p.onboarding.continue : p.common.save}
        </Button>
        {onboarding ? (
          <Button type="button" variant="ghost" size="block" onClick={() => router.replace("/staff")}>
            {p.onboarding.skip}
          </Button>
        ) : null}
      </div>
    </form>
  );

  if (!onboarding) return body;

  return (
    <OnboardingFrame locale={locale} step={2} illustration="handoff">
      <h1 className="font-display text-[28px] leading-[1.1] font-extrabold text-ink-900">
        {p.onboarding.profileTitle}
      </h1>
      <p className="mt-2 text-[15px] leading-[21px] text-ink-500">{p.onboarding.profileLead}</p>
      <div className="mt-5">{body}</div>
    </OnboardingFrame>
  );
}
