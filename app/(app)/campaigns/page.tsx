import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Megaphone, Plus } from "lucide-react";

import { requireModule, viewerCan } from "@/lib/auth/session";
import { shellFor } from "@/lib/auth/shell";
import { getCampaigns } from "@/lib/i18n/campaigns";
import { listCampaigns } from "@/lib/campaigns/queries";
import { formatIndianDate } from "@/lib/tasks/format-date";
import { AppShell } from "@/components/waakya/app-shell";
import { EmptyState, ListSurface, PageHeader } from "@/components/waakya/page";
import { buttonVariants } from "@/components/ui/button";
import { StateChip } from "@/components/ui/state-chip";
import { Section } from "@/components/waakya/page";
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
          <ListSurface className="mt-5" label={t.title}>
            {campaigns.map((c) => (
              <li key={c.id}>
                <Link href={`/campaigns/${c.id}`} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-paper-50/70">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-body font-semibold text-fg">{c.name}</span>
                    <span className="num block truncate text-caption text-fg-subtle">
                      {t.channels[c.channel]} · {c.status === "draft" ? formatIndianDate(c.createdAt, shell.locale) : t.counts(c.counts.sent ?? 0, c.counts.failed ?? 0, c.counts.suppressed ?? 0, c.counts.replied ?? 0)}
                    </span>
                  </span>
                  <StateChip tone={TONE[c.status] ?? "outline"}>{t.statuses[c.status as keyof typeof t.statuses] ?? c.status}</StateChip>
                </Link>
              </li>
            ))}
          </ListSurface>
        )}
        {viewerCan(viewer, "campaigns.send") ? (
          <Section title={t.channels.whatsapp}>
            <WhatsAppSettings initial={waPhoneId} label="WhatsApp phone number id" save={t.save} />
          </Section>
        ) : null}
      </main>
    </AppShell>
  );
}
