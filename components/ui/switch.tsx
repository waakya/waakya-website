"use client";

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import { cn } from "@/lib/utils";

/** Hara 600 when on (§5.2) — green means done, here it means "proof required". */
function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "inline-flex h-8 w-14 shrink-0 items-center rounded-chip p-1",
        "bg-paper-300 transition-colors data-[checked]:bg-hara-600",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "size-6 rounded-full bg-paper-0 shadow-card transition-transform",
          "data-[checked]:translate-x-6",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
