import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireModule, viewerCan } from "@/lib/auth/session";
import { shellFor } from "@/lib/auth/shell";
import { getCampaigns } from "@/lib/i18n/campaigns";
import { campaignChoices } from "@/lib/campaigns/choices";
import { AppShell } from "@/components/waakya/app-shell";
import { PageHeader } from "@/components/waakya/page";
import { CampaignForm } from "../campaign-form";

export const metadata: Metadata = { title: "New campaign" };

export default async function NewCampaignPage() {
  const viewer = await requireModule("campaigns");
  if (!viewerCan(viewer, "campaigns.manage")) redirect("/campaigns");
  const shell = await shellFor(viewer);
  const t = getCampaigns(shell.locale);
  const choices = await campaignChoices(viewer.org.id);
  return (
    <AppShell {...shell} width="list">
      <main className="flex-1 p-4 pb-8 lg:px-0">
        <PageHeader back={{ href: "/campaigns", label: t.title }} title={t.newCampaign} />
        <div className="mt-5"><CampaignForm locale={shell.locale} choices={choices} initial={null} /></div>
      </main>
    </AppShell>
  );
}
