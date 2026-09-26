import type { Metadata } from "next";
import Link from "next/link";
import { Phone, Truck } from "lucide-react";

import { requireModule, viewerCan } from "@/lib/auth/session";
import { shellFor } from "@/lib/auth/shell";
import { getVendors } from "@/lib/i18n/vendors";
import { listAssignments, listVendors } from "@/lib/vendors/queries";
import { AppShell } from "@/components/waakya/app-shell";
import { EmptyState, ListSurface, PageHeader, Section } from "@/components/waakya/page";
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

  return (
    <AppShell {...shell} width="list">
      <main className="flex-1 p-4 pb-8 lg:px-0">
        <PageHeader title={t.title} description={t.subtitle} actions={canWrite ? <VendorForm locale={shell.locale} /> : undefined} />

        {vendors.length === 0 ? (
          <EmptyState className="mt-6" icon={<Truck />} title={t.empty} body={t.emptyHelp} />
        ) : (
          <ListSurface className="mt-5" label={t.title}>
            {vendors.map((v) => (
              <li key={v.id} className="relative flex items-center gap-3 px-4 py-3 hover:bg-paper-50/70">
                <div className="min-w-0 flex-1">
                  <Link href={`/vendors/${v.id}`} className="block truncate text-body font-semibold text-fg after:absolute after:inset-0">{v.name}</Link>
                  <p className="num truncate text-caption text-fg-subtle">{[v.category, v.phone, v.email].filter(Boolean).join(" · ")}</p>
                </div>
                {v.openWork > 0 ? (
                  <span className="num shrink-0 text-label font-semibold text-neel-700">
                    {v.openWork} · {t.work.title}
                  </span>
                ) : null}
                {v.status === "inactive" ? <StateChip tone="muted">{t.status.inactive}</StateChip> : null}
                {v.phone ? (
                  <a href={`tel:${v.phone}`} aria-label={`${v.name}`} className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "relative z-10")}>
                    <Phone aria-hidden="true" />
                  </a>
                ) : null}
              </li>
            ))}
          </ListSurface>
        )}

        <Section title={t.work.title} count={open.length}>
          {open.length === 0 ? (
            <p className="text-body-sm text-fg-subtle">{t.work.empty}</p>
          ) : (
            <ListSurface>
              {open.map((a) => (
                <li key={a.id}>
                  <Link href={`/vendors/assignments/${a.id}`} className="flex flex-wrap items-center gap-2 px-4 py-3 hover:bg-paper-50/70">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-body font-semibold text-fg">{a.title}</span>
                      <span className="num block truncate text-caption text-fg-subtle">{[a.vendorName, a.projectName, a.taskAssigneeName].filter(Boolean).join(" · ")}</span>
                    </span>
                    <AssignmentChips locale={shell.locale} assignment={a} />
                  </Link>
                </li>
              ))}
            </ListSurface>
          )}
        </Section>
      </main>
    </AppShell>
  );
}
