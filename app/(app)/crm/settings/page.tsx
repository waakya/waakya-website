import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireModule, viewerCan } from "@/lib/auth/session";
import { shellFor } from "@/lib/auth/shell";
import { getCrm } from "@/lib/i18n/crm";
import { getPipeline } from "@/lib/crm/queries";
import { AppShell } from "@/components/waakya/app-shell";
import { PageHeader } from "@/components/waakya/page";
import { StageEditor } from "./stage-editor";

export const metadata: Metadata = { title: "Pipeline stages" };

/** The stages a business sells through, in its own words and order. */
export default async function CrmSettingsPage() {
  const viewer = await requireModule("crm");
  if (!viewerCan(viewer, "crm.pipeline.manage")) redirect("/crm");
  const shell = await shellFor(viewer);
  const t = getCrm(shell.locale);
  const pipeline = await getPipeline(viewer.org.id);
  return (
    <AppShell {...shell}>
      <main className="flex-1 p-4 pb-8 lg:px-0">
        <PageHeader back={{ href: "/crm", label: t.title }} title={t.pipeline.manage} description={pipeline.name} />
        <div className="mt-5">
          <StageEditor locale={shell.locale} stages={pipeline.stages} />
        </div>
      </main>
    </AppShell>
  );
}
