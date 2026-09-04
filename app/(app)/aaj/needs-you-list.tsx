import { NeedsYouCard } from "./needs-you-card";
import { getDictionary, type Locale } from "@/lib/i18n";
import { needsYouMeta } from "@/lib/tasks/present";
import { formatDuration } from "@/lib/tasks/sla";
import type { NeedsYou, NeedsYouReason } from "@/lib/tasks/counters";
import type { TaskListItem } from "@/lib/tasks/queries";
import { cn } from "@/lib/utils";

/**
 * "Aapke liye", in one place so the phone and the desktop dashboard cannot
 * drift apart in what they say or how many they show. A wide screen simply
 * fits two across.
 */
export function NeedsYouList({
  locale,
  attention,
  phones,
  nowIso,
  columns = false,
  limit = 5,
}: {
  locale: Locale;
  attention: NeedsYou[];
  phones: Record<string, string | null>;
  nowIso: string;
  /** Two across, where there is room. */
  columns?: boolean;
  limit?: number;
}) {
  const t = getDictionary(locale);
  const now = new Date(nowIso);

  return (
    <ul
      aria-label={t.lists.aapkeLiye}
      className={cn(
        "flex flex-col gap-2.5",
        columns && "lg:grid lg:grid-cols-2 lg:gap-4",
      )}
    >
      {attention.slice(0, limit).map(({ task, reason }) => (
        <li key={task.id}>
          <NeedsYouCard
            locale={locale}
            taskId={task.id}
            reason={reason}
            headline={headline(t, reason, task)}
            meta={needsYouMeta(locale, task.deliveredAt, extraMeta(t, reason, task, now))}
            phone={task.assigneeId ? (phones[task.assigneeId] ?? null) : null}
          />
        </li>
      ))}
    </ul>
  );
}

function headline(
  t: ReturnType<typeof getDictionary>,
  reason: NeedsYouReason,
  task: TaskListItem,
): string {
  const who = task.assigneeName;
  switch (reason) {
    case "late":
      return t.lists.lateCard(who, task.title);
    case "unseen":
      return t.lists.unseenCard(who, task.title);
    case "escalated":
      return t.lists.escalatedCard(who, task.title);
    case "verify":
      return t.lists.doneCard(who, task.title);
  }
}

function extraMeta(
  t: ReturnType<typeof getDictionary>,
  reason: NeedsYouReason,
  task: TaskListItem,
  now: Date,
): string[] {
  const out: string[] = [];
  if (reason === "late" && task.dueAt) {
    out.push(
      t.chips.lateBy(formatDuration(now.getTime() - Date.parse(task.dueAt), t.time)),
    );
  }
  if (reason === "verify") out.push(t.chips.verifyBaaki);
  if (task.priority === "urgent") out.push(t.chips.urgent);
  return out;
}
