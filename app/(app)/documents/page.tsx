import type { Metadata } from "next";
import Link from "next/link";
import { LayoutTemplate } from "lucide-react";

import { requireOrg, canManage } from "@/lib/auth/session";
import { shellFor } from "@/lib/auth/shell";
import { getPhase1 } from "@/lib/i18n/phase1";
import { listDocuments } from "@/lib/documents/queries";
import { AppShell } from "@/components/waakya/app-shell";
import { buttonVariants } from "@/components/ui/button";
import { DocumentUploader } from "@/components/waakya/document-uploader";
import { Illustration } from "@/components/waakya/illustrations";
import { DocumentLibrary } from "./document-library";

export const metadata: Metadata = { title: "Documents" };

/** The business's paperwork, each file tied to the work it belongs to. */
export default async function DocumentsPage() {
  const viewer = await requireOrg();
  const shell = await shellFor(viewer);
  const p = getPhase1(shell.locale);
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
          <Link
            href="/documents/templates"
            className={buttonVariants({ variant: "outline", size: "owner" })}
          >
            <LayoutTemplate aria-hidden="true" />
            {p.documents.templates}
          </Link>
        </div>

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
