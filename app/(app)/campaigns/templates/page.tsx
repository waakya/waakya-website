import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireModule, viewerCan } from "@/lib/auth/session";
import { shellFor } from "@/lib/auth/shell";
import { getCampaigns } from "@/lib/i18n/campaigns";
import { listTemplates } from "@/lib/campaigns/queries";
import { AppShell } from "@/components/waakya/app-shell";
import { ListSurface, PageHeader, Section } from "@/components/waakya/page";
import { StateChip } from "@/components/ui/state-chip";
import { TemplateForm } from "./template-form";

export const metadata: Metadata = { title: "Message templates" };

export default async function TemplatesPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const viewer = await requireModule("campaigns");
  if (!viewerCan(viewer, "campaigns.manage")) redirect("/campaigns");
  const shell = await shellFor(viewer);
  const t = getCampaigns(shell.locale);
  const templates = await listTemplates(viewer.org.id);
  const { edit } = await searchParams;
  const editing = edit ? templates.find((x) => x.id === edit) ?? null : null;
  return (
    <AppShell {...shell} width="list">
      <main className="flex-1 p-4 pb-8 lg:px-0">
        <PageHeader back={{ href: "/campaigns", label: t.title }} title={t.templates} />
        <Section title={editing ? editing.name : t.newTemplate}>
          <TemplateForm key={editing?.id ?? "new"} locale={shell.locale} initial={editing} canApprove={viewerCan(viewer, "campaigns.send")} />
        </Section>
        <Section title={t.templates} count={templates.length}>
          {templates.length ? (
            <ListSurface>
              {templates.map((x) => (
                <li key={x.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <a href={`/campaigns/templates?edit=${x.id}`} className="min-w-0 flex-1 truncate text-body font-semibold text-neel-700">{x.name}</a>
                  <span className="text-caption text-fg-subtle">{t.channels[x.channel]}</span>
                  <StateChip tone={x.status === "approved" ? "hara" : x.status === "rejected" ? "laal" : "outline"}>{t.templateFields.statuses[x.status as keyof typeof t.templateFields.statuses] ?? x.status}</StateChip>
                </li>
              ))}
            </ListSurface>
          ) : (
            <p className="text-body-sm text-fg-subtle">—</p>
          )}
        </Section>
      </main>
    </AppShell>
  );
}
