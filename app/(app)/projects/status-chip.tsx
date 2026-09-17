import { StateChip } from "@/components/ui/state-chip";
import { type Locale } from "@/lib/i18n";
import { getPhase1 } from "@/lib/i18n/phase1";
import type { ProjectStatus } from "@/lib/projects/queries";

const TONE: Record<ProjectStatus, "outline" | "neel" | "amber" | "hara"> = {
  planned: "outline",
  active: "neel",
  on_hold: "amber",
  completed: "hara",
};

export function ProjectStatusChip({ locale, status }: { locale: Locale; status: ProjectStatus }) {
  return <StateChip tone={TONE[status]}>{getPhase1(locale).projects.statuses[status]}</StateChip>;
}
