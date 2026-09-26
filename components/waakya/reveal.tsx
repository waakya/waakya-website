"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Progressive disclosure that reads as what it is: a button that says
 * whether it is expanded and what it controls. The group carries
 * data-open="true|false", so server-rendered children fold with Tailwind
 * (`group-data-[open=true]/name:block`) and nothing below is re-rendered on
 * the client. Replaces the V3 CSS-checkbox folds, which screen readers
 * announced as checkboxes and which any :checked control inside (a select's
 * option) could force open.
 */
const RevealContext = React.createContext<{ open: boolean; toggle: () => void; controls: string } | null>(null);

export function RevealGroup({
  id,
  as: Tag = "div",
  className,
  children,
  "aria-labelledby": labelledBy,
}: {
  /** The id of the region the toggle controls (put it on that element). */
  id: string;
  as?: "div" | "section";
  className?: string;
  children: React.ReactNode;
  "aria-labelledby"?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const value = React.useMemo(() => ({ open, toggle: () => setOpen((o) => !o), controls: id }), [open, id]);
  return (
    <Tag className={className} data-open={open ? "true" : "false"} aria-labelledby={labelledBy}>
      <RevealContext.Provider value={value}>{children}</RevealContext.Provider>
    </Tag>
  );
}

export function RevealToggle({
  more,
  less,
  className,
  chevron = false,
}: {
  more: React.ReactNode;
  less: React.ReactNode;
  className?: string;
  chevron?: boolean;
}) {
  const ctx = React.useContext(RevealContext);
  if (!ctx) throw new Error("RevealToggle must sit inside a RevealGroup");
  return (
    <button
      type="button"
      aria-expanded={ctx.open}
      aria-controls={ctx.controls}
      onClick={ctx.toggle}
      className={cn(
        "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-button text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neel-600",
        className,
      )}
    >
      <span className="flex-1">{ctx.open ? less : more}</span>
      {chevron ? (
        <ChevronDown className={cn("size-4 shrink-0 transition-transform duration-150", ctx.open && "rotate-180")} aria-hidden="true" />
      ) : null}
    </button>
  );
}
