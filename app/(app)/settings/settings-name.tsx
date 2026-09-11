"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDictionary, type Locale } from "@/lib/i18n";
import { updateMyName } from "@/lib/actions/profile";

/** The person's own name, as their team sees it on every task. */
export function SettingsName({
  locale,
  initialName,
}: {
  locale: Locale;
  initialName: string;
}) {
  const t = getDictionary(locale);
  const [name, setName] = React.useState(initialName);
  const [saved, setSaved] = React.useState(initialName);
  const [error, setError] = React.useState<string | null>(null);
  const [justSaved, setJustSaved] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const unchanged = name.trim() === saved.trim();

  function save(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setJustSaved(false);
    startTransition(async () => {
      const result = await updateMyName({ fullName: name });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setSaved(result.data.fullName);
      setName(result.data.fullName);
      setJustSaved(true);
    });
  }

  return (
    <form onSubmit={save} noValidate className="flex flex-col gap-3">
      <Label htmlFor="my-name" className="sr-only">
        {t.settings.yourName}
      </Label>
      <Input
        id="my-name"
        name="fullName"
        autoComplete="name"
        maxLength={60}
        value={name}
        onChange={(event) => {
          setName(event.target.value);
          setJustSaved(false);
          if (error) setError(null);
        }}
        placeholder={t.settings.namePlaceholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "name-error" : justSaved ? "name-saved" : undefined}
        className="h-tap"
      />
      {error ? (
        <p
          id="name-error"
          role="alert"
          className="rounded-card bg-laal-100 px-3 py-2 text-[15px] leading-[20px] text-laal-700"
        >
          {error}
        </p>
      ) : null}
      {justSaved ? (
        <p id="name-saved" role="status" className="text-[15px] text-ink-700">
          {t.settings.nameSaved}
        </p>
      ) : null}
      <Button type="submit" disabled={pending || unchanged || !name.trim()}>
        {pending ? t.common.loading : t.settings.saveName}
      </Button>
    </form>
  );
}
