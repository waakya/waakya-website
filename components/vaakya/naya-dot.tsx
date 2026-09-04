import { cn } from "@/lib/utils";

/**
 * The pulsing dot on a new task row — one of only three animations in the
 * product (§5.4), and off under reduced-motion. It is decoration on top of a
 * row that already says *Naya* in words, never the only signal.
 */
export function NayaDot({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("relative inline-flex size-2.5 shrink-0", className)}
    >
      <span className="animate-pulse2 absolute inline-flex size-full rounded-full bg-neel-400" />
      <span className="relative inline-flex size-2.5 rounded-full bg-neel-600" />
    </span>
  );
}
