import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, FilePlus2 } from "lucide-react";

import { requireOrg, canManage } from "@/lib/auth/session";
import { shellFor } from "@/lib/auth/shell";
import { getPhase1 } from "@/lib/i18n/phase1";
import { getUx } from "@/lib/i18n/ux";
import { TEMPLATES } from "@/lib/documents/templates";
import { listDocuments } from "@/lib/documents/queries";
import { AppShell } from "@/components/waakya/app-shell";
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
    <AppShell {...shell}>
      <main className="flex-1 p-4 pb-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[24px] leading-[30px] font-bold text-ink-900">
              {p.documents.title}
            </h1>
            <p className="mt-0.5 text-[15px] leading-[20px] text-ink-500">
              {p.documents.subtitle}
            </p>
          </div>
        </div>

        {/* Most paperwork starts from a template, so the templates sit at the
            top of the library rather than behind a button. */}
        <section
          aria-labelledby="templates-heading"
          className="mt-5 rounded-card border border-neel-100 bg-paper-0 p-4"
          data-testid="templates-entry"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="templates-heading" className="flex items-center gap-2 text-[15px] font-bold text-ink-900">
              <FilePlus2 className="size-4 text-neel-700" aria-hidden="true" />
              {ux.templates.createFromTemplate}
            </h2>
            <Link href="/documents/templates" className="inline-flex items-center gap-0.5 text-[14px] font-semibold text-neel-700 hover:underline">
              {ux.templates.allTemplates}
              <ChevronRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <p className="mt-0.5 text-[14px] text-ink-500">{ux.templates.rowLead}</p>
          <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {quick.map((template) => (
              <li key={template.key}>
                <Link
                  href={`/documents/templates?template=${template.key}`}
                  className="flex min-h-11 items-center justify-center rounded-button border border-paper-200 px-3 text-center text-[14px] font-semibold text-ink-900 hover:border-neel-300 hover:bg-neel-50"
                >
                  {template.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-5">
          <DocumentUploader locale={shell.locale} />
        </div>

        {documents.length === 0 ? (
          <div className="mt-8 flex flex-col items-center rounded-card border border-dashed border-paper-300 px-6 py-10 text-center">
            <Illustration name="documents" className="h-32 w-auto" />
            <p className="mt-4 font-display text-[22px] font-bold text-ink-900">
              {p.documents.empty}
            </p>
            <p className="mt-1 max-w-sm text-[15px] leading-[21px] text-ink-500">
              {p.documents.emptyHelp}
            </p>
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
