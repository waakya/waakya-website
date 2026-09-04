"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** One checkbox style: a Neel 600 square with a white tick when checked. */
function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-[6px]",
        "border-2 border-paper-300 bg-paper-0 transition-colors",
        "data-[checked]:border-neel-600 data-[checked]:bg-neel-600",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex text-white">
        <Check className="size-4" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
