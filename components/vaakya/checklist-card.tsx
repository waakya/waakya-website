import Link from "next/link";
import { ChevronRight, ListChecks } from "lucide-react";

import { Card } from "@/components/ui/card";
import { getDictionary, type Locale } from "@/lib/i18n";
import type { ChecklistSummary } from "@/lib/checklists/queries";

/**
 * The day's routine as one card with a progress bar (screens/MyTasks.png).
 *
 * The bar is Hara because a finished step is done work, and the fraction is
 * written out beside it — the bar is never the only thing saying how far along
 * this is.
 */
export function ChecklistCard({
  locale,
  checklist,
}: {
  locale: Locale;
  checklist: ChecklistSummary;
}) {
  const t = getDictionary(locale);
  const pct = checklist.total === 0 ? 0 : (checklist.done / checklist.total) * 100;
  const complete = checklist.done === checklist.total;

  return (
    <Card className="relative flex items-center gap-3 p-3.5 shadow-none">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-tile bg-hara-100 text-hara-700">
        <ListChecks className="size-6" aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-[17px] leading-[22px] font-bold text-ink-900">
          <Link
            href={`/checklist/${checklist.id}`}
            className="after:absolute after:inset-0"
          >
            {checklist.name}
          </Link>
        </p>
        <div
          role="progressbar"
          aria-label={checklist.name}
          aria-valuenow={checklist.done}
          aria-valuemin={0}
          aria-valuemax={checklist.total}
          aria-valuetext={t.checklists.progress(checklist.done, checklist.total)}
          className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-paper-200"
        >
          <div
            className="h-full rounded-full bg-hara-600 transition-all"
            style={{ width: `${Math.max(pct, 2)}%` }}
          />
        </div>
      </div>

      <span
        className={
          complete
            ? "num shrink-0 text-[17px] font-bold text-hara-700"
            : "num shrink-0 text-[17px] font-bold text-ink-700"
        }
      >
        {t.checklists.progress(checklist.done, checklist.total)}
      </span>
      <ChevronRight className="size-5 shrink-0 text-ink-400" aria-hidden="true" />
    </Card>
  );
}
