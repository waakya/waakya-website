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
        {/* Stages with deals take room; an empty stage is a narrow column
            with its name and nothing else, so the deals stay on screen. */}
        <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:gap-3 lg:overflow-x-auto lg:pb-2">
          {board.columns.map((col) => (
            /* A stage is a heading over one surface, not a grey slab: an
               empty stage is a heading and one quiet line, and takes no
               more height than that. */
            <section key={col.id} aria-labelledby={`stage-${col.id}`} className={cn("min-w-0 border-t-2 pt-2 lg:shrink-0", col.deals.length ? "lg:min-w-64 lg:flex-1" : "lg:w-36", col.kind === "open" ? "border-neel-600" : col.kind === "won" ? "border-hara-600" : "border-paper-300")}>
              <h2 id={`stage-${col.id}`} className="flex items-baseline justify-between gap-2 px-1 text-body font-bold text-fg">
                <span className="truncate">{col.name}</span>
                <span className="num shrink-0 text-caption font-normal text-fg-subtle">{col.count}{col.value > 0 ? ` · ${money.format(col.value)}` : ""}</span>
              </h2>
              {col.deals.length === 0 ? (
                <p className="mt-2 px-1 text-caption text-fg-subtle">{t.pipeline.empty}</p>
              ) : (
                <ul className="mt-2 divide-y divide-line overflow-hidden rounded-card border border-line bg-surface shadow-card">
                  {col.deals.map((deal) => (
                    <li key={deal.id}>
                      <Link href={`/crm/${deal.contactId}`} className="block px-3 py-2.5 transition-colors duration-150 hover:bg-paper-50/70">
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
