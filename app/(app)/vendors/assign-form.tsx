"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getVendors } from "@/lib/i18n/vendors";
import type { Locale } from "@/lib/i18n";
import { assignVendorWork } from "@/lib/vendors/actions";

const SELECT = "mt-1 h-tap w-full rounded-button border-2 border-paper-200 bg-paper-0 px-3 text-body outline-none focus:border-neel-600";

export interface AssignChoices {
  vendors: { id: string; name: string }[];
  projects: { id: string; name: string }[];
  records: { id: string; title: string; projectId: string | null; statuses: { key: string; label: string }[] }[];
  people: { id: string; name: string }[];
}

/** Give a vendor one piece of work, with an owner inside the business and what it changes when done. */
export function AssignForm({ locale, choices, fixedVendorId, fixedProjectId, verb = false }: { locale: Locale; choices: AssignChoices; fixedVendorId?: string; fixedProjectId?: string; /** Inside a section heading: said as a verb. */ verb?: boolean }) {
  const t = getVendors(locale).work;
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  const [recordId, setRecordId] = React.useState("");
  const [projectId, setProjectId] = React.useState(fixedProjectId ?? "");
  const record = choices.records.find((r) => r.id === recordId);
  const records = choices.records.filter((r) => !projectId || r.projectId === projectId || !r.projectId);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    startTransition(async () => {
      const amount = String(form.get("amount") ?? "");
      const result = await assignVendorWork({
        vendorId: fixedVendorId ?? String(form.get("vendorId") ?? ""),
        projectId,
        recordId,
        title: String(form.get("title") ?? ""),
        details: String(form.get("details") ?? ""),
        amount: amount ? Number(amount) : undefined,
        dueDate: String(form.get("dueDate") ?? ""),
        ownerId: String(form.get("ownerId") ?? ""),
        customerVisible: form.get("customerVisible") === "on",
        recordStatusOnSubmit: String(form.get("onSubmit") ?? ""),
        recordStatusOnVerify: String(form.get("onVerify") ?? ""),
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.push(`/vendors/assignments/${result.data.id}`);
    });
  }

  // Visual V2: assigning work opens a drawer (a sheet on a phone), so the
  // project or vendor page it starts from is never pushed down by a form.
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant={verb ? "verb" : "secondary"} size={verb ? "sm" : "owner"} className={verb ? "h-tap" : undefined}>
            {verb ? null : <Plus aria-hidden="true" />}
            {t.assign}
          </Button>
        }
      />
      <SheetContent side="drawer" aria-describedby={undefined}>
        <SheetTitle>{t.assign}</SheetTitle>
      <form onSubmit={submit} noValidate className="mt-4 flex flex-col gap-3">
        {!fixedVendorId ? (
          <div>
            <Label htmlFor="a-vendor">{getVendors(locale).title}</Label>
            <select id="a-vendor" name="vendorId" className={SELECT} required defaultValue="">
              <option value="">—</option>
              {choices.vendors.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
        ) : null}
        <div>
          <Label htmlFor="a-title">{t.what}</Label>
          <Input id="a-title" name="title" className="mt-1" maxLength={140} required />
        </div>
        <div>
          <Label htmlFor="a-details">{t.details}</Label>
          <Input id="a-details" name="details" className="mt-1" maxLength={2000} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="a-amount">{t.amount}</Label>
            <Input id="a-amount" name="amount" type="number" inputMode="decimal" min={0} step="any" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="a-due">{t.dueDate}</Label>
            <Input id="a-due" name="dueDate" type="date" className="mt-1" />
          </div>
          {!fixedProjectId ? (
            <div>
              <Label htmlFor="a-project">{t.project}</Label>
              <select id="a-project" name="projectId" className={SELECT} value={projectId} onChange={(e) => { setProjectId(e.target.value); setRecordId(""); }}>
                <option value="">—</option>
                {choices.projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          ) : null}
          {records.length ? (
            <div>
              <Label htmlFor="a-record">{t.record}</Label>
              <select id="a-record" name="recordId" className={SELECT} value={recordId} onChange={(e) => setRecordId(e.target.value)}>
                <option value="">—</option>
                {records.map((r) => (
                  <option key={r.id} value={r.id}>{r.title}</option>
                ))}
              </select>
            </div>
          ) : null}
          {record ? (
            <>
              <div>
                <Label htmlFor="a-on-submit">{t.onSubmit}</Label>
                <select id="a-on-submit" name="onSubmit" className={SELECT} defaultValue="">
                  <option value="">{t.noChange}</option>
                  {record.statuses.map((s) => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="a-on-verify">{t.onVerify}</Label>
                <select id="a-on-verify" name="onVerify" className={SELECT} defaultValue="">
                  <option value="">{t.noChange}</option>
                  {record.statuses.map((s) => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
              </div>
            </>
          ) : null}
          <div className="sm:col-span-2">
            <Label htmlFor="a-owner">{t.owner}</Label>
            <select id="a-owner" name="ownerId" className={SELECT} defaultValue="">
              <option value="">—</option>
              {choices.people.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <p className="mt-1 text-caption text-fg-subtle">{t.ownerHint}</p>
          </div>
        </div>
        <label className="flex min-h-tap items-center gap-2 text-body text-fg">
          <input type="checkbox" name="customerVisible" />
          {t.customerVisible}
        </label>
        {error ? <p role="alert" className="text-body-sm text-laal-600">{error}</p> : null}
        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>{t.assign}</Button>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t.cancel}</Button>
        </div>
      </form>
      </SheetContent>
    </Sheet>
  );
}
