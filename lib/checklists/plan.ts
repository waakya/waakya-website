import { atIstTime, dayKey } from "@/lib/tasks/time";

/**
 * Which checklist tasks today still needs.
 *
 * Pure, and deliberately dull: the interesting property is that running it a
 * hundred times a day produces the same handful of tasks once. The generator
 * asks for what is missing; the unique index on (checklist_item_id,
 * checklist_date) is the backstop if two ticks race.
 */
export interface ChecklistPlanInput {
  id: string;
  orgId: string;
  name: string;
  assignedTo: string | null;
  /** "09:00" local to Asia/Kolkata. */
  runAt: string;
  windowMinutes: number;
  active: boolean;
  items: { id: string; title: string; proofRequired: boolean }[];
}

export interface PlannedChecklistTask {
  checklistItemId: string;
  checklistDate: string;
  orgId: string;
  assignedTo: string;
  title: string;
  proofRequired: boolean;
  dueAt: string;
}

export function planChecklistTasks(
  checklists: readonly ChecklistPlanInput[],
  /** `${itemId}:${date}` for instances that already exist. */
  existing: ReadonlySet<string>,
  now: Date,
): PlannedChecklistTask[] {
  const today = dayKey(now);
  const planned: PlannedChecklistTask[] = [];

  for (const checklist of checklists) {
    if (!checklist.active) continue;
    // Nobody to send it to is not an error; it is a checklist still being set up.
    if (!checklist.assignedTo) continue;

    const runAt = parseClock(checklist.runAt);
    if (runAt === null) continue;

    // Nothing appears before its hour: a 9am routine should not be sitting in
    // somebody's list at 6am.
    const startsAt = atIstTime(now, runAt.hours, runAt.minutes);
    if (startsAt.getTime() > now.getTime()) continue;

    const dueAt = new Date(
      startsAt.getTime() + checklist.windowMinutes * 60_000,
    ).toISOString();

    for (const item of checklist.items) {
      const key = `${item.id}:${today}`;
      if (existing.has(key)) continue;
      planned.push({
        checklistItemId: item.id,
        checklistDate: today,
        orgId: checklist.orgId,
        assignedTo: checklist.assignedTo,
        title: item.title,
        proofRequired: item.proofRequired,
        dueAt,
      });
    }
  }

  return planned;
}

function parseClock(value: string): { hours: number; minutes: number } | null {
  const match = /^(\d{1,2}):(\d{2})/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return { hours, minutes };
}
