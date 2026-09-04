import { isLate } from "./present";
import { dayKey } from "./time";
import type { TaskListItem } from "./queries";

/**
 * How My Tasks is ordered (screens/MyTasks.png): नया, लेट, आज, चेकलिस्ट,
 * हो गया. Work that is neither new, late nor due today still has to go
 * somewhere — a list that quietly drops tasks is worse than a longer list — so
 * it sits under *baad mein* between today and done.
 */
export type SectionKey = "naya" | "late" | "aaj" | "later" | "done";

export const SECTION_ORDER: readonly SectionKey[] = [
  "naya",
  "late",
  "aaj",
  "later",
  "done",
];

export function sectionFor(task: TaskListItem, now: Date): SectionKey {
  if (task.state === "verified" || task.state === "cancelled") return "done";
  if (task.state === "done") return "done";
  if (isLate(task, now)) return "late";
  // Not yet looked at: this is what the pulsing dot is for.
  if (task.state === "delivered") return "naya";
  if (task.dueAt && dayKey(task.dueAt) === dayKey(now)) return "aaj";
  if (!task.dueAt) return "aaj";
  return Date.parse(task.dueAt) < now.getTime() ? "aaj" : "later";
}

export function groupBySection(
  tasks: TaskListItem[],
  now: Date,
): Record<SectionKey, TaskListItem[]> {
  const groups: Record<SectionKey, TaskListItem[]> = {
    naya: [],
    late: [],
    aaj: [],
    later: [],
    done: [],
  };
  for (const task of tasks) groups[sectionFor(task, now)].push(task);
  return groups;
}
