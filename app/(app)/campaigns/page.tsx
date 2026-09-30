import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Megaphone, Plus } from "lucide-react";

import { requireModule, viewerCan } from "@/lib/auth/session";
import { shellFor } from "@/lib/auth/shell";
import { getCampaigns } from "@/lib/i18n/campaigns";
import { listCampaigns } from "@/lib/campaigns/queries";
import { formatIndianDate } from "@/lib/tasks/format-date";
import { AppShell } from "@/components/waakya/app-shell";
import { EmptyState, PageHeader } from "@/components/waakya/page";
import { buttonVariants } from "@/components/ui/button";
import { StateChip } from "@/components/ui/state-chip";
import { StateWord } from "@/components/waakya/state-word";
import { getModuleStatuses } from "@/lib/modules/queries";
import { WhatsAppSettings } from "./whatsapp-settings";

export const metadata: Metadata = { title: "Campaigns" };

const TONE: Record<string, "outline" | "neel" | "hara" | "amber" | "muted" | "laal"> = { draft: "outline", scheduled: "neel", sending: "neel", sent: "hara", partially_failed: "amber", cancelled: "muted" };

export default async function CampaignsPage() {
  const viewer = await requireModule("campaigns");
  const shell = await shellFor(viewer);
  const t = getCampaigns(shell.locale);
  const [campaigns, modules] = await Promise.all([listCampaigns(viewer.org.id), getModuleStatuses(viewer.org.id)]);
  const manages = viewerCan(viewer, "campaigns.manage");
  const waPhoneId = String(modules.find((m) => m.key === "campaigns")?.configuration.whatsapp_phone_number_id ?? "");
  return (
    <AppShell {...shell} width="list">
      <main className="flex-1 p-4 pb-8 lg:px-0">
        <PageHeader
          title={t.title}
          description={t.subtitle}
          actions={
            manages ? (
              <>
                <Link href="/campaigns/templates" className={buttonVariants({ variant: "outline", size: "owner" })}><FileText aria-hidden="true" />{t.templates}</Link>
                <Link href="/campaigns/new" className={buttonVariants({ size: "owner" })}><Plus aria-hidden="true" />{t.newCampaign}</Link>
              </>
            ) : null
          }
        />
        {campaigns.length === 0 ? (
          <EmptyState className="mt-6" icon={<Megaphone />} title={t.empty} body={t.emptyHelp} />
        ) : (
          <ul aria-label={t.title} className="mt-5 border-y border-line">
            {campaigns.map((c) => {
              const tone = TONE[c.status] ?? "outline";
              const label = t.statuses[c.status as keyof typeof t.statuses] ?? c.status;
              return (
                <li key={c.id} className="border-b border-line last:border-b-0">
                  <Link href={`/campaigns/${c.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 hover:bg-paper-100/60">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-body font-semibold text-fg">{c.name}</span>
                      <span className="num block truncate text-caption text-fg-subtle">
                        {t.channels[c.channel]} · {c.status === "draft" ? formatIndianDate(c.createdAt, shell.locale) : t.counts(c.counts.sent ?? 0, c.counts.failed ?? 0, c.counts.suppressed ?? 0, c.counts.replied ?? 0)}
                      </span>
                    </span>
                    {/* Partly failed is the one campaign state worth a chip. */}
                    {tone === "amber" || tone === "laal" ? <StateChip tone={tone}>{label}</StateChip> : <StateWord tone={tone === "hara" ? "done" : tone === "neel" ? "go" : "quiet"}>{label}</StateWord>}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        {viewerCan(viewer, "campaigns.send") ? (
          // Channel setup is a setting, not a campaign: a quiet row at the foot.
          <section aria-labelledby="channel-h" className="mt-12 border-t border-line pt-4">
            <h2 id="channel-h" className="text-caption font-semibold text-fg-subtle">{t.channels.whatsapp}</h2>
            <div className="mt-2 max-w-xl">
              <WhatsAppSettings initial={waPhoneId} label="WhatsApp phone number id" save={t.save} />
            </div>
          </section>
        ) : null}
      </main>
    </AppShell>
  );
}
