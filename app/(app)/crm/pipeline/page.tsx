import type { Metadata } from "next";
import Link from "next/link";

import { requireModule } from "@/lib/auth/session";
import { shellFor } from "@/lib/auth/shell";
import { getCrm } from "@/lib/i18n/crm";
import { getPipelineBoard } from "@/lib/crm/queries";
import { AppShell } from "@/components/waakya/app-shell";
import { PageHeader } from "@/components/waakya/page";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Pipeline" };

/** Every deal, by stage. Columns on a desk; stacked, in order, on a phone. */
export default async function PipelinePage() {
  const viewer = await requireModule("crm");
  const shell = await shellFor(viewer);
  const t = getCrm(shell.locale);
  const board = await getPipelineBoard(viewer.org.id);
  const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

  return (
    <AppShell {...shell} width="full">
      <main className="flex-1 p-4 pb-8 lg:px-8">
        <PageHeader back={{ href: "/crm", label: t.title }} title={t.pipeline.title} description={t.pipeline.subtitle} />
        <div className="mt-5 flex flex-col gap-4 lg:grid lg:auto-cols-[minmax(15rem,1fr)] lg:grid-flow-col lg:overflow-x-auto">
          {board.columns.map((col) => (
            <section key={col.id} aria-labelledby={`stage-${col.id}`} className={cn("rounded-card border border-line bg-surface-muted p-3", col.kind !== "open" && "opacity-90")}>
              <h2 id={`stage-${col.id}`} className="flex items-baseline justify-between gap-2 text-body font-bold text-fg">
                <span>{col.name}</span>
                <span className="num text-caption font-normal text-fg-subtle">{col.count}{col.value > 0 ? ` · ${money.format(col.value)}` : ""}</span>
              </h2>
              {col.deals.length === 0 ? (
                <p className="mt-2 text-caption text-fg-subtle">{t.pipeline.empty}</p>
              ) : (
                <ul className="mt-2 flex flex-col gap-2">
                  {col.deals.map((deal) => (
                    <li key={deal.id}>
                      <Link href={`/crm/${deal.contactId}`} className="block rounded-inner border border-line bg-surface p-3 shadow-card transition-colors duration-150 hover:border-neel-300">
                        <span className="block truncate text-body font-semibold text-fg">{deal.contactName}</span>
                        <span className="num block truncate text-caption text-fg-subtle">
                          {deal.title}{deal.value !== null ? ` · ${money.format(deal.value)}` : ""}{deal.ownerName ? ` · ${deal.ownerName}` : ""}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </main>
    </AppShell>
  );
}
