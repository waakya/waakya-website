"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, RefreshCw, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDomains } from "@/lib/i18n/domains";
import type { Locale } from "@/lib/i18n";
import { addDomain, removeDomain, verifyDomain } from "@/lib/domains/actions";

export function AddDomain({ locale }: { locale: Locale }) {
  const t = getDomains(locale);
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [hostname, setHostname] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus aria-hidden="true" />
        {t.add}
      </Button>
    );
  }
  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await addDomain({ hostname });
          if (!result.ok) {
            toast.error(result.message);
            return;
          }
          setHostname("");
          setOpen(false);
          router.refresh();
        });
      }}
    >
      <div className="min-w-56">
        <Label htmlFor="domain-host">{t.hostname}</Label>
        <Input id="domain-host" className="mt-1 h-10 text-body-sm" value={hostname} placeholder={t.hostnameHint} onChange={(e) => setHostname(e.target.value)} required />
      </div>
      <Button type="submit" size="sm" disabled={pending || !hostname.trim()}>{t.add}</Button>
    </form>
  );
}

export function DomainControls({ locale, id, status }: { locale: Locale; id: string; status: string }) {
  const t = getDomains(locale);
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  return (
    <span className="flex items-center gap-1">
      {status === "pending" ? (
        <Button
          size="sm"
          variant="secondary"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await verifyDomain(id);
              if (!result.ok) toast.error(result.message);
              else if (!result.data.verified) toast.message(t.notFound);
              router.refresh();
            })
          }
        >
          <RefreshCw aria-hidden="true" />
          {t.verify}
        </Button>
      ) : null}
      <Button size="sm" variant="ghost" disabled={pending} onClick={() => startTransition(async () => { const r = await removeDomain(id); if (!r.ok) toast.error(r.message); router.refresh(); })}>
        <X aria-hidden="true" />
        {t.remove}
      </Button>
    </span>
  );
}
