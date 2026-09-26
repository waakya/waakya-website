import { CheckCircle2, CircleDot, CalendarClock, PauseCircle } from "lucide-react";

import { StateChip } from "@/components/ui/state-chip";
import { type Locale } from "@/lib/i18n";
import { getPhase1 } from "@/lib/i18n/phase1";
import type { ProjectStatus } from "@/lib/projects/queries";

/**
 * A project's status, as an icon and a word. Amber is kept for clocks and
 * Laal for lateness, so "on hold" is a quiet chip rather than a warning; only
 * "completed" takes Hara, the colour of finished work.
 */
const TONE: Record<ProjectStatus, "outline" | "neel" | "muted" | "hara"> = {
  planned: "outline",
  active: "neel",
  on_hold: "muted",
  completed: "hara",
};

const ICON: Record<ProjectStatus, React.ReactNode> = {
  planned: <CalendarClock />,
  active: <CircleDot />,
  on_hold: <PauseCircle />,
  completed: <CheckCircle2 />,
};

export function ProjectStatusChip({ locale, status }: { locale: Locale; status: ProjectStatus }) {
  return (
    <StateChip tone={TONE[status]} icon={ICON[status]} className="shrink-0">
      {getPhase1(locale).projects.statuses[status]}
    </StateChip>
  );
}
