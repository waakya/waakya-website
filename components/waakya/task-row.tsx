import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  Camera,
  Clock,
  Eye,
  EyeOff,
  RefreshCw,
  X,
  Zap,
} from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { StateChip } from "@/components/ui/state-chip";
import { Ticks } from "@/components/waakya/ticks";
import { NayaDot } from "@/components/waakya/naya-dot";
import { rowMeta, rowStatus, type ChipIcon } from "@/lib/tasks/present";
import type { TaskListItem } from "@/lib/tasks/queries";
import type { Locale } from "@/lib/i18n";
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
 * One task, on either side of the app.
 *
 * The right edge carries exactly one thing — the ticks glyph, or the exception
 * chip that replaces it (D-11) — and the line under the title always says the
 * state in words, so the colour is never doing the work alone (D-03).
 */
export function TaskRow({
  task,
  locale,
  viewer,
  now,
  /** Show who it is for (owner view) rather than who sent it (staff view). */
  showAssignee = true,
  highlightNew = false,
}: {
  task: TaskListItem;
  locale: Locale;
  viewer: "owner" | "staff";
  now: Date;
  showAssignee?: boolean;
  highlightNew?: boolean;
}) {
  const options = { now, locale, viewer } as const;
  const status = rowStatus(task, options);
  const who = showAssignee ? task.assigneeName : task.createdByName;
  const meta = rowMeta(task, options, who);
  const late = status.kind === "chip" && status.chip.tone === "laal";

  return (
    <Card
      className={cn(
        // `relative` anchors the row-wide tap target on the title link.
        "relative flex min-h-16 items-center gap-3 p-3.5 shadow-none",
        // A late row is tinted, and it also says "Late" in words.
        late && "border-laal-100 bg-laal-100/40",
        highlightNew && "border-neel-200 bg-neel-50",
      )}
    >
      {highlightNew ? (
        <NayaDot />
      ) : showAssignee ? (
        <Avatar name={who} size={40} />
      ) : null}

      <div className="min-w-0 flex-1">
        <Link
          href={`/kaam/${task.id}`}
          className="text-[15px] leading-[20px] font-bold text-ink-900 after:absolute after:inset-0"
        >
          {task.title}
        </Link>
        <p className="num mt-0.5 text-[13px] leading-[18px] text-ink-500">
          {meta}
        </p>
      </div>

      {status.kind === "ticks" ? (
        <Ticks state={status.state} locale={locale} />
      ) : (
        <StateChip
          tone={status.chip.tone}
          icon={iconFor(status.chip.icon)}
          className="shrink-0"
        >
          {status.chip.label}
        </StateChip>
      )}
    </Card>
  );
}

function iconFor(name: ChipIcon) {
  const Icon = ICONS[name];
  return <Icon />;
}
