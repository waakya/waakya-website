"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StateChip } from "@/components/ui/state-chip";
import { getCrm } from "@/lib/i18n/crm";
import type { Locale } from "@/lib/i18n";
import type { Opportunity, Stage } from "@/lib/crm/queries";
import { createOpportunity, moveOpportunity } from "@/lib/crm/actions";

const SELECT = "h-tap w-full rounded-button border-2 border-paper-200 bg-paper-0 px-3 text-body outline-none focus:border-neel-600";

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
  const [title, setTitle] = React.useState("");
  const [value, setValue] = React.useState("");
  const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

  const move = (stageId: string) =>
    startTransition(async () => {
      if (!deal) return;
      const result = await moveOpportunity({ opportunityId: deal.id, stageId });
      if (!result.ok) toast.error(result.message);
      router.refresh();
    });

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
      router.refresh();
    });
  };

  return (
    <div className="rounded-card border border-line bg-surface p-4 shadow-card">
      {deal ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-body font-semibold text-fg">{deal.title}</p>
            <StateChip tone="neel">{deal.stageName}</StateChip>
          </div>
          {deal.value !== null ? <p className="num mt-1 text-body-sm text-fg-subtle">{money.format(deal.value)}</p> : null}
          {canWrite ? (
            <div className="mt-3">
              <Label htmlFor="deal-stage">{t.actions.moveStage}</Label>
              <select id="deal-stage" className={`mt-1 ${SELECT}`} value={deal.stageId} disabled={pending} onChange={(e) => move(e.target.value)}>
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          ) : null}
        </>
      ) : canWrite ? (
        <form onSubmit={create} className="flex flex-col gap-2">
          <p className="text-body-sm text-fg-subtle">{t.deal.noDeal}</p>
          <div>
            <Label htmlFor="deal-title">{t.deal.dealTitle}</Label>
            <Input id="deal-title" className="mt-1" value={title} maxLength={140} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="deal-value">{t.fields.value}</Label>
            <Input id="deal-value" className="mt-1" type="number" inputMode="numeric" min={0} value={value} onChange={(e) => setValue(e.target.value)} />
          </div>
          <Button type="submit" size="sm" disabled={pending || title.trim().length === 0}>{t.deal.newDeal}</Button>
        </form>
      ) : (
        <p className="text-body-sm text-fg-subtle">{t.deal.noDeal}</p>
      )}
      {closed.length ? (
        <ul className="mt-3 border-t border-line pt-3 text-caption text-fg-subtle">
          {closed.slice(0, 5).map((o) => (
            <li key={o.id} className="num">
              {o.title} · {o.status === "won" ? t.deal.won : t.deal.lost}
              {o.value !== null ? ` · ${money.format(o.value)}` : ""}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
