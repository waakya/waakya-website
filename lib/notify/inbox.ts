import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export interface InboxItem {
  id: string;
  event: string;
  body: string;
  taskId: string | null;
  /** Where the notification leads when it is not about a task. */
  href: string | null;
  readAt: string | null;
  at: string;
}

/** One person's inbox, newest first. RLS already scopes it to them. */
export const getInbox = cache(async (limit = 50): Promise<InboxItem[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("id, event, body, task_id, href, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => ({
    id: row.id,
    event: row.event,
    body: row.body ?? "",
    taskId: row.task_id,
    href: row.href,
    readAt: row.read_at,
    at: row.created_at,
  }));
});

export const getUnreadCount = cache(async (): Promise<number> => {
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);
  return count ?? 0;
});
