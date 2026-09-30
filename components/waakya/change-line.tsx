import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * The Line (Visual V2): how responsibility and consequence travel through
 * Waakya. One thin rule with a mark per step — something was said, owned,
 * handed in, proved, verified, decided. Used only where the order of events
 * means something: Today's "Changed", a project's or a record's history, a
 * task's life, a customer's page.
 *
 * Marks carry meaning, never decoration:
 *   moved     — work changed hands or state (Neel, filled)
 *   proof     — evidence arrived (Neel ring)
 *   verified  — someone checked it (Hara, filled)
 *   customer  — the customer acted (Neel, filled, square-ish)
 *   waiting   — nothing yet (hollow)
 */
export type LineMark = "moved" | "proof" | "verified" | "customer" | "waiting";

export interface LineItem {
  id: string;
  mark: LineMark;
  text: React.ReactNode;
  meta?: React.ReactNode;
  href?: string | null;
}

const MARK: Record<LineMark, string> = {
  moved: "bg-neel-600 border-neel-600",
  proof: "bg-paper-0 border-neel-600",
  verified: "bg-hara-600 border-hara-600",
  customer: "bg-neel-600 border-neel-600 rounded-[3px]",
  waiting: "bg-paper-0 border-paper-300",
};

export function ChangeLine({ items, label, className }: { items: LineItem[]; label: string; className?: string }) {
  if (items.length === 0) return null;
  return (
    <ol aria-label={label} className={cn("relative", className)}>
      {/* the rule runs from the first mark to the last, never past them */}
      <span aria-hidden="true" className="absolute top-3 bottom-3 left-[6px] w-[2px] rounded-full bg-paper-200" />
      {items.map((item) => (
        <li key={item.id} className="relative py-2 pl-7">
          <span aria-hidden="true" className={cn("absolute top-[13px] left-[2px] size-[10px] rounded-full border-2", MARK[item.mark])} />
          {item.href ? (
            <Link href={item.href} className="block text-body-sm leading-snug text-fg hover:text-neel-700 hover:underline">
              {item.text}
            </Link>
          ) : (
            <p className="text-body-sm leading-snug text-fg">{item.text}</p>
          )}
          {item.meta ? <p className="num mt-0.5 text-caption text-fg-subtle">{item.meta}</p> : null}
        </li>
      ))}
    </ol>
  );
}
