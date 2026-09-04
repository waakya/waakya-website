import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * The chip vocabulary. Design Direction §3.3 and screens/StyleTile.png.
 *
 * Chips carry *exceptions and facts*; the normal path is the ticks glyph. Every
 * chip is an icon plus a word, so nothing depends on colour alone (D-03), and
 * the honest rule holds: amber only after a clock crosses 50% or an SLA is
 * missed, red only for Late/Urgent/Cancel, green only for Done/Verified, and
 * Haldi never — it is the done tick and nothing else (D-01, D-12).
 *
 * The two chips that used Haldi tints (Photo chahiye, Samay maanga) are outline
 * chips since v1.1 (D-12).
 */
const chipVariants = cva(
  [
    "inline-flex items-center gap-1.5 rounded-chip",
    "px-2.5 py-1 text-[13px] font-semibold leading-tight",
    "[&_svg]:size-3.5 [&_svg]:shrink-0",
  ],
  {
    variants: {
      tone: {
        /** Neel tint — a fact that needs the owner (Verify baaki). */
        neel: "bg-neel-100 text-neel-700",
        /** Neel solid — the deadline chip. */
        neelSolid: "bg-neel-600 text-white",
        /** Amber — a clock past 50%, or an SLA missed. Never under body text. */
        amber: "bg-amber-100 text-amber-700",
        /** Laal tint — Late. */
        laal: "bg-laal-100 text-laal-700",
        /** Laal solid — Urgent. */
        laalSolid: "bg-laal-600 text-white",
        /** Hara — Done and Verified only. */
        hara: "bg-hara-100 text-hara-700",
        /** Outline — a plain fact with no warning in it. */
        outline: "border border-paper-200 bg-paper-0 text-ink-900",
        /** Muted — Cancelled. */
        muted: "bg-paper-100 text-ink-700",
      },
    },
    defaultVariants: { tone: "outline" },
  },
);

export interface StateChipProps
  extends React.ComponentPropsWithoutRef<"span">,
    VariantProps<typeof chipVariants> {
  /** A Lucide icon at 14px. Every chip has one. */
  icon?: React.ReactNode;
}

/**
 * `children` must always be the state in words — a chip is never an icon alone.
 */
export function StateChip({
  className,
  tone,
  icon,
  children,
  ...props
}: StateChipProps) {
  return (
    <span
      data-slot="state-chip"
      className={cn(chipVariants({ tone, className }))}
      {...props}
    >
      {icon}
      <span>{children}</span>
    </span>
  );
}

export { chipVariants };
