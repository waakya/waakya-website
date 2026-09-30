import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * The Ledger (Visual V2): a record's fields as ruled lines — label, value —
 * with no box around each field. Empty fields fold under one line, so a
 * record with thirteen fields and two answers reads as two answers.
 */
export interface LedgerRow {
  key: string;
  label: React.ReactNode;
  value: React.ReactNode;
  empty?: boolean;
}

export function Ledger({ rows, emptyLabel, className }: { rows: LedgerRow[]; emptyLabel?: (n: number) => string; className?: string }) {
  const filled = rows.filter((r) => !r.empty);
  const empty = rows.filter((r) => r.empty);
  const list = (items: LedgerRow[]) => (
    <dl className="grid grid-cols-[minmax(5.5rem,9rem)_minmax(0,1fr)] border-t border-line text-body-sm">
      {items.map((r) => (
        <div key={r.key} className="col-span-2 grid grid-cols-subgrid border-b border-line py-2">
          <dt className="pr-4 text-fg-subtle">{r.label}</dt>
          <dd className={cn("num min-w-0 whitespace-pre-wrap [overflow-wrap:anywhere]", r.empty ? "text-fg-subtle" : "font-medium text-fg")}>{r.value}</dd>
        </div>
      ))}
    </dl>
  );
  return (
    <div className={className}>
      {filled.length ? list(filled) : null}
      {empty.length && emptyLabel ? (
        <details className="group">
          <summary className="num flex min-h-10 cursor-pointer list-none items-center text-label font-semibold text-fg-subtle hover:text-fg">
            {emptyLabel(empty.length)}
            <span aria-hidden="true" className="ml-1.5 transition-transform duration-150 group-open:rotate-90">›</span>
          </summary>
          {list(empty)}
        </details>
      ) : null}
    </div>
  );
}
