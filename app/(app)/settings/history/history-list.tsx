import Link from "next/link";

import { getPlatform } from "@/lib/i18n/platform";
import type { Locale } from "@/lib/i18n";
import type { HistoryEntry } from "@/lib/events/history";
import { formatIndianDate } from "@/lib/tasks/format-date";
import { formatTime } from "@/lib/tasks/time";

export function HistoryList({
  locale,
  entries,
  nextBefore,
  type,
}: {
  locale: Locale;
  entries: HistoryEntry[];
  nextBefore: string | null;
  type: string | null;
}) {
  const t = getPlatform(locale).audit;
  if (entries.length === 0) {
    return <p className="mt-6 rounded-card border border-dashed border-paper-300 p-6 text-center text-[15px] text-ink-500">{t.empty}</p>;
  }
  return (
    <>
      <ol className="mt-5 overflow-hidden rounded-card border border-paper-200 bg-paper-0">
        {entries.map((entry) => (
          <li key={entry.id} className="border-b border-paper-100 px-4 py-3 last:border-b-0">
            <p className="text-[15px] leading-[21px] text-ink-900">
              {entry.href ? (
                <Link href={entry.href} className="font-semibold text-neel-700 underline-offset-2 hover:underline">
                  {entry.text}
                </Link>
              ) : (
                entry.text
              )}
            </p>
            <p className="num mt-0.5 text-[13px] text-ink-500">
              {entry.actor} · {formatIndianDate(entry.at, locale)} {formatTime(entry.at)}
            </p>
          </li>
        ))}
      </ol>
      {nextBefore ? (
        <Link
          href={`/settings/history?before=${encodeURIComponent(nextBefore)}${type ? `&type=${encodeURIComponent(type)}` : ""}`}
          className="mt-4 flex min-h-tap items-center justify-center rounded-button border border-paper-300 bg-paper-0 px-4 text-[15px] font-semibold text-ink-900"
        >
          {t.loadMore}
        </Link>
      ) : null}
    </>
  );
}
