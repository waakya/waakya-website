import { cn } from "@/lib/utils";

/**
 * The Waakya mark, inline (never an image request — §7). Two Neel sound bars
 * and a Haldi tick, drawn on the 64-unit grid from vaakya-brand-kit/logo/mark.svg.
 * Minimum 16px alone, 24px in the app header.
 */
export function Mark({
  size = 24,
  className,
  onNeel = false,
  title = "Waakya",
}: {
  size?: number;
  className?: string;
  /** White bars with the Haldi tick, for the owner's Neel header. */
  onNeel?: boolean;
  title?: string;
}) {
  const bars = onNeel ? "#FFFFFF" : "var(--neel-600)";
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      role="img"
      aria-label={title}
      className={cn("shrink-0", className)}
    >
      <g strokeLinecap="round" strokeLinejoin="round" strokeWidth={9}>
        <path d="M9 26v12" stroke={bars} />
        <path d="M22 16v32" stroke={bars} />
        <path d="M33.5 36l8.5 8.5L55 17" stroke="var(--haldi-400)" />
      </g>
    </svg>
  );
}
