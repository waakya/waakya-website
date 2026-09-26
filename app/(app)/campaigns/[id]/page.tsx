import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireModule, viewerCan } from "@/lib/auth/session";
import { shellFor } from "@/lib/auth/shell";
import { getCampaigns } from "@/lib/i18n/campaigns";
import { getCampaign } from "@/lib/campaigns/queries";
import { campaignChoices } from "@/lib/campaigns/choices";
import { formatIndianDate } from "@/lib/tasks/format-date";
import { formatTime } from "@/lib/tasks/time";
import { AppShell } from "@/components/waakya/app-shell";
import { ListSurface, PageHeader, Section } from "@/components/waakya/page";
import { StateChip } from "@/components/ui/state-chip";
import { CampaignForm } from "../campaign-form";
import { SendControls } from "./send-controls";

export const metadata: Metadata = { title: "Campaign" };

const TONE: Record<string, "outline" | "neel" | "hara" | "amber" | "muted" | "laal"> = { queued: "outline", sent: "neel", delivered: "hara", failed: "laal", replied: "hara", suppressed: "muted" };

/** One campaign: what it says, who it reaches, and how each person answered. */
export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await requireModule("campaigns");
  const { id } = await params;
  const shell = await shellFor(viewer);
  const t = getCampaigns(shell.locale);
  const found = await getCampaign(viewer.org.id, id);
  if (!found) notFound();
  const { campaign, recipients } = found;
  const editable = campaign.status === "draft" && viewerCan(viewer, "campaigns.manage");
  const choices = editable ? await campaignChoices(viewer.org.id) : null;
  const replies = recipients.filter((r) => r.status === "replied");

  return (
    <AppShell {...shell} width="list">
      <main className="flex-1 p-4 pb-8 lg:px-0">
        <PageHeader
          back={{ href: "/campaigns", label: t.title }}
          title={campaign.name}
          description={`${t.channels[campaign.channel]}${campaign.templateName ? ` · ${campaign.templateName}` : ""}${campaign.finishedAt ? ` · ${formatIndianDate(campaign.finishedAt, shell.locale)}` : ""}`}
          actions={<StateChip tone={campaign.status === "sent" ? "hara" : campaign.status === "partially_failed" ? "amber" : "outline"}>{t.statuses[campaign.status as keyof typeof t.statuses] ?? campaign.status}</StateChip>}
        />
        {campaign.status !== "draft" ? (
          <p className="num mt-2 text-body-sm text-fg-subtle">{t.counts(campaign.counts.sent ?? 0, campaign.counts.failed ?? 0, campaign.counts.suppressed ?? 0, campaign.counts.replied ?? 0)}</p>
        ) : null}
        {campaign.body ? <p className="mt-3 max-w-2xl whitespace-pre-wrap rounded-card border border-line bg-surface p-4 text-body text-fg">{campaign.subject ? `${campaign.subject}\n\n` : ""}{campaign.body}</p> : null}

        {viewerCan(viewer, "campaigns.manage") ? <div className="mt-4"><SendControls locale={shell.locale} id={campaign.id} status={campaign.status} canSend={viewerCan(viewer, "campaigns.send")} /></div> : null}

        {choices ? (
          <Section title={t.segment}>
            <CampaignForm locale={shell.locale} choices={choices} initial={{ id: campaign.id, name: campaign.name, channel: campaign.channel, templateId: "", subject: campaign.subject ?? "", body: campaign.body ?? "", segment: campaign.segment }} />
          </Section>
        ) : null}

        {replies.length ? (
          <Section title={t.replies} count={replies.length}>
            <ListSurface>
              {replies.map((r) => (
                <li key={r.id} className="flex items-center gap-3 px-4 py-3">
                  <Link href={`/crm/${r.contactId}`} className="min-w-0 flex-1 truncate text-body font-semibold text-neel-700">{r.contactName}</Link>
                  <span className="num text-caption text-fg-subtle">{r.repliedAt ? `${formatIndianDate(r.repliedAt, shell.locale)} ${formatTime(r.repliedAt)}` : ""}</span>
                </li>
              ))}
            </ListSurface>
          </Section>
        ) : null}

        <Section title={t.recipients} count={recipients.length}>
          {recipients.length === 0 ? (
            <p className="text-body-sm text-fg-subtle">{t.noRecipients}</p>
          ) : (
            <ListSurface>
              {recipients.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-2">
                  <Link href={`/crm/${r.contactId}`} className="min-w-0 flex-1 truncate text-body-sm font-semibold text-fg">{r.contactName}</Link>
                  <span className="num truncate text-caption text-fg-subtle">{r.address ?? ""}{r.error ? ` · ${r.error}` : ""}</span>
                  <StateChip tone={TONE[r.status] ?? "outline"}>{t.recipientStatuses[r.status as keyof typeof t.recipientStatuses] ?? r.status}</StateChip>
                </li>
              ))}
            </ListSurface>
          )}
        </Section>
      </main>
    </AppShell>
  );
}
