import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getMemberNames } from "@/lib/org/members";
import { getPlatform } from "@/lib/i18n/platform";
import type { Locale } from "@/lib/i18n";
import { describeEvent } from "./describe";

export interface HistoryEntry {
  id: string;
  text: string;
  href: string | null;
  actor: string;
  at: string;
}

const PAGE = 50;

/** One page of the business's history, newest first, keyed by time for the next page. */
export async function listHistory(
  orgId: string,
  locale: Locale,
  options: { before: string | null; type: string | null; entityId?: string | null },
): Promise<{ entries: HistoryEntry[]; nextBefore: string | null }> {
  const supabase = await createClient();
  let query = supabase
    .from("domain_events")
    .select("id, event_type, entity_type, entity_id, actor_kind, actor_id, payload, occurred_at")
    .eq("org_id", orgId)
    .order("occurred_at", { ascending: false })
    .limit(PAGE + 1);
  if (options.before) query = query.lt("occurred_at", options.before);
  if (options.type) query = query.eq("event_type", options.type);
  if (options.entityId) query = query.eq("entity_id", options.entityId);
  const { data } = await query;
  const rows = data ?? [];
  const names = await getMemberNames(orgId);
  const t = getPlatform(locale).audit;

  const entries = rows.slice(0, PAGE).map((row) => {
    const described = describeEvent(locale, row.event_type, (row.payload ?? {}) as Record<string, unknown>, row.entity_id, names);
    const actor =
      row.actor_kind === "user" && row.actor_id ? (names.get(row.actor_id) ?? t.system)
      : row.actor_kind === "customer" ? t.customer
      : row.actor_kind === "automation" ? t.automation
      : row.actor_kind === "integration" ? t.integration
      : t.system;
    return { id: row.id, text: described.text, href: described.href, actor, at: row.occurred_at };
  });
  const nextBefore = rows.length > PAGE ? rows[PAGE - 1].occurred_at : null;
  return { entries, nextBefore };
}
