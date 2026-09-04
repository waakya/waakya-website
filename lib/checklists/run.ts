import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { planChecklistTasks, type ChecklistPlanInput } from "./plan";

/**
 * Generate today's checklist tasks, if they are not there already.
 *
 * This rides along with the SLA tick rather than having a scheduler of its
 * own: both want to run every few minutes, both are idempotent, and one job is
 * one thing to keep alive.
 */
export async function generateChecklistTasks(
  client: SupabaseClient<Database>,
  orgId: string,
  createdBy: string,
  now: Date = new Date(),
): Promise<{ created: number; errors: string[] }> {
  const errors: string[] = [];

  const { data: checklists, error } = await client
    .from("checklists")
    .select(
      "id, org_id, name, assigned_to, run_at, window_minutes, active, checklist_items(id, title, proof_required, position)",
    )
    .eq("org_id", orgId)
    .eq("active", true);

  if (error) return { created: 0, errors: [`checklists: ${error.message}`] };
  if (!checklists?.length) return { created: 0, errors };

  const itemIds = checklists.flatMap((c) =>
    (c.checklist_items ?? []).map((i) => i.id),
  );
  if (itemIds.length === 0) return { created: 0, errors };

  // What today already has. Cheaper and clearer than finding out through
  // failed inserts against the unique index.
  const { data: made } = await client
    .from("tasks")
    .select("checklist_item_id, checklist_date")
    .in("checklist_item_id", itemIds)
    .not("checklist_date", "is", null);

  const existing = new Set(
    (made ?? []).map((row) => `${row.checklist_item_id}:${row.checklist_date}`),
  );

  const input: ChecklistPlanInput[] = checklists.map((c) => ({
    id: c.id,
    orgId: c.org_id,
    name: c.name,
    assignedTo: c.assigned_to,
    runAt: c.run_at,
    windowMinutes: c.window_minutes,
    active: c.active,
    items: [...(c.checklist_items ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((i) => ({
        id: i.id,
        title: i.title,
        proofRequired: i.proof_required,
      })),
  }));

  const planned = planChecklistTasks(input, existing, now);
  if (planned.length === 0) return { created: 0, errors };

  const { data: inserted, error: insertError } = await client
    .from("tasks")
    .insert(
      planned.map((task) => ({
        org_id: task.orgId,
        title: task.title,
        created_by: createdBy,
        assigned_to: task.assignedTo,
        // A routine arrives already delivered, like any other task.
        state: "delivered" as const,
        proof_required: task.proofRequired,
        due_at: task.dueAt,
        delivered_at: now.toISOString(),
        checklist_item_id: task.checklistItemId,
        checklist_date: task.checklistDate,
      })),
    )
    .select("id, org_id");

  // 23505 means another tick got there first, which is the point of the index.
  if (insertError && insertError.code !== "23505") {
    errors.push(`checklist tasks: ${insertError.code}`);
  }

  for (const row of inserted ?? []) {
    await client.from("task_events").insert([
      {
        task_id: row.id,
        org_id: row.org_id,
        from_state: null,
        to_state: "created" as const,
        actor_id: createdBy,
        note: "checklist",
      },
      {
        task_id: row.id,
        org_id: row.org_id,
        from_state: "created" as const,
        to_state: "delivered" as const,
        actor_id: createdBy,
        note: "checklist",
      },
    ]);
  }

  return { created: inserted?.length ?? 0, errors };
}
