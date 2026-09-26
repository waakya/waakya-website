"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCampaigns } from "@/lib/i18n/campaigns";
import type { Locale } from "@/lib/i18n";
import { previewSegment, saveCampaign } from "@/lib/campaigns/actions";
import type { Segment } from "@/lib/campaigns/segment";

const SELECT = "mt-1 h-tap w-full rounded-button border-2 border-paper-200 bg-paper-0 px-3 text-body outline-none focus:border-neel-600";
const TEXTAREA = "mt-1 w-full rounded-button border-2 border-paper-200 bg-paper-0 px-3 py-2 text-body outline-none focus:border-neel-600";

export interface CampaignChoices {
  templates: { id: string; name: string; channel: "email" | "whatsapp"; status: string }[];
  people: { id: string; name: string }[];
  projects: { id: string; name: string }[];
  stages: { id: string; name: string }[];
  sources: string[];
}

/** Name, channel, what to say, and who — with the reach shown before anything is sent. */
export function CampaignForm({ locale, choices, initial }: { locale: Locale; choices: CampaignChoices; initial: { id: string; name: string; channel: "email" | "whatsapp"; templateId: string; subject: string; body: string; segment: Segment } | null }) {
  const t = getCampaigns(locale);
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [channel, setChannel] = React.useState<"email" | "whatsapp">(initial?.channel ?? "email");
  const [templateId, setTemplateId] = React.useState(initial?.templateId ?? "");
  const [segment, setSegment] = React.useState<Segment>(initial?.segment ?? {});
  const [reach, setReach] = React.useState<{ reachable: number; suppressed: number } | null>(null);
  const templates = choices.templates.filter((x) => x.channel === channel && x.status === "approved");

  const preview = () =>
    startTransition(async () => {
      const result = await previewSegment({ channel, segment });
      if (!result.ok) toast.error(result.message);
      else setReach(result.data);
    });

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await saveCampaign({
        id: initial?.id,
        name: String(form.get("name") ?? ""),
        channel,
        templateId,
        subject: String(form.get("subject") ?? ""),
        body: String(form.get("body") ?? ""),
        segment,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      router.push(`/campaigns/${result.data.id}`);
    });
  }

  const setSeg = (key: keyof Segment, value: string) => setSegment({ ...segment, [key]: value || undefined });

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="c-name">{t.name}</Label>
        <Input id="c-name" name="name" className="mt-1" defaultValue={initial?.name ?? ""} maxLength={120} required />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="c-channel">{t.channel}</Label>
          <select id="c-channel" className={SELECT} value={channel} onChange={(e) => { setChannel(e.target.value as typeof channel); setTemplateId(""); setReach(null); }}>
            <option value="email">{t.channels.email}</option>
            <option value="whatsapp">{t.channels.whatsapp}</option>
          </select>
        </div>
        <div>
          <Label htmlFor="c-template">{t.template}</Label>
          <select id="c-template" className={SELECT} value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
            {channel === "email" ? <option value="">{t.noTemplate}</option> : <option value="">—</option>}
            {templates.map((x) => (
              <option key={x.id} value={x.id}>{x.name}</option>
            ))}
          </select>
          {channel === "whatsapp" ? <p className="mt-1 text-caption text-fg-subtle">{t.templateFields.approvedHint}</p> : null}
        </div>
      </div>
      {channel === "email" && !templateId ? (
        <>
          <div>
            <Label htmlFor="c-subject">{t.subject}</Label>
            <Input id="c-subject" name="subject" className="mt-1" defaultValue={initial?.subject ?? ""} maxLength={140} />
          </div>
          <div>
            <Label htmlFor="c-body">{t.body}</Label>
            <textarea id="c-body" name="body" rows={5} maxLength={4000} defaultValue={initial?.body ?? ""} className={TEXTAREA} />
            <p className="mt-1 text-caption text-fg-subtle">{t.bodyHint}</p>
          </div>
        </>
      ) : null}

      <fieldset className="rounded-card border border-line bg-surface p-4 shadow-card">
        <legend className="text-body font-bold text-fg">{t.segment}</legend>
        <p className="text-caption text-fg-subtle">{t.segmentHelp}</p>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="s-kind">{t.kind}</Label>
            <select id="s-kind" className={SELECT} value={segment.kind ?? ""} onChange={(e) => setSeg("kind", e.target.value)}>
              <option value="">{t.anyKind}</option>
              <option value="lead">lead</option>
              <option value="customer">customer</option>
            </select>
          </div>
          <div>
            <Label htmlFor="s-source">{t.source}</Label>
            <select id="s-source" className={SELECT} value={segment.source ?? ""} onChange={(e) => setSeg("source", e.target.value)}>
              <option value="">{t.any}</option>
              {choices.sources.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="s-tags">{t.tags}</Label>
            <Input id="s-tags" className="mt-1" defaultValue={(segment.tags ?? []).join(", ")} onBlur={(e) => setSegment({ ...segment, tags: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} />
          </div>
          <div>
            <Label htmlFor="s-owner">{t.owner}</Label>
            <select id="s-owner" className={SELECT} value={segment.ownerId ?? ""} onChange={(e) => setSeg("ownerId", e.target.value)}>
              <option value="">{t.any}</option>
              {choices.people.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="s-project">{t.project}</Label>
            <select id="s-project" className={SELECT} value={segment.projectId ?? ""} onChange={(e) => setSeg("projectId", e.target.value)}>
              <option value="">{t.any}</option>
              {choices.projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="s-stage">{t.stage}</Label>
            <select id="s-stage" className={SELECT} value={segment.stageId ?? ""} onChange={(e) => setSeg("stageId", e.target.value)}>
              <option value="">{t.any}</option>
              {choices.stages.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" size="sm" disabled={pending} onClick={preview}>{t.preview}</Button>
          {reach ? <p className="num text-body-sm text-fg" role="status">{t.reach(reach.reachable, reach.suppressed)}</p> : null}
        </div>
      </fieldset>

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>{t.save}</Button>
      </div>
    </form>
  );
}
