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
import { rowStatus, stateWord, type ChipIcon } from "@/lib/tasks/present";
import type { TaskListItem } from "@/lib/tasks/queries";
import { getDictionary, type Locale } from "@/lib/i18n";
import { formatTime } from "@/lib/tasks/time";
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
    <div className="overflow-hidden rounded-card border border-paper-200 bg-paper-0">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-paper-200">
            <Th>{t.desktop.columnTask}</Th>
            <Th className="w-40">{t.desktop.columnWho}</Th>
            <Th className="w-32">{t.desktop.columnWhen}</Th>
            <Th className="w-56">{t.desktop.columnStatus}</Th>
            <Th className="w-28 text-right">{t.desktop.columnAction}</Th>
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
                  "border-b border-paper-100 last:border-0",
                  late && "bg-laal-100/40",
                )}
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/kaam/${task.id}`}
                    className="text-[15px] font-bold text-ink-900 hover:underline"
                  >
                    {task.title}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-2">
                    <Avatar name={task.assigneeName} size={28} />
                    <span className="text-[15px] text-ink-900">
                      {task.assigneeName}
                    </span>
                  </span>
                </td>
                <td className="num px-4 py-3 text-[15px] text-ink-700">
                  {task.dueAt ? formatTime(task.dueAt) : "—"}
                </td>
                <td className="px-4 py-3">
                  {status.kind === "ticks" ? (
                    <span className="flex items-center gap-2">
                      <Ticks state={status.state} locale={locale} size={18} />
                      <span className="text-[15px] text-ink-700">
                        {stateWord(task.state, locale)}
                      </span>
                    </span>
                  ) : (
                    <StateChip
                      tone={status.chip.tone}
                      icon={iconFor(status.chip.icon)}
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
                        className="flex size-9 items-center justify-center rounded-tile border border-paper-200 text-neel-700 hover:bg-neel-50"
                      >
                        <Phone className="size-4" aria-hidden="true" />
                      </a>
                    ) : null}
                    <Link
                      href={`/kaam/${task.id}`}
                      aria-label={`${t.actions.dekhein} ${task.title}`}
                      className="flex size-9 items-center justify-center rounded-tile border border-paper-200 text-neel-700 hover:bg-neel-50"
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
        "px-4 py-3 text-[11px] font-semibold tracking-wider text-ink-400 uppercase",
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
