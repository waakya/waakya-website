"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StateWord } from "@/components/waakya/state-word";
import { DrawerAction, useCloseDrawer } from "@/components/waakya/drawer-action";
import { getCrm } from "@/lib/i18n/crm";
import type { Locale } from "@/lib/i18n";
import type { Opportunity, Stage } from "@/lib/crm/queries";
import { createOpportunity, moveOpportunity } from "@/lib/crm/actions";

/** The open deal and where it stands; moving the stage is the one control. */
export function DealCard({
  locale,
  contactId,
  deal,
  closed,
  stages,
  canWrite,
}: {
  locale: Locale;
  contactId: string;
  deal: Opportunity | null;
  closed: Opportunity[];
  stages: Stage[];
  canWrite: boolean;
}) {
  const t = getCrm(locale);
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

  const move = (stageId: string) =>
    startTransition(async () => {
      if (!deal) return;
      const result = await moveOpportunity({ opportunityId: deal.id, stageId });
      if (!result.ok) toast.error(result.message);
      router.refresh();
    });

  // Visual V2: the deal is read, not filled in. The stage is the one
  // control; starting a deal opens a drawer.
  return (
    <div>
      {deal ? (
        <div className="border-y border-line py-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="text-body font-semibold text-fg">{deal.title}</p>
            {deal.value !== null ? <p className="num text-body font-semibold text-fg">{money.format(deal.value)}</p> : null}
          </div>
          {canWrite ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Label htmlFor="deal-stage" className="text-fg-subtle">{t.actions.moveStage}</Label>
              <select id="deal-stage" className="h-10 rounded-button border-2 border-paper-200 bg-paper-0 px-2 text-body-sm font-semibold text-neel-700 outline-none focus:border-neel-600" value={deal.stageId} disabled={pending} onChange={(e) => move(e.target.value)}>
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <StateWord tone="go" className="mt-1">{deal.stageName}</StateWord>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2 border-y border-line py-2">
          <p className="text-body-sm text-fg-subtle">{t.deal.noDeal}</p>
          {canWrite ? (
            <DrawerAction label={t.deal.newDeal} title={t.deal.newDeal}>
              <NewDealForm locale={locale} contactId={contactId} />
            </DrawerAction>
          ) : null}
        </div>
      )}
      {closed.length ? (
        <ul className="mt-2 text-caption text-fg-subtle">
          {closed.slice(0, 5).map((o) => (
            <li key={o.id} className="num py-0.5">
              <StateWord tone={o.status === "won" ? "done" : "quiet"}>{o.title} · {o.status === "won" ? t.deal.won : t.deal.lost}</StateWord>
              {o.value !== null ? ` · ${money.format(o.value)}` : ""}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function NewDealForm({ locale, contactId }: { locale: Locale; contactId: string }) {
  const t = getCrm(locale);
  const router = useRouter();
  const close = useCloseDrawer();
  const [pending, startTransition] = React.useTransition();
  const [title, setTitle] = React.useState("");
  const [value, setValue] = React.useState("");
  const create = (event: React.FormEvent) => {
    event.preventDefault();
    startTransition(async () => {
      const result = await createOpportunity({ contactId, title, value: value ? Number(value) : undefined });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setTitle("");
      setValue("");
      close?.();
      router.refresh();
    });
  };
  return (
    <form onSubmit={create} className="flex flex-col gap-3">
      <div>
        <Label htmlFor="deal-title">{t.deal.dealTitle}</Label>
        <Input id="deal-title" className="mt-1" value={title} maxLength={140} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="deal-value">{t.fields.value}</Label>
        <Input id="deal-value" className="mt-1" type="number" inputMode="numeric" min={0} value={value} onChange={(e) => setValue(e.target.value)} />
      </div>
      <Button type="submit" disabled={pending || title.trim().length === 0}>{t.deal.newDeal}</Button>
    </form>
  );
}
