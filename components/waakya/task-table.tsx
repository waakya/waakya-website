import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  Camera,
  Clock,
  Eye,
  EyeOff,
  MoreHorizontal,
  Phone,
  RefreshCw,
  X,
  Zap,
} from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { StateChip } from "@/components/ui/state-chip";
import { Ticks } from "@/components/waakya/ticks";
import { formatDeadline, rowStatus, stateWord, type ChipIcon } from "@/lib/tasks/present";
import type { TaskListItem } from "@/lib/tasks/queries";
import { getDictionary, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const ICONS: Record<ChipIcon, React.ComponentType<{ className?: string }>> = {
  clock: Clock,
  "eye-off": EyeOff,
  eye: Eye,
  zap: Zap,
  alert: AlertTriangle,
  camera: Camera,
  x: X,
  bell: Bell,
  swap: RefreshCw,
};

/**
 * The day's work as a table (screens/DashboardDesktop.png).
 *
 * It is the desktop face of `TaskRow`, not a different thing: both read the
 * same `rowStatus` and `stateWord`, so the glyph-or-chip rule (D-11) and the
 * state-in-words rule (D-03) hold identically at every width. Only the shape
 * changes, because a wide screen can show who and when as columns instead of
 * as a run-on line.
 *
 * Rendered only from `lg` up; below that `TaskRow` does the work.
 */
export function TaskTable({
  tasks,
  locale,
  now,
  phones,
}: {
  tasks: TaskListItem[];
  locale: Locale;
  now: Date;
  phones: Record<string, string | null>;
}) {
  const t = getDictionary(locale);

  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
      {/* Fixed layout: the title takes whatever the other columns leave, so a
          long name or a wide chip can never squeeze it to a word per line. */}
      <table className="w-full table-fixed border-collapse text-left">
        <thead className="bg-surface-muted/60">
          <tr className="border-b border-line">
            <Th>{t.desktop.columnTask}</Th>
            <Th className="w-[19%]">{t.desktop.columnWho}</Th>
            <Th className="w-[16%]">{t.desktop.columnWhen}</Th>
            <Th className="w-[21%]">{t.desktop.columnStatus}</Th>
            <Th className="w-[5.5rem] text-right">{t.desktop.columnAction}</Th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const status = rowStatus(task, { now, locale, viewer: "owner" });
            const late = status.kind === "chip" && status.chip.tone === "laal";
            const phone = task.assigneeId ? phones[task.assigneeId] : null;

            return (
              <tr
                key={task.id}
                className={cn(
                  "border-b border-line/70 align-middle transition-colors duration-150 last:border-0 hover:bg-paper-50",
                  late && "bg-laal-100/40 hover:bg-laal-100/60",
                )}
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/kaam/${task.id}`}
                    title={task.title}
                    className="line-clamp-2 text-body font-semibold text-fg hover:text-neel-700"
                  >
                    {task.title}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className="flex min-w-0 items-center gap-2">
                    <Avatar name={task.assigneeName} size={26} />
                    <span className="truncate text-body-sm text-fg" title={task.assigneeName}>
                      {task.assigneeName}
                    </span>
                  </span>
                </td>
                <td className="num px-4 py-3 text-body-sm text-fg-muted">
                  {task.dueAt ? formatDeadline(task.dueAt, locale, now) : "—"}
                </td>
                <td className="px-4 py-3">
                  {status.kind === "ticks" ? (
                    <span className="flex items-center gap-2">
                      <Ticks state={status.state} locale={locale} size={18} />
                      <span className="truncate text-body-sm text-fg-muted">
                        {stateWord(task.state, locale)}
                      </span>
                    </span>
                  ) : (
                    <StateChip
                      tone={status.chip.tone}
                      icon={iconFor(status.chip.icon)}
                      className="whitespace-nowrap"
                    >
                      {status.chip.label}
                    </StateChip>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center justify-end gap-1">
                    {phone ? (
                      <a
                        href={`tel:${phone}`}
                        aria-label={`${t.actions.call} ${task.assigneeName}`}
                        className="flex size-9 items-center justify-center rounded-inner text-neel-700 transition-colors duration-150 hover:bg-neel-50"
                      >
                        <Phone className="size-4" aria-hidden="true" />
                      </a>
                    ) : null}
                    <Link
                      href={`/kaam/${task.id}`}
                      aria-label={`${t.actions.dekhein} ${task.title}`}
                      className="flex size-9 items-center justify-center rounded-inner text-neel-700 transition-colors duration-150 hover:bg-neel-50"
                    >
                      <MoreHorizontal className="size-4" aria-hidden="true" />
                    </Link>
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Th({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      scope="col"
      className={cn(
        "px-4 py-2.5 text-caption font-semibold text-fg-subtle",
        className,
      )}
    >
      {children}
    </th>
  );
}

function iconFor(name: ChipIcon) {
  const Icon = ICONS[name];
  return <Icon />;
}
