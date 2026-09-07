import { cn } from "@/lib/utils";
import { BRAND_NAME } from "@/lib/i18n";
import { Mark } from "@/components/waakya/mark";

/**
 * The mark plus the name.
 *
 * The name is set in the display face rather than pulled from
 * `logo/logo-horizontal.svg`, so it inherits the surrounding colour and
 * size like text. The mark comes from `Mark`, which is the only place its
 * three strokes are drawn.
 */
export function Wordmark({
  size = 28,
  onNeel = false,
  className,
}: {
  size?: number;
  onNeel?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <Mark size={size} onNeel={onNeel} title="" />
      <span
        translate="no"
        style={{ fontSize: size }}
        className={cn(
          "font-display leading-none font-extrabold",
          onNeel ? "text-white" : "text-neel-800",
        )}
      >
        {BRAND_NAME}
      </span>
    </span>
  );
}
