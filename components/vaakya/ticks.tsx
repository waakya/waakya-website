import { cn } from "@/lib/utils";
import { getDictionary, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";

/**
 * The Vaakya ticks glyph — two sound bars and a tick, the same three strokes as
 * the logo, reporting a task's real state at the right edge of a row.
 *
 * Character document §2.1 and the spec comment in vaakya-brand-kit/tokens.css:
 * viewBox 0 0 28 20, stroke 3.2, round caps and joins.
 *   bar 1  M3.5 8 v4     bar 2  M9 4 v12     tick  M14.5 11.5 l3.5 3.5 L25 6
 *
 * Rules this component enforces:
 * - It shows the *normal path only*. Exceptions (Late, Dekha nahi, Dikkat,
 *   Urgent, Cancelled) are StateChips that sit where the glyph would, so a row
 *   never shows both (D-11).
 * - Haldi appears here and in the logo, and nowhere else in the product: it is
 *   the tick that means done and waiting for the owner (D-01, §2.2).
 * - The state word is the accessible name, and callers also state the state in
 *   the row's meta text, so nothing depends on colour alone (D-03).
 * - It is never decorative. If it is on screen, it reports a real task.
 */
export type TicksState = "sent" | "seen" | "accepted" | "done" | "verified";

export const TICKS_BAR_COLOUR: Record<TicksState, string> = {
  sent: "var(--ink-400)",
  seen: "var(--neel-600)",
  accepted: "var(--neel-600)",
  done: "var(--neel-600)",
  verified: "var(--hara-600)",
};

/** `null` means this state has no tick yet — only the two bars are drawn. */
export const TICKS_TICK_COLOUR: Record<TicksState, string | null> = {
  sent: null,
  seen: null,
  accepted: "var(--ink-400)",
  done: "var(--haldi-400)",
  verified: "var(--hara-600)",
};

export interface TicksProps {
  state: TicksState;
  /** Which script the accessible name is written in. */
  locale?: Locale;
  /** Rendered height in px; the glyph scales on its 28×20 grid. */
  size?: number;
  /**
   * Draw the tick on rather than showing it whole. The only place this is used
   * is the moment a task becomes Verified (§5.4); reduced-motion disables it.
   */
  animate?: boolean;
  className?: string;
}

export function Ticks({
  state,
  locale = DEFAULT_LOCALE,
  size = 20,
  animate = false,
  className,
}: TicksProps) {
  const word = getDictionary(locale).ticks[state];
  const tick = TICKS_TICK_COLOUR[state];

  return (
    <svg
      role="img"
      aria-label={word}
      viewBox="0 0 28 20"
      height={size}
      width={(size * 28) / 20}
      fill="none"
      strokeWidth={3.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("shrink-0", className)}
      data-state={state}
      data-slot="ticks"
    >
      <path d="M3.5 8v4" stroke={TICKS_BAR_COLOUR[state]} />
      <path d="M9 4v12" stroke={TICKS_BAR_COLOUR[state]} />
      {tick ? (
        <path
          d="M14.5 11.5l3.5 3.5L25 6"
          stroke={tick}
          strokeDasharray={animate ? 24 : undefined}
          className={animate ? "animate-draw-tick" : undefined}
        />
      ) : null}
    </svg>
  );
}
