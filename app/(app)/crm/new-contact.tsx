"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type Locale } from "@/lib/i18n";
import { getCrm } from "@/lib/i18n/crm";
import { createContact } from "@/lib/crm/actions";
import { CONTACT_SOURCES } from "@/lib/crm/model";

const SELECT = "mt-1 h-tap w-full rounded-button border-2 border-paper-200 bg-paper-0 px-3 text-body outline-none focus:border-neel-600";

/** The form is one card, not a wizard: name, how to reach them, where they came from, who owns them. */
export function NewContact({
  locale,
  people,
  canAssign,
  selfId,
}: {
  locale: Locale;
  people: { id: string; name: string }[];
  canAssign: boolean;
  selfId: string;
}) {
  const t = getCrm(locale);
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [field, setField] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await createContact({
        fullName: String(form.get("fullName") ?? ""),
        phone: String(form.get("phone") ?? ""),
        email: String(form.get("email") ?? ""),
        companyName: String(form.get("companyName") ?? ""),
        source: String(form.get("source") ?? "") || undefined,
        interest: String(form.get("interest") ?? ""),
        notes: String(form.get("notes") ?? ""),
        ownerId: String(form.get("ownerId") ?? ""),
      });
      if (!result.ok) {
        setError(result.message);
        setField(result.field ?? null);
        return;
      }
      router.push(`/crm/${result.data.id}`);
    });
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus aria-hidden="true" />
        {t.newContact}
      </Button>
    );
  }

  return (
    <Card className="p-4">
      <form onSubmit={submit} noValidate className="flex flex-col gap-3">
        <div>
          <Label htmlFor="c-name">{t.fields.name}</Label>
          <Input id="c-name" name="fullName" className="mt-1" maxLength={120} required aria-invalid={field === "fullName" || undefined} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="c-phone">{t.fields.phone}</Label>
            <Input id="c-phone" name="phone" type="tel" inputMode="tel" className="mt-1" maxLength={30} aria-invalid={field === "phone" || undefined} />
          </div>
          <div>
            <Label htmlFor="c-email">{t.fields.email}</Label>
            <Input id="c-email" name="email" type="email" className="mt-1" maxLength={254} aria-invalid={field === "email" || undefined} />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="c-company">{t.fields.company}</Label>
            <Input id="c-company" name="companyName" className="mt-1" maxLength={120} />
          </div>
          <div>
            <Label htmlFor="c-source">{t.fields.source}</Label>
            <select id="c-source" name="source" className={SELECT} defaultValue="">
              <option value="">—</option>
              {CONTACT_SOURCES.map((s) => (
                <option key={s} value={s}>{t.sources[s]}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <Label htmlFor="c-interest">{t.fields.interest}</Label>
          <Input id="c-interest" name="interest" className="mt-1" maxLength={140} />
        </div>
        <div>
          <Label htmlFor="c-owner">{t.fields.owner}</Label>
          <select id="c-owner" name="ownerId" className={SELECT} defaultValue={canAssign ? "" : selfId} disabled={!canAssign}>
            <option value="">{t.actions.unassigned}</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="c-notes">{t.fields.notes}</Label>
          <textarea id="c-notes" name="notes" rows={2} maxLength={4000} className="mt-1 w-full rounded-button border-2 border-paper-200 bg-paper-0 px-3 py-2 text-body outline-none focus:border-neel-600" />
        </div>
        {error ? <p role="alert" className="text-body-sm text-laal-600">{error}</p> : null}
        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>{t.actions.save}</Button>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t.actions.cancel}</Button>
        </div>
      </form>
    </Card>
  );
}
