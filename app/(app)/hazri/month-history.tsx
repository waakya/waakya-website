"use client";

import { getDictionary, type Locale } from "@/lib/i18n";
import { getUx } from "@/lib/i18n/ux";
import { getDesign } from "@/lib/i18n/design";
import { RevealGroup, RevealToggle } from "@/components/waakya/reveal";
import { formatPunchTime, formatWorkDate } from "@/lib/attendance/time";
import type { AttendanceDay } from "@/lib/attendance/queries";

type StatusWord = "present" | "absent" | "onLeave" | "halfDay" | "holiday";

const STATUS_KEY: Record<string, StatusWord> = {
  present: "present",
  absent: "absent",
  leave: "onLeave",
  half_day: "halfDay",
  holiday: "holiday",
};

/**
 * This month, one row a day. Nothing to configure, nothing to filter. The
 * record is looked up, not read daily, so it waits behind one line (V3).
 */
export function MonthHistory({
  locale,
  days,
}: {
  locale: Locale;
  days: AttendanceDay[];
}) {
  const t = getDictionary(locale);
  const ux = getUx(locale);
  const d = getDesign(locale);

  return (
    <RevealGroup as="section" id="month-history" className="group/month" aria-labelledby="month-history-h">
      <div className="flex items-center gap-2">
        <h2 id="month-history-h" className="flex-1 text-label leading-[18px] font-semibold text-ink-700">
          {t.hazri.thisMonth} <span className="num font-normal text-fg-subtle">{days.length}</span>
        </h2>
        {days.length > 0 ? (
          <RevealToggle chevron className="text-label font-semibold text-neel-700" more={d.v3.showAll(days.length)} less={d.v3.showLess} />
        ) : null}
      </div>
      <div id="month-history" className="hidden group-data-[open=true]/month:block">

      {days.length === 0 ? (
        <p className="rounded-card border border-dashed border-paper-300 px-4 py-6 text-center text-body text-ink-500">
          {t.hazri.noHistory}
        </p>
      ) : (
        <ul className="overflow-hidden rounded-card border border-paper-200 bg-paper-0">
          <li aria-hidden="true" className="flex items-center gap-3 border-b border-paper-100 bg-paper-50 px-3.5 py-1.5 text-caption font-semibold text-ink-500">
            <span className="w-[58px] shrink-0">{ux.attendance.colDate}</span>
            <span className="w-[70px] shrink-0">{ux.attendance.colIn}</span>
            <span className="w-[70px] shrink-0">{ux.attendance.colOut}</span>
            <span className="flex-1">{ux.attendance.colWorked}</span>
          </li>
          {days.map((day) => (
            <li
              key={day.id}
              className="flex items-center gap-3 border-b border-paper-100 px-3.5 py-2.5 last:border-b-0"
            >
              <span className="num w-[58px] shrink-0 text-body-sm font-semibold text-ink-900">
                {formatWorkDate(day.workDate)}
              </span>
              <span className="num w-[70px] shrink-0 text-label text-ink-700">
                {formatPunchTime(day.punchInAt)}
              </span>
              <span className="num w-[70px] shrink-0 text-label text-ink-700">
                {formatPunchTime(day.punchOutAt)}
              </span>
              <span className="num flex-1 text-label text-ink-700">
                {day.worked ?? "—"}
              </span>
              <span className="shrink-0 text-caption font-semibold text-ink-500">
                {t.hazri[STATUS_KEY[day.status] ?? "present"]}
              </span>
            </li>
          ))}
        </ul>
      )}
      </div>
    </RevealGroup>
  );
}
