import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getMemberNames } from "@/lib/org/members";
import { getPlatform } from "@/lib/i18n/platform";
import type { Locale } from "@/lib/i18n";
import { describeEvent } from "./describe";

/**
 * What moved in the business since yesterday, for Today's "Changed" band.
 *
 * Only events that change where work stands: something was handed in,
 * proved, verified, decided by a customer, arrived as a lead, or was done
 * by a vendor. Setup noise (members joining, modules switched, records
 * edited) belongs to the full history, not to the owner's morning.
 */
export const CHANGE_TYPES = [
  "task.submitted",
  "task.verified",
  "proof.submitted",
  "customer_decision.recorded",
  "customer_message.received",
  "lead.created",
  "integration.lead_received",
  "vendor_work.submitted",
  "vendor_work.verified",
  "project.milestone_done",
  "approval.decided",
  "campaign.recipient_replied",
] as const;

export type ChangeKind = "proof" | "verified" | "customer" | "lead" | "vendor" | "other";

export interface ChangeEntry {
  id: string;
  kind: ChangeKind;
  text: string;
  href: string | null;
  actor: string;
  at: string;
}

const KIND: Record<string, ChangeKind> = {
  "task.submitted": "proof",
  "proof.submitted": "proof",
  "task.verified": "verified",
  "vendor_work.verified": "verified",
  "project.milestone_done": "verified",
  "customer_decision.recorded": "customer",
  "customer_message.received": "customer",
  "campaign.recipient_replied": "customer",
  "lead.created": "lead",
  "integration.lead_received": "lead",
  "vendor_work.submitted": "vendor",
};

export async function recentChanges(
  orgId: string,
  locale: Locale,
  now: Date,
  limit = 6,
): Promise<{ entries: ChangeEntry[]; total: number }> {
  const supabase = await createClient();
  const since = new Date(now.getTime() - 24 * 3600 * 1000).toISOString();
  const { data, count } = await supabase
    .from("domain_events")
    .select("id, event_type, entity_id, actor_kind, actor_id, payload, occurred_at", { count: "exact" })
    .eq("org_id", orgId)
    .in("event_type", CHANGE_TYPES as unknown as string[])
    .gte("occurred_at", since)
    .order("occurred_at", { ascending: false })
    .limit(limit);
  const rows = data ?? [];
  if (rows.length === 0) return { entries: [], total: 0 };
  const names = await getMemberNames(orgId);
  const t = getPlatform(locale).audit;
  const entries = rows.map((row) => {
    const described = describeEvent(locale, row.event_type, (row.payload ?? {}) as Record<string, unknown>, row.entity_id, names);
    const actor =
      row.actor_kind === "user" && row.actor_id ? (names.get(row.actor_id) ?? t.system)
      : row.actor_kind === "customer" ? t.customer
      : row.actor_kind === "automation" ? t.automation
      : row.actor_kind === "integration" ? t.integration
      : t.system;
    return { id: row.id, kind: KIND[row.event_type] ?? "other", text: described.text, href: described.href, actor, at: row.occurred_at };
  });
  return { entries, total: count ?? entries.length };
}
