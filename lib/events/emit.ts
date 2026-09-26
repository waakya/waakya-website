import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/types";
import type { ActorKind, DomainEventType } from "./types";

/**
 * Record that something happened. This is the audit trail and the trigger for
 * automation; a server action calls it right after the state change it
 * describes. Recording never throws — a missing history line is logged, not
 * turned into a failed action.
 */
export async function recordEvent(
  client: SupabaseClient<Database>,
  event: {
    orgId: string;
    type: DomainEventType;
    entityType: string;
    entityId: string | null;
    payload?: Record<string, Json | undefined>;
    /** Makes a retried action record once. */
    key?: string | null;
    actorKind?: ActorKind;
    depth?: number;
  },
): Promise<string | null> {
  const payload: Record<string, Json> = {};
  for (const [k, v] of Object.entries(event.payload ?? {})) if (v !== undefined) payload[k] = v;
  const { data, error } = await client.rpc("record_domain_event", {
    p_org: event.orgId,
    p_type: event.type,
    p_entity_type: event.entityType,
    p_entity_id: event.entityId ?? (null as unknown as string),
    p_payload: payload,
    p_key: event.key ?? undefined,
    p_actor_kind: event.actorKind ?? undefined,
    p_depth: event.depth ?? 0,
  });
  if (error) {
    console.error("[events] not recorded", event.type, error.code, error.message);
    return null;
  }
  return data ?? null;
}
