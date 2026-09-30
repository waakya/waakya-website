import { StateWord, type StateTone } from "@/components/waakya/state-word";
import { type Locale } from "@/lib/i18n";
import { getPhase1 } from "@/lib/i18n/phase1";
import type { ProjectStatus } from "@/lib/projects/queries";

/**
 * A project's status as a state word (Visual V2): running is Neel, finished
 * is Hara, paused waits in Amber, planned is a plain fact. A project status
 * is a normal state, so it is never a chip.
 */
const TONE: Record<ProjectStatus, StateTone> = {
  planned: "quiet",
  active: "go",
  on_hold: "wait",
  completed: "done",
};

export function ProjectStatusChip({ locale, status, className }: { locale: Locale; status: ProjectStatus; className?: string }) {
  return (
    <StateWord tone={TONE[status]} className={className}>
      {getPhase1(locale).projects.statuses[status]}
    </StateWord>
  );
}
