import { Clock, EyeOff } from "lucide-react";

import { Mark } from "@/components/waakya/mark";
import { Bell } from "@/components/waakya/bell";
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

  return (
    <header className="bg-neel-700 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-4 text-white">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="text-[24px] leading-[30px] font-bold">
            {ownerName ? t.lists.greeting(ownerName) : orgName}
          </h1>
          <p className="num mt-0.5 text-[15px] leading-[20px] text-white/70">
            {orgName} · {formatIndianDate(now, locale)}
          </p>
        </div>
        <Bell locale={locale} unread={unread} onNeel />
        <span className="flex size-tap items-center justify-center">
          <Mark size={26} onNeel />
        </span>
      </div>

      <div className="mt-3 flex items-end gap-4">
        <dl className="flex flex-1 gap-4">
          <Counter label={t.lists.bheje} value={counters.bheje} />
          <Counter label={t.lists.dekhe} value={counters.dekhe} />
          <Counter label={t.lists.hoGaye} value={counters.hoGaye} />
          <Counter label={t.lists.verifiedCount} value={counters.verified} />
        </dl>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {counters.late > 0 ? (
            <span className="num inline-flex items-center gap-1.5 rounded-chip bg-laal-600 px-2.5 py-1 text-[13px] font-semibold text-white">
              <Clock className="size-3.5" aria-hidden="true" />
              {counters.late} {t.chips.late}
            </span>
          ) : null}
          {counters.dekhaNahi > 0 ? (
            <span className="num inline-flex items-center gap-1.5 rounded-chip bg-amber-100 px-2.5 py-1 text-[13px] font-semibold text-amber-700">
              <EyeOff className="size-3.5" aria-hidden="true" />
              {counters.dekhaNahi} {t.chips.dekhaNahi}
            </span>
          ) : null}
        </div>
      </div>

      {counters.completionRate !== null ? (
        <p className="num mt-3 text-[13px] text-white/70">
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
      <dt className="mt-1 text-[13px] leading-none text-white/70">{label}</dt>
    </div>
  );
}
