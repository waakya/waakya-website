import { cn } from "@/lib/utils";

/**
 * A normal state said as a word with a small mark (Visual V2 status
 * grammar) — the same diamond-and-word the homepage uses. For ordinary,
 * expected states: running, available, sent, booked, on time.
 *
 * Containment (StateChip) stays for exceptions — Late, Not seen, No owner,
 * Overdue, Cancelled — so a chip on screen always means "look at this".
 * Task states use the ticks glyph instead of either.
 *
 *   go      moving as planned (Neel)
 *   done    finished, verified, sold (Hara)
 *   wait    waiting on someone, held, paused (Amber — time or a hold)
 *   quiet   a plain fact, not a state to watch (ink)
 */
export type StateTone = "go" | "done" | "wait" | "quiet";

const TONE: Record<StateTone, string> = {
  go: "text-neel-700",
  done: "text-hara-700",
  wait: "text-amber-700",
  quiet: "text-fg-muted",
};

export function StateWord({ tone = "go", children, className }: { tone?: StateTone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-label font-semibold whitespace-nowrap", TONE[tone], className)}>
      {tone === "quiet" ? null : <span aria-hidden="true" className="size-[7px] shrink-0 rotate-45 rounded-[1.5px] bg-current" />}
      {children}
    </span>
  );
}

/**
 * Configurable statuses (records, campaigns) carry a chip tone chosen by the
 * business. Normal tones become a state word; Laal stays a chip, because a
 * red status is an exception by definition.
 */
export function wordTone(chip: string | null | undefined): StateTone | "exception" {
  switch (chip) {
    case "hara":
      return "done";
    case "amber":
      return "wait";
    case "laal":
    case "laalSolid":
      return "exception";
    case "neel":
    case "neelSolid":
      return "go";
    default:
      return "quiet";
  }
}
