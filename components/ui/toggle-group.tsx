"use client";

import * as React from "react";
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group";
import { Toggle } from "@base-ui/react/toggle";
import { cn } from "@/lib/utils";

/**
 * Single-select pills: the deadline chips, the priority chips and the language
 * switch (§5.2). Neel when selected, outline when not — never Haldi.
 */
function ToggleGroup({ className, ...props }: ToggleGroupPrimitive.Props) {
  return (
    <ToggleGroupPrimitive
      data-slot="toggle-group"
      className={cn("flex flex-wrap items-center gap-2", className)}
      {...props}
    />
  );
}

function ToggleGroupItem({ className, ...props }: Toggle.Props) {
  return (
    <Toggle
      data-slot="toggle-group-item"
      className={cn(
        "inline-flex min-h-tap items-center justify-center gap-1.5 rounded-chip px-4",
        "border border-paper-200 bg-paper-0 text-[15px] font-semibold text-ink-900",
        "transition-colors outline-none",
        "hover:bg-paper-100",
        "data-[pressed]:border-neel-600 data-[pressed]:bg-neel-600 data-[pressed]:text-white",
        "[&_svg]:size-4 [&_svg]:shrink-0",
        className,
      )}
      {...props}
    />
  );
}

export { ToggleGroup, ToggleGroupItem };
