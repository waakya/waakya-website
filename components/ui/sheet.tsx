"use client";

import * as React from "react";
import { Dialog } from "@base-ui/react/dialog";
import { cn } from "@/lib/utils";

/**
 * The bottom sheet: proof, decline, extension, problem (§5.2). Radius 24, a
 * handle, and one primary action. Sheets carry the only heavy shadow in the
 * product.
 */
const Sheet = Dialog.Root;
const SheetTrigger = Dialog.Trigger;
const SheetClose = Dialog.Close;

function SheetContent({
  className,
  children,
  ...props
}: Dialog.Popup.Props) {
  return (
    <Dialog.Portal>
      <Dialog.Backdrop
        className={cn(
          "fixed inset-0 z-50 bg-ink-900/40",
          "transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0",
        )}
      />
      <Dialog.Popup
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-lg",
          "rounded-t-sheet bg-paper-50 shadow-sheet outline-none",
          "max-h-[92dvh] overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]",
          "transition-transform duration-250 data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full",
          className,
        )}
        {...props}
      >
        <div
          aria-hidden="true"
          className="mx-auto mb-3 h-1 w-10 rounded-full bg-paper-300"
        />
        {children}
      </Dialog.Popup>
    </Dialog.Portal>
  );
}

function SheetTitle({ className, ...props }: Dialog.Title.Props) {
  return (
    <Dialog.Title
      className={cn("text-[22px] leading-[30px] font-bold text-ink-900", className)}
      {...props}
    />
  );
}

function SheetDescription({ className, ...props }: Dialog.Description.Props) {
  return (
    <Dialog.Description
      className={cn("mt-1 text-[15px] leading-[22px] text-ink-500", className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetDescription,
};
