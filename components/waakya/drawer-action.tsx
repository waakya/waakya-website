"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

/**
 * A secondary edit behind one action (Visual V2: a record is read first and
 * edited on purpose). The trigger is a verb or a quiet button; the form
 * opens in a drawer on a desk and a sheet on a phone. Forms inside can close
 * it on success with `useCloseDrawer()`.
 */
const CloseContext = React.createContext<(() => void) | null>(null);

export function useCloseDrawer(): (() => void) | null {
  return React.useContext(CloseContext);
}

export function DrawerAction({
  label,
  title,
  children,
  variant = "verb",
  icon,
}: {
  label: React.ReactNode;
  title: React.ReactNode;
  children: React.ReactNode;
  variant?: "verb" | "outline" | "secondary" | "primary";
  icon?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const close = React.useCallback(() => setOpen(false), []);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button size="sm" variant={variant} className="h-tap">
            {icon}
            {label}
          </Button>
        }
      />
      <SheetContent side="drawer" aria-describedby={undefined}>
        <SheetTitle>{title}</SheetTitle>
        <CloseContext.Provider value={close}>
          <div className="mt-4">{children}</div>
        </CloseContext.Provider>
      </SheetContent>
    </Sheet>
  );
}
