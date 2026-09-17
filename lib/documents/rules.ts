/**
 * What a document may be, and where it lives.
 *
 * The storage key's first two segments name the org. That is what the storage
 * policies and the documents table constraint both read, so a key built here
 * can only ever be written inside the uploader's own business.
 */

export const DOCUMENT_CATEGORIES = [
  "quotation",
  "proposal",
  "invoice",
  "agreement",
  "nda",
  "purchase_order",
  "work_order",
  "receipt",
  "sow",
  "report",
  "meeting_minutes",
  "other",
] as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

/** 25 MB — a scanned agreement or a deck, not a video. */
export const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024;

export const DOCUMENT_TYPES: Record<string, string> = {
  "application/pdf": "PDF",
  "image/jpeg": "Image",
  "image/png": "Image",
  "image/webp": "Image",
  "image/heic": "Image",
  "application/msword": "Word",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word",
  "application/vnd.ms-excel": "Excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "Excel",
  "application/vnd.ms-powerpoint": "PowerPoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PowerPoint",
  "text/plain": "Text",
  "text/csv": "CSV",
  "text/html": "Document",
};

export function isAllowedType(contentType: string): boolean {
  return Object.prototype.hasOwnProperty.call(DOCUMENT_TYPES, contentType);
}

/** A file name safe to use as the last path segment. */
export function safeFileName(name: string): string {
  const trimmed = name.trim().replace(/[/\\]+/g, "-");
  const cleaned = trimmed.replace(/[^\w.\- ()]+/g, "").replace(/\s+/g, "_");
  return (cleaned || "document").slice(0, 120);
}

export function documentKey(orgId: string, fileId: string, name: string): string {
  return `orgs/${orgId}/documents/${fileId}/${safeFileName(name)}`;
}

/** The org a document key belongs to, or null if it is not one of ours. */
export function orgIdFromDocumentKey(key: string): string | null {
  const match = /^orgs\/([0-9a-f-]{36})\/documents\/[0-9a-f-]{36}\/[^/]+$/i.exec(key);
  return match ? match[1] : null;
}

/** "412 KB", "1.2 MB". */
export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
