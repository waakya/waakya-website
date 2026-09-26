import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, FilePlus2, FileText } from "lucide-react";

import { requireOrg, canManage } from "@/lib/auth/session";
import { shellFor } from "@/lib/auth/shell";
import { getPhase1 } from "@/lib/i18n/phase1";
import { getUx } from "@/lib/i18n/ux";
import { TEMPLATES } from "@/lib/documents/templates";
import { listDocuments } from "@/lib/documents/queries";
import { AppShell } from "@/components/waakya/app-shell";
import { PageHeader } from "@/components/waakya/page";
import { DocumentUploader } from "@/components/waakya/document-uploader";
import { Illustration } from "@/components/waakya/illustrations";
import { DocumentLibrary } from "./document-library";

export const metadata: Metadata = { title: "Documents" };

/** The business's paperwork, each file tied to the work it belongs to. */
export default async function DocumentsPage() {
  const viewer = await requireOrg();
  const shell = await shellFor(viewer);
  const p = getPhase1(shell.locale);
  const ux = getUx(shell.locale);
  const quick = ["quotation", "invoice", "work_order", "proposal"]
    .map((key) => TEMPLATES.find((template) => template.key === key))
    .filter((template) => template !== undefined);
  const documents = await listDocuments(viewer.org.id);

  return (
    <AppShell {...shell} width="list">
      <main className="flex-1 p-4 pb-8 lg:px-0">
        <PageHeader
          title={p.documents.title}
          description={p.documents.subtitle}
        />

        {/* Most paperwork starts from a template, so the templates sit at the
            top of the library rather than behind a button. */}
        <section aria-labelledby="templates-heading" className="mt-6" data-testid="templates-entry">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="templates-heading" className="flex items-center gap-2 text-body font-bold text-fg">
              <FilePlus2 className="size-4 text-neel-700" aria-hidden="true" />
              {ux.templates.createFromTemplate}
            </h2>
            <Link href="/documents/templates" className="inline-flex min-h-8 items-center gap-0.5 text-body-sm font-semibold text-neel-700 hover:text-neel-800">
              {ux.templates.allTemplates}
              <ChevronRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <p className="mt-0.5 text-body-sm text-fg-subtle">{ux.templates.rowLead}</p>
          <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {quick.map((template) => (
              <li key={template.key}>
                <Link
                  href={`/documents/templates?template=${template.key}`}
                  className="group flex h-full min-h-14 items-center gap-2.5 rounded-card border border-line bg-surface px-3 py-2.5 shadow-card transition-colors duration-150 hover:border-neel-300"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-inner bg-neel-50 text-neel-700">
                    <FileText className="size-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-body-sm font-semibold text-fg">{template.title}</span>
                    <span className="block truncate text-caption text-fg-subtle">{template.blurb}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-body font-bold text-fg">
            {p.documents.title} <span className="num font-normal text-fg-subtle">{documents.length}</span>
          </h2>
          <DocumentUploader locale={shell.locale} />
        </div>

        {documents.length === 0 ? (
          <div className="mt-3 flex flex-col items-center rounded-card border border-dashed border-line-strong px-6 py-10 text-center">
            <Illustration name="documents" className="h-28 w-auto" />
            <p className="mt-4 text-title-sm font-bold text-fg">{p.documents.empty}</p>
            <p className="mt-1 max-w-sm text-body text-fg-subtle">{p.documents.emptyHelp}</p>
          </div>
        ) : (
          <DocumentLibrary
            locale={shell.locale}
            documents={documents}
            viewerId={viewer.userId}
            manages={canManage(viewer.role)}
          />
        )}
      </main>
    </AppShell>
  );
}
