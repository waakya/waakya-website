"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, FileText, Image as ImageIcon, Sheet, Trash2 } from "lucide-react";

import { getDictionary, type Locale } from "@/lib/i18n";
import { getPhase1 } from "@/lib/i18n/phase1";
import { deleteDocument, openDocument } from "@/lib/actions/documents";
import { formatBytes } from "@/lib/documents/rules";
import type { DocumentItem } from "@/lib/documents/queries";
import { formatIndianDate } from "@/lib/tasks/format-date";
import { cn } from "@/lib/utils";

function iconFor(mime: string | null) {
  if (mime?.startsWith("image/")) return ImageIcon;
  if (mime?.includes("sheet") || mime?.includes("excel") || mime === "text/csv") return Sheet;
  return FileText;
}

/**
 * One list of documents, used everywhere a document appears: the library, a
 * project, a task. Each row says what the file is, who put it there and what
 * work it belongs to, and offers open, download and — for the uploader or a
 * manager — delete.
 */
export function DocumentList({
  locale,
  documents,
  viewerId,
  manages,
  showLinks = true,
  className,
}: {
  locale: Locale;
  documents: DocumentItem[];
  viewerId: string;
  manages: boolean;
  showLinks?: boolean;
  className?: string;
}) {
  const p = getPhase1(locale);
  const t = getDictionary(locale);
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function run(id: string, download: boolean) {
    setError(null);
    setBusy(id);
    // Phones only allow a new tab inside the tap itself, so open it now and
    // point it at the file once the signed link arrives.
    const tab = download ? null : window.open("about:blank", "_blank");
    if (tab) tab.opener = null;
    const result = await openDocument({ id, download });
    setBusy(null);
    if (!result.ok) {
      tab?.close();
      setError(result.message);
      return;
    }
    const url = result.data.url;
    if (url.startsWith("/")) {
      tab?.close();
      router.push(url);
    } else if (download) window.location.assign(url);
    else if (tab) tab.location.replace(url);
    else window.location.assign(url);
  }

  async function remove(id: string) {
    if (!window.confirm(p.documents.deleteConfirm)) return;
    setError(null);
    setBusy(id);
    const result = await deleteDocument({ id });
    setBusy(null);
    if (!result.ok) setError(result.message);
    else router.refresh();
  }

  return (
    <div className={className}>
      {error ? (
        <p
          role="alert"
          data-testid="documents-error"
          className="mb-2 rounded-card bg-laal-100 px-3 py-2 text-body-sm text-laal-700"
        >
          {error}
        </p>
      ) : null}
      <ul className="border-y border-line">
        {documents.map((doc) => {
          const Icon = iconFor(doc.mimeType);
          const canDelete = doc.uploadedBy === viewerId || manages;
          // A template document is a page Waakya laid out; its ".html" is a
          // storage detail, not part of the name people gave it.
          const shownName = doc.source === "template" ? doc.name.replace(/\.html$/i, "") : doc.name;
          return (
            <li
              key={doc.id}
              data-testid="document-row"
              className="flex items-center gap-3 border-b border-line py-2.5 transition-colors duration-150 last:border-b-0 hover:bg-paper-100/60"
            >
              {/* The file's kind as a small mark, not a tinted tile. */}
              <Icon className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => run(doc.id, false)}
                  title={shownName}
                  className="block max-w-full truncate text-left text-body-sm font-semibold text-fg hover:text-neel-700"
                >
                  {shownName}
                </button>
                <span className="num block truncate text-caption text-fg-subtle">
                  {p.documents.categories[doc.category] ?? doc.category}
                  {" · "}
                  {formatBytes(doc.sizeBytes)}
                  {" · "}
                  {doc.uploaderName}
                  {" · "}
                  {formatIndianDate(doc.createdAt, locale)}
                </span>
                {showLinks && (doc.taskTitle || doc.projectName) ? (
                  <span className="mt-0.5 flex flex-wrap gap-x-3 text-caption">
                    {doc.taskId && doc.taskTitle ? (
                      <Link href={`/kaam/${doc.taskId}`} className="truncate text-neel-700 hover:underline">
                        {p.documents.linkedTask}: {doc.taskTitle}
                      </Link>
                    ) : null}
                    {doc.projectId && doc.projectName ? (
                      <Link href={`/projects/${doc.projectId}`} className="truncate text-neel-700 hover:underline">
                        {p.documents.linkedProject}: {doc.projectName}
                      </Link>
                    ) : null}
                  </span>
                ) : null}
              </span>
              <span className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  aria-label={`${p.common.download} ${doc.name}`}
                  title={p.common.download}
                  disabled={busy === doc.id}
                  onClick={() => run(doc.id, true)}
                  className="grid size-9 place-items-center rounded-inner text-ink-500 transition-colors hover:bg-paper-100 hover:text-ink-900 disabled:opacity-40"
                >
                  <Download className="size-4" aria-hidden="true" />
                </button>
                {canDelete ? (
                  <button
                    type="button"
                    aria-label={`${p.common.delete} ${doc.name}`}
                    title={p.common.delete}
                    disabled={busy === doc.id}
                    onClick={() => remove(doc.id)}
                    className={cn(
                      "grid size-9 place-items-center rounded-inner text-ink-400 transition-colors hover:bg-laal-100 hover:text-laal-700 disabled:opacity-40",
                    )}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>
      {busy ? <span className="sr-only">{t.common.loading}</span> : null}
    </div>
  );
}
