/**
 * Where a proof lives.
 *
 * The org id is the first meaningful path segment because that is what the
 * access rule reads: storage policies scope by membership of the org in the
 * key, and R2's bucket policy will do the same. Nothing about the key is a
 * secret — the file is reached only through a short-lived signed URL.
 */
export function proofKey(
  orgId: string,
  taskId: string,
  fileId: string,
  extension: string,
): string {
  return `orgs/${orgId}/tasks/${taskId}/${fileId}.${extension}`;
}

/** The org a key belongs to, or null if it is not shaped like one of ours. */
export function orgIdFromKey(key: string): string | null {
  const match = /^orgs\/([0-9a-f-]{36})\/tasks\/[0-9a-f-]{36}\/[\w-]+\.[a-z0-9]+$/i.exec(
    key,
  );
  return match ? match[1] : null;
}

/** What a proof may be, and what it is called on disk. */
export const PROOF_TYPES: Record<string, { extension: string; kind: "photo" | "voice" }> = {
  "image/jpeg": { extension: "jpg", kind: "photo" },
  "image/png": { extension: "png", kind: "photo" },
  "image/webp": { extension: "webp", kind: "photo" },
  "image/heic": { extension: "heic", kind: "photo" },
  "audio/webm": { extension: "webm", kind: "voice" },
  "audio/mpeg": { extension: "mp3", kind: "voice" },
  "audio/mp4": { extension: "m4a", kind: "voice" },
  "audio/ogg": { extension: "ogg", kind: "voice" },
};

/** 10 MB: a phone photo, not a video. */
export const MAX_PROOF_BYTES = 10 * 1024 * 1024;
