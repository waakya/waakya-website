import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireOrg, viewerCan } from "@/lib/auth/session";
import { shellFor } from "@/lib/auth/shell";
import { getPlatform } from "@/lib/i18n/platform";
import { AppShell } from "@/components/waakya/app-shell";
import { listHistory } from "@/lib/events/history";
import { HistoryList } from "./history-list";

export const metadata: Metadata = { title: "History" };

/**
 * The business's own record: who changed what, and why. Read straight from
 * domain_events, which every module writes through the same door.
 */
export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ before?: string; type?: string }> }) {
  const viewer = await requireOrg();
  if (!viewerCan(viewer, "audit.read")) redirect("/aaj");
  const shell = await shellFor(viewer);
  const t = getPlatform(shell.locale).audit;
  const params = await searchParams;
  const page = await listHistory(viewer.org.id, shell.locale, { before: params.before ?? null, type: params.type ?? null });

  return (
    <AppShell {...shell}>
      <main className="flex-1 p-4 pb-8">
        <h1 className="text-[24px] leading-[30px] font-bold text-ink-900">{t.title}</h1>
        <p className="mt-0.5 text-[15px] leading-[20px] text-ink-500">{t.subtitle}</p>
        <HistoryList locale={shell.locale} entries={page.entries} nextBefore={page.nextBefore} type={params.type ?? null} />
      </main>
    </AppShell>
  );
}
