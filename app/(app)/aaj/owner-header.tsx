import { Clock, EyeOff } from "lucide-react";

import { Mark } from "@/components/waakya/mark";
import { Bell } from "@/components/waakya/bell";
import { getDesign } from "@/lib/i18n/design";
import { getDictionary, type Locale } from "@/lib/i18n";
import type { DayCounters } from "@/lib/tasks/counters";
import { formatIndianDate } from "@/lib/tasks/format-date";

/**
 * The owner's header (screens/Dashboard.png, D-09): Neel 700, the greeting,
 * the four counters, and Late and Dekha nahi as chips inside it. Staff screens
 * have no coloured header at all — owners get one glance at the day, staff get
 * a quieter, task-first screen.
 *
 * The counters are Baloo 2, which is the one place display type belongs
 * (§4), with tabular figures so the four numbers line up.
 */
export function OwnerHeader({
  locale,
  orgName,
  ownerName,
  counters,
  unread,
  now,
}: {
  locale: Locale;
  orgName: string;
  ownerName: string | null;
  counters: DayCounters;
  unread: number;
  now: Date;
}) {
  const t = getDictionary(locale);
  const d = getDesign(locale);

  return (
    <header className="bg-neel-700 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-4 text-white">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="text-title leading-[30px] font-bold">
            {ownerName ? t.lists.greeting(ownerName) : orgName}
          </h1>
          <p className="num mt-0.5 text-body leading-[20px] text-white/70">
            {orgName} · {formatIndianDate(now, locale)}
          </p>
        </div>
        <Bell locale={locale} unread={unread} onNeel />
        <span className="flex size-tap items-center justify-center">
          <Mark size={26} onNeel />
        </span>
      </div>

      {/* The numbers are today's: after midnight they restart at zero, so
          the period is said, not left to guess (V3 critique). */}
      <p className="mt-3 text-label font-semibold text-white/70">{d.today.dayStrip}</p>
      {/* Four numbers in a row; the two exceptions wrap under them on a narrow
          phone instead of pushing past its edge. */}
      <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
        <dl className="flex flex-1 gap-4">
          <Counter label={t.lists.bheje} value={counters.bheje} />
          <Counter label={t.lists.dekhe} value={counters.dekhe} />
          <Counter label={t.lists.hoGaye} value={counters.hoGaye} />
          <Counter label={t.lists.verifiedCount} value={counters.verified} />
        </dl>

        <div className="flex flex-wrap gap-1.5 sm:shrink-0 sm:flex-col sm:items-end">
          {counters.late > 0 ? (
            <span className="num inline-flex items-center gap-1.5 rounded-chip bg-laal-600 px-2.5 py-1 text-label font-semibold text-white">
              <Clock className="size-3.5" aria-hidden="true" />
              {counters.late} {t.chips.late}
            </span>
          ) : null}
          {counters.dekhaNahi > 0 ? (
            <span className="num inline-flex items-center gap-1.5 rounded-chip bg-amber-100 px-2.5 py-1 text-label font-semibold text-amber-700">
              <EyeOff className="size-3.5" aria-hidden="true" />
              {counters.dekhaNahi} {t.chips.dekhaNahi}
            </span>
          ) : null}
        </div>
      </div>

      {/* 0% in a header reads as a verdict; show the rate once there is one. */}
      {counters.completionRate !== null && counters.completionRate > 0 ? (
        <p className="num mt-3 text-label text-white/70">
          {t.lists.completionRate}:{" "}
          <span className="font-semibold text-white">
            {counters.completionRate}%
          </span>
        </p>
      ) : null}
    </header>
  );
}

function Counter({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dd className="num font-display text-[32px] leading-none font-extrabold">
        {value}
      </dd>
      <dt className="mt-1 text-label leading-none text-white/70">{label}</dt>
    </div>
  );
}
