"use client";

import { Toaster as SonnerToaster, toast } from "sonner";

/**
 * Toast with Undo — 5s, one action (§5.2). Themed to paper and ink; the only
 * accent inside a toast is Neel.
 */
function Toaster() {
  return (
    <SonnerToaster
      position="bottom-center"
      duration={5000}
      offset={16}
      toastOptions={{
        classNames: {
          toast:
            "!rounded-card !border !border-paper-200 !bg-paper-0 !text-ink-900 !shadow-float !font-sans",
          description: "!text-ink-500",
          actionButton: "!bg-neel-600 !text-white !rounded-chip !font-semibold",
          cancelButton: "!bg-paper-100 !text-ink-700 !rounded-chip",
        },
      }}
    />
  );
}

export { Toaster, toast };
