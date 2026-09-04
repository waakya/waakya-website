import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Inputs are Paper 0 with a Paper 200 border that becomes a 2px Neel border on
 * focus (§5.2). Owner tap target 48px minimum.
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-tap w-full rounded-button border-2 border-paper-200 bg-paper-0 px-4",
        "text-[17px] font-semibold text-ink-900 placeholder:font-normal placeholder:text-ink-400",
        "outline-none transition-colors",
        "focus:border-neel-600 focus-visible:outline-none",
        "disabled:bg-paper-100 disabled:text-ink-400",
        "aria-invalid:border-laal-600",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
