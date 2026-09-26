"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCampaigns } from "@/lib/i18n/campaigns";
import type { Locale } from "@/lib/i18n";
import { saveTemplate } from "@/lib/campaigns/actions";
import type { TemplateRow } from "@/lib/campaigns/queries";

const SELECT = "mt-1 h-tap w-full rounded-button border-2 border-paper-200 bg-paper-0 px-3 text-body outline-none focus:border-neel-600";

export function TemplateForm({ locale, initial, canApprove }: { locale: Locale; initial: TemplateRow | null; canApprove: boolean }) {
  const t = getCampaigns(locale);
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [channel, setChannel] = React.useState<"email" | "whatsapp">(initial?.channel ?? "email");
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await saveTemplate({
        id: initial?.id,
        channel,
        name: String(form.get("name") ?? ""),
        subject: String(form.get("subject") ?? ""),
        body: String(form.get("body") ?? ""),
        providerTemplateName: String(form.get("providerTemplateName") ?? ""),
        providerLanguage: String(form.get("providerLanguage") ?? "en"),
        status: String(form.get("status") ?? "draft"),
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      router.push("/campaigns/templates");
      router.refresh();
    });
  }
  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4 shadow-card">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="t-name">{t.name}</Label>
          <Input id="t-name" name="name" className="mt-1" defaultValue={initial?.name ?? ""} maxLength={80} required />
        </div>
        <div>
          <Label htmlFor="t-channel">{t.channel}</Label>
          <select id="t-channel" className={SELECT} value={channel} onChange={(e) => setChannel(e.target.value as typeof channel)}>
            <option value="email">{t.channels.email}</option>
            <option value="whatsapp">{t.channels.whatsapp}</option>
          </select>
        </div>
      </div>
      {channel === "email" ? (
        <div>
          <Label htmlFor="t-subject">{t.subject}</Label>
          <Input id="t-subject" name="subject" className="mt-1" defaultValue={initial?.subject ?? ""} maxLength={140} />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="t-provider">{t.templateFields.providerName}</Label>
            <Input id="t-provider" name="providerTemplateName" className="mt-1" defaultValue={initial?.providerTemplateName ?? ""} maxLength={120} />
            <p className="mt-1 text-caption text-fg-subtle">{t.templateFields.providerNameHint}</p>
          </div>
          <div>
            <Label htmlFor="t-lang">{t.templateFields.language}</Label>
            <Input id="t-lang" name="providerLanguage" className="mt-1" defaultValue={initial?.providerLanguage ?? "en"} maxLength={10} />
          </div>
        </div>
      )}
      <div>
        <Label htmlFor="t-body">{t.body}</Label>
        <textarea id="t-body" name="body" rows={5} maxLength={4000} defaultValue={initial?.body ?? ""} className="mt-1 w-full rounded-button border-2 border-paper-200 bg-paper-0 px-3 py-2 text-body outline-none focus:border-neel-600" required />
        <p className="mt-1 text-caption text-fg-subtle">{t.bodyHint}</p>
      </div>
      <div>
        <Label htmlFor="t-status">{t.templateFields.status}</Label>
        <select id="t-status" name="status" className={SELECT} defaultValue={initial?.status ?? "draft"} disabled={!canApprove}>
          <option value="draft">{t.templateFields.statuses.draft}</option>
          <option value="approved">{t.templateFields.statuses.approved}</option>
          <option value="rejected">{t.templateFields.statuses.rejected}</option>
        </select>
        <p className="mt-1 text-caption text-fg-subtle">{t.templateFields.approvedHint}</p>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>{t.save}</Button>
      </div>
    </form>
  );
}
