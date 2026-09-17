import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireOrg } from "@/lib/auth/session";
import { shellFor } from "@/lib/auth/shell";
import { createClient } from "@/lib/supabase/server";
import { getPhase1 } from "@/lib/i18n/phase1";
import { getDocument } from "@/lib/documents/queries";
import { renderTemplateHtml } from "@/lib/documents/templates";
import { formatBytes } from "@/lib/documents/rules";
import { AppShell } from "@/components/waakya/app-shell";
import { PrintButton } from "./print-button";

export const metadata: Metadata = { title: "Document" };

/**
 * One document. A generated document is shown in place, rendered from the
 * fields it was saved with. An uploaded file goes to a short-lived signed link,
 * issued only after row level security has agreed this person may see it.
 */
export default async function DocumentPage({ params }: PageProps<"/documents/[id]">) {
  const { id } = await params;
  const viewer = await requireOrg();
  const doc = await getDocument(viewer.org.id, id);
  if (!doc) notFound();

  const supabase = await createClient();

  if (doc.source !== "template" || !doc.templateKey || !doc.templateData) {
    const { data } = await supabase.storage.from("documents").createSignedUrl(doc.storageKey, 120);
    if (!data?.signedUrl) notFound();
    redirect(data.signedUrl);
  }

  const shell = await shellFor(viewer);
  const p = getPhase1(shell.locale);
  const { data: org } = await supabase
    .from("orgs")
    .select("name, address, gstin, phone, email")
    .eq("id", viewer.org.id)
    .single();

  const html = renderTemplateHtml(doc.templateKey, doc.templateData, {
    name: org?.name ?? viewer.org.name,
    address: org?.address ?? null,
    gstin: org?.gstin ?? null,
    phone: org?.phone ?? null,
    email: org?.email ?? null,
  });

  return (
    <AppShell {...shell}>
      <main className="flex-1 p-4 pb-8">
        <Link href="/documents" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-neel-700">
          <ArrowLeft className="size-4" aria-hidden="true" />
          {p.documents.title}
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-[22px] leading-[28px] font-bold text-ink-900">{doc.name}</h1>
            <p className="num mt-0.5 text-[14px] text-ink-500">
              {p.documents.categories[doc.category]} · {formatBytes(doc.sizeBytes)} · {doc.uploaderName}
              {doc.projectName ? ` · ${doc.projectName}` : ""}
            </p>
          </div>
          <PrintButton label={p.templates.print} documentId={doc.id} downloadLabel={p.common.download} />
        </div>
        <iframe
          id="document-frame"
          title={doc.name}
          srcDoc={html}
          className="mt-4 h-[78vh] w-full rounded-card border border-paper-200 bg-white"
        />
      </main>
    </AppShell>
  );
}
