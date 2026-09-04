import "server-only";

import { createClient } from "@/lib/supabase/server";
import { dayKey } from "@/lib/tasks/time";
import type { TaskListItem } from "@/lib/tasks/queries";

export interface ChecklistSummary {
  id: string;
  name: string;
  total: number;
  done: number;
  taskIds: string[];
}

export interface ChecklistWithItems {
  id: string;
  name: string;
  assignedTo: string | null;
  runAt: string;
  windowMinutes: number;
  active: boolean;
  items: { id: string; title: string; proofRequired: boolean }[];
}

/**
 * Today's routine, as one card with progress (screens/MyTasks.png).
 *
 * The tasks themselves are ordinary tasks and stay in the ordinary lists; this
 * only groups them so the routine reads as one thing rather than as five
 * unrelated jobs.
 */
export async function getTodayChecklists(
  orgId: string,
  tasks: TaskListItem[],
  now: Date,
): Promise<ChecklistSummary[]> {
  const today = dayKey(now);
  const checklistTasks = tasks.filter(
    (task) => task.checklistItemId !== null && task.checklistDate === today,
  );
  if (checklistTasks.length === 0) return [];

  const supabase = await createClient();
  const { data: items } = await supabase
    .from("checklist_items")
    .select("id, checklist_id, checklists(id, name)")
    .eq("org_id", orgId)
    .in(
      "id",
      checklistTasks.map((task) => task.checklistItemId!),
    );

  const byItem = new Map(
    (items ?? []).map((row) => [
      row.id,
      { id: row.checklist_id, name: row.checklists?.name ?? "" },
    ]),
  );

  const grouped = new Map<string, ChecklistSummary>();
  for (const task of checklistTasks) {
    const checklist = byItem.get(task.checklistItemId!);
    if (!checklist) continue;
    const current = grouped.get(checklist.id) ?? {
      id: checklist.id,
      name: checklist.name,
      total: 0,
      done: 0,
      taskIds: [],
    };
    current.total += 1;
    if (["done", "verified"].includes(task.state)) current.done += 1;
    current.taskIds.push(task.id);
    grouped.set(checklist.id, current);
  }

  return [...grouped.values()];
}

/** Every checklist in the org, for the owner's editor. */
export async function getChecklists(
  orgId: string,
): Promise<ChecklistWithItems[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("checklists")
    .select(
      "id, name, assigned_to, run_at, window_minutes, active, checklist_items(id, title, proof_required, position)",
    )
    .eq("org_id", orgId)
    .order("run_at", { ascending: true });

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    assignedTo: row.assigned_to,
    runAt: row.run_at,
    windowMinutes: row.window_minutes,
    active: row.active,
    items: [...(row.checklist_items ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((item) => ({
        id: item.id,
        title: item.title,
        proofRequired: item.proof_required,
      })),
  }));
}
