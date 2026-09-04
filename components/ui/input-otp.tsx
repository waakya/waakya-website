"use client";

import * as React from "react";
import { OTPField } from "@base-ui/react/otp-field";
import { cn } from "@/lib/utils";

/**
 * Six boxes, 2px Neel border on focus, auto-read from the SMS/email
 * (§5.2, screens/StyleTile.png). Latin digits in every language (D-07).
 */
function InputOTP({
  length = 6,
  className,
  "aria-invalid": invalid,
  ...props
}: Omit<OTPField.Root.Props, "length"> & {
  length?: number;
  "aria-invalid"?: boolean;
}) {
  return (
    <OTPField.Root
      length={length}
      validationType="numeric"
      autoComplete="one-time-code"
      className={cn("flex gap-2", className)}
      data-slot="input-otp"
      data-invalid={invalid || undefined}
      {...props}
    >
      {Array.from({ length }, (_, index) => (
        <OTPField.Input
          key={index}
          inputMode="numeric"
          aria-invalid={invalid || undefined}
          className={cn(
            "num size-tap flex-1 rounded-[10px] border-2 border-paper-200 bg-paper-0",
            "text-center text-[22px] font-bold text-ink-900",
            "outline-none transition-colors",
            "focus:border-neel-600",
            // Laal is allowed here: a wrong code is the reader being told
            // something is wrong, and the message beside it says what.
            "aria-invalid:border-laal-600",
          )}
        />
      ))}
    </OTPField.Root>
  );
}

export { InputOTP };
