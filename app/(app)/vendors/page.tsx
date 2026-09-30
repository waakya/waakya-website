import type { Metadata } from "next";
import Link from "next/link";
import { Phone, Truck } from "lucide-react";

import { requireModule, viewerCan } from "@/lib/auth/session";
import { shellFor } from "@/lib/auth/shell";
import { getVendors } from "@/lib/i18n/vendors";
import { listAssignments, listVendors } from "@/lib/vendors/queries";
import { AppShell } from "@/components/waakya/app-shell";
import { EmptyState, PageHeader } from "@/components/waakya/page";
import { istDateKey } from "@/lib/tasks/time";
import { buttonVariants } from "@/components/ui/button";
import { StateChip } from "@/components/ui/state-chip";
import { cn } from "@/lib/utils";
import { VendorForm } from "./vendor-form";
import { AssignmentChips } from "./assignment-chips";

export const metadata: Metadata = { title: "Vendors" };

/** Vendors, and the work waiting on them or on us. */
export default async function VendorsPage() {
  const viewer = await requireModule("vendors");
  const shell = await shellFor(viewer);
  const t = getVendors(shell.locale);
  const [vendors, open] = await Promise.all([
    listVendors(viewer.org.id),
    listAssignments(viewer.org.id, { status: ["assigned", "in_progress", "submitted", "rejected"] }),
  ]);
  const canWrite = viewerCan(viewer, "vendors.write");
  const today = istDateKey();

  return (
    <AppShell {...shell} width="list">
      <main className="flex-1 p-4 pb-8 lg:px-0">
        <PageHeader title={t.title} description={t.subtitle} actions={canWrite ? <VendorForm locale={shell.locale} /> : undefined} />

        {vendors.length === 0 ? (
          <EmptyState className="mt-6" icon={<Truck />} title={t.empty} body={t.emptyHelp} />
        ) : (
          <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-12">
            {/* What is moving comes first: the work vendors are doing for you. */}
            <section aria-labelledby="vwork-h">
              <h2 id="vwork-h" className="mb-2 text-body font-bold text-fg">
                {t.work.title} <span className="num font-normal text-fg-subtle">{open.length}</span>
              </h2>
              {open.length === 0 ? (
                <p className="border-y border-line py-3 text-body-sm text-fg-subtle">{t.work.empty}</p>
              ) : (
                <ul className="border-y border-line">
                  {open.map((a) => (
                    <li key={a.id} className="border-b border-line last:border-b-0">
                      <Link href={`/vendors/assignments/${a.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 hover:bg-paper-100/60">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-body font-semibold text-fg">{a.title}</span>
                          <span className="num block truncate text-caption text-fg-subtle">{[a.vendorName, a.projectName, a.taskAssigneeName].filter(Boolean).join(" · ")}</span>
                        </span>
                        <AssignmentChips locale={shell.locale} assignment={a} today={today} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section aria-labelledby="vlist-h">
              <h2 id="vlist-h" className="mb-2 text-body font-bold text-fg">
                {t.title} <span className="num font-normal text-fg-subtle">{vendors.length}</span>
              </h2>
              <ul aria-label={t.title} className="border-y border-line">
                {vendors.map((v) => (
                  <li key={v.id} className="relative flex min-h-14 items-center gap-3 border-b border-line py-2 last:border-b-0 hover:bg-paper-100/60">
                    <div className="min-w-0 flex-1">
                      <Link href={`/vendors/${v.id}`} className="block truncate text-body font-semibold text-fg after:absolute after:inset-0">{v.name}</Link>
                      <p className="num truncate text-caption text-fg-subtle">
                        {[v.category, v.openWork > 0 ? `${v.openWork} ${t.work.title.toLowerCase()}` : null].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    {v.status === "inactive" ? <StateChip tone="muted">{t.status.inactive}</StateChip> : null}
                    {v.phone ? (
                      <a href={`tel:${v.phone}`} aria-label={`${v.name}`} className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "relative z-10")}>
                        <Phone aria-hidden="true" />
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </main>
    </AppShell>
  );
}
