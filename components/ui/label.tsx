import * as React from "react";
import { cn } from "@/lib/utils";

/** Label style: 13/18, weight 600–700 (§4). No all-caps in any language. */
function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "text-[13px] leading-[18px] font-semibold text-ink-700",
        className,
      )}
      {...props}
    />
  );
}

export { Label };
