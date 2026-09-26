import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireModule, viewerCan } from "@/lib/auth/session";
import { shellFor } from "@/lib/auth/shell";
import { getAutomation } from "@/lib/i18n/automation";
import { editorChoices } from "@/lib/automation/choices";
import { AppShell } from "@/components/waakya/app-shell";
import { PageHeader } from "@/components/waakya/page";
import { RuleEditor } from "../rule-editor";

export const metadata: Metadata = { title: "New rule" };

export default async function NewRulePage() {
  const viewer = await requireModule("automation");
  if (!viewerCan(viewer, "automation.manage")) redirect("/automations");
  const shell = await shellFor(viewer);
  const t = getAutomation(shell.locale);
  const choices = await editorChoices(viewer.org.id);
  return (
    <AppShell {...shell} width="list">
      <main className="flex-1 p-4 pb-8 lg:px-0">
        <PageHeader back={{ href: "/automations", label: t.title }} title={t.newRule} />
        <div className="mt-5"><RuleEditor locale={shell.locale} choices={choices} initial={null} /></div>
      </main>
    </AppShell>
  );
}
