import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireModule, viewerCan } from "@/lib/auth/session";
import { shellFor } from "@/lib/auth/shell";
import { getVendors } from "@/lib/i18n/vendors";
import { istDateKey } from "@/lib/tasks/time";
import { listAssignments } from "@/lib/vendors/queries";
import { assignChoices } from "@/lib/vendors/choices";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/waakya/app-shell";
import { ListSurface, PageHeader, Section } from "@/components/waakya/page";
import { AssignForm } from "../assign-form";
import { AssignmentChips } from "../assignment-chips";
import { VendorEdit } from "./vendor-edit";

export const metadata: Metadata = { title: "Vendor" };

export default async function VendorPage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await requireModule("vendors");
  const { id } = await params;
  const shell = await shellFor(viewer);
  const t = getVendors(shell.locale);
  const supabase = await createClient();
  const { data: vendor } = await supabase.from("vendors").select("id, name, phone_e164, email, category, gstin, notes, status").eq("org_id", viewer.org.id).eq("id", id).maybeSingle();
  if (!vendor) notFound();
  const canWrite = viewerCan(viewer, "vendors.write");
  const [work, choices] = await Promise.all([listAssignments(viewer.org.id, { vendorId: id }), canWrite ? assignChoices(viewer.org.id) : Promise.resolve(null)]);
  const today = istDateKey();

  return (
    <AppShell {...shell} width="list">
      <main className="flex-1 p-4 pb-8 lg:px-0">
        <PageHeader back={{ href: "/vendors", label: t.title }} title={vendor.name} description={[vendor.category, vendor.phone_e164, vendor.email, vendor.gstin].filter(Boolean).join(" · ") || undefined} />
        {canWrite ? <VendorEdit locale={shell.locale} vendor={{ id: vendor.id, name: vendor.name, phone: vendor.phone_e164, email: vendor.email, category: vendor.category, notes: vendor.notes, status: vendor.status }} /> : null}
        <Section title={t.work.title} count={work.length} action={canWrite && choices ? <AssignForm locale={shell.locale} choices={choices} fixedVendorId={vendor.id} /> : null}>
          {work.length === 0 ? (
            <p className="text-body-sm text-fg-subtle">{t.work.empty}</p>
          ) : (
            <ListSurface>
              {work.map((a) => (
                <li key={a.id}>
                  <Link href={`/vendors/assignments/${a.id}`} className="flex flex-wrap items-center gap-2 px-4 py-3 hover:bg-paper-50/70">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-body font-semibold text-fg">{a.title}</span>
                      <span className="num block truncate text-caption text-fg-subtle">{[a.projectName, a.taskAssigneeName, a.dueDate].filter(Boolean).join(" · ")}</span>
                    </span>
                    <AssignmentChips locale={shell.locale} assignment={a} today={today} />
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
