"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { type Locale } from "@/lib/i18n";
import { getPhase1 } from "@/lib/i18n/phase1";
import { recordDocument, requestDocumentUpload } from "@/lib/actions/documents";
import {
  DOCUMENT_CATEGORIES,
  MAX_DOCUMENT_BYTES,
  isAllowedType,
  type DocumentCategory,
} from "@/lib/documents/rules";

/**
 * Upload one or more files. The file goes straight from the browser to private
 * storage through a URL the server signs for a key inside this business; the
 * app only records it once it has landed.
 *
 * Used by the library, a project and a task, so a document can be born already
 * attached to the work it belongs to.
 */
export function DocumentUploader({
  locale,
  taskId,
  projectId,
  defaultCategory = "other",
  compact = false,
}: {
  locale: Locale;
  taskId?: string;
  projectId?: string;
  defaultCategory?: DocumentCategory;
  compact?: boolean;
}) {
  const p = getPhase1(locale);
  const router = useRouter();
  const input = React.useRef<HTMLInputElement>(null);
  const [category, setCategory] = React.useState<DocumentCategory>(defaultCategory);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > MAX_DOCUMENT_BYTES) {
          setError(p.documents.tooBig);
          return;
        }
        const type = file.type || "application/octet-stream";
        if (!isAllowedType(type)) {
          setError(p.documents.badType);
          return;
        }
        const signed = await requestDocumentUpload({
          name: file.name,
          contentType: type,
          size: file.size,
        });
        if (!signed.ok) {
          setError(signed.message);
          return;
        }
        const put = await fetch(signed.data.url, {
          method: "PUT",
          headers: signed.data.headers,
          body: file,
        });
        if (!put.ok) {
          setError(p.common.failed);
          return;
        }
        const saved = await recordDocument({
          key: signed.data.key,
          name: file.name,
          contentType: type,
          size: file.size,
          category,
          taskId: taskId ?? null,
          projectId: projectId ?? null,
        });
        if (!saved.ok) {
          setError(saved.message);
          return;
        }
      }
      router.refresh();
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="min-w-0">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {!compact ? (
          <label className="sr-only" htmlFor="doc-category">
            {p.documents.category}
          </label>
        ) : null}
        <select
          id={compact ? undefined : "doc-category"}
          aria-label={p.documents.category}
          value={category}
          onChange={(event) => setCategory(event.target.value as DocumentCategory)}
          className="h-10 max-w-full min-w-0 rounded-button border border-paper-200 bg-paper-0 px-3 text-[14px] text-ink-900"
        >
          {DOCUMENT_CATEGORIES.map((value) => (
            <option key={value} value={value}>
              {p.documents.categories[value]}
            </option>
          ))}
        </select>
        <input
          ref={input}
          type="file"
          multiple
          className="sr-only"
          data-testid="document-file-input"
          accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
          onChange={(event) => upload(event.target.files)}
        />
        <Button
          type="button"
          size={compact ? "sm" : "owner"}
          variant={compact ? "outline" : "primary"}
          disabled={busy}
          onClick={() => input.current?.click()}
        >
          <Upload aria-hidden="true" />
          {busy ? p.documents.uploading : compact ? p.documents.attachToTask : p.documents.upload}
        </Button>
      </div>
      {error ? (
        <p
          role="alert"
          data-testid="upload-error"
          className="mt-2 rounded-card bg-laal-100 px-3 py-2 text-[14px] text-laal-700"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
