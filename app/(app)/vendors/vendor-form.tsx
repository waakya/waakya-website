"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getVendors } from "@/lib/i18n/vendors";
import type { Locale } from "@/lib/i18n";
import { saveVendor } from "@/lib/vendors/actions";

export function VendorForm({ locale, vendor, onDone }: { locale: Locale; vendor?: { id: string; name: string; phone: string | null; email: string | null; category: string | null; notes?: string | null; status: string }; onDone?: () => void }) {
  const t = getVendors(locale);
  const router = useRouter();
  const [open, setOpen] = React.useState(!!vendor);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await saveVendor({
        id: vendor?.id,
        name: String(form.get("name") ?? ""),
        phone: String(form.get("phone") ?? ""),
        email: String(form.get("email") ?? ""),
        category: String(form.get("category") ?? ""),
        gstin: String(form.get("gstin") ?? ""),
        notes: String(form.get("notes") ?? ""),
        status: vendor ? (String(form.get("status") ?? "active") as "active" | "inactive") : undefined,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      if (vendor) {
        onDone?.();
        router.refresh();
      } else {
        router.push(`/vendors/${result.data.id}`);
      }
    });
  }

  const form = (
      <form onSubmit={submit} noValidate className="flex flex-col gap-3">
        <div>
          <Label htmlFor="v-name">{t.fields.name}</Label>
          <Input id="v-name" name="name" className="mt-1" defaultValue={vendor?.name ?? ""} maxLength={120} required />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="v-phone">{t.fields.phone}</Label>
            <Input id="v-phone" name="phone" type="tel" className="mt-1" defaultValue={vendor?.phone ?? ""} maxLength={30} />
          </div>
          <div>
            <Label htmlFor="v-email">{t.fields.email}</Label>
            <Input id="v-email" name="email" type="email" className="mt-1" defaultValue={vendor?.email ?? ""} maxLength={254} />
          </div>
          <div>
            <Label htmlFor="v-category">{t.fields.category}</Label>
            <Input id="v-category" name="category" className="mt-1" defaultValue={vendor?.category ?? ""} maxLength={60} />
          </div>
          <div>
            <Label htmlFor="v-gstin">{t.fields.gstin}</Label>
            <Input id="v-gstin" name="gstin" className="mt-1" maxLength={20} />
          </div>
        </div>
        {vendor ? (
          <div>
            <Label htmlFor="v-status">{t.fields.status}</Label>
            <select id="v-status" name="status" defaultValue={vendor.status} className="mt-1 h-tap w-full rounded-button border-2 border-paper-200 bg-paper-0 px-3 text-body outline-none focus:border-neel-600">
              <option value="active">{t.status.active}</option>
              <option value="inactive">{t.status.inactive}</option>
            </select>
          </div>
        ) : null}
        <div>
          <Label htmlFor="v-notes">{t.fields.notes}</Label>
          <textarea id="v-notes" name="notes" rows={2} maxLength={2000} defaultValue={vendor?.notes ?? ""} className="mt-1 w-full rounded-button border-2 border-paper-200 bg-paper-0 px-3 py-2 text-body outline-none focus:border-neel-600" />
        </div>
        {error ? <p role="alert" className="text-body-sm text-laal-600">{error}</p> : null}
        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>{t.work.save}</Button>
          <Button type="button" variant="outline" onClick={() => (vendor ? onDone?.() : setOpen(false))}>{t.work.cancel}</Button>
        </div>
      </form>
  );

  if (vendor) return <Card className="p-4">{form}</Card>;

  // A new vendor: the screen's one primary in the header, the form as a sheet.
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button size="owner">
            <Plus aria-hidden="true" />
            {t.newVendor}
          </Button>
        }
      />
      <SheetContent side="drawer" aria-describedby={undefined}>
        <SheetTitle>{t.newVendor}</SheetTitle>
        <div className="mt-4">{form}</div>
      </SheetContent>
    </Sheet>
  );
}
