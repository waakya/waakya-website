"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Copy, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getIntegrations } from "@/lib/i18n/integrations";
import type { Locale } from "@/lib/i18n";
import { createIntegrationKey, revokeIntegrationKey } from "@/lib/integrations/actions";

/** Mint a key and show it once; copy it; that is all a key ever offers. */
export function NewKey({ locale }: { locale: Locale }) {
  const t = getIntegrations(locale);
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [minted, setMinted] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  if (minted) {
    return (
      <div className="rounded-card border-2 border-neel-200 bg-surface p-3">
        <p className="text-body-sm font-semibold text-fg">{t.shownOnce}</p>
        <code data-testid="minted-key" className="num mt-2 block break-all rounded-inner bg-paper-50 p-2 text-caption text-fg">{minted}</code>
        <div className="mt-2 flex gap-2">
          <Button size="sm" variant="secondary" onClick={async () => { await navigator.clipboard.writeText(minted).catch(() => null); setCopied(true); }}>
            {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
            {copied ? t.copied : t.copy}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setMinted(null); setOpen(false); router.refresh(); }}>
            <X aria-hidden="true" />
          </Button>
        </div>
      </div>
    );
  }
  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus aria-hidden="true" />
        {t.newKey}
      </Button>
    );
  }
  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await createIntegrationKey({ name });
          if (!result.ok) {
            toast.error(result.message);
            return;
          }
          setMinted(result.data.key);
          setName("");
        });
      }}
    >
      <div className="min-w-48">
        <Label htmlFor="key-name">{t.keyName}</Label>
        <Input id="key-name" className="mt-1 h-10 text-body-sm" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} required />
      </div>
      <Button type="submit" size="sm" disabled={pending || !name.trim()}>{t.create}</Button>
    </form>
  );
}

export function KeyControls({ locale, id }: { locale: Locale; id: string }) {
  const t = getIntegrations(locale);
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await revokeIntegrationKey(id);
          if (!result.ok) toast.error(result.message);
          router.refresh();
        })
      }
    >
      <X aria-hidden="true" />
      {t.revoke}
    </Button>
  );
}
