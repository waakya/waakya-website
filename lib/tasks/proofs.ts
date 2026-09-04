import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getMemberNames } from "@/lib/org/members";
import { getProofStorage } from "@/lib/storage";

export interface ProofItem {
  id: string;
  kind: string;
  body: string | null;
  byName: string;
  at: string;
  /** Short-lived, and null when the file has gone or cannot be signed. */
  url: string | null;
}

/**
 * The proofs on a task, each with a link that expires. The object key is never
 * sent to the browser — only a signed URL that stops working shortly after.
 */
export async function getTaskProofs(
  taskId: string,
  orgId: string,
): Promise<ProofItem[]> {
  const supabase = await createClient();
  const [{ data }, names] = await Promise.all([
    supabase
      .from("proofs")
      .select("id, kind, body, url, created_by, created_at")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true }),
    getMemberNames(orgId),
  ]);

  if (!data?.length) return [];

  const storage = getProofStorage(supabase);
  return Promise.all(
    data.map(async (row) => ({
      id: row.id,
      kind: row.kind,
      body: row.body,
      byName: names.get(row.created_by) ?? "—",
      at: row.created_at,
      url: row.url ? await storage.presignDownload(row.url).catch(() => null) : null,
    })),
  );
}
