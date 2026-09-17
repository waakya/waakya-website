"use client";

import * as React from "react";
import { Clock, LogIn, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StateChip } from "@/components/ui/state-chip";
import { getDictionary, type Locale } from "@/lib/i18n";
import { punchIn, punchOut } from "@/lib/actions/attendance";
import { formatPunchTime } from "@/lib/attendance/time";
import type { AttendanceDay } from "@/lib/attendance/queries";
import { attempt } from "@/lib/actions/attempt";

/**
 * The one button that matters in the morning.
 *
 * Which action is offered comes from the record, not from local state, so a
 * refresh or a second device always agrees with the database. The button is
 * simply absent once the day is closed, rather than present and failing.
 */
export function PunchCard({
  locale,
  today,
}: {
  locale: Locale;
  today: AttendanceDay | null;
}) {
  const t = getDictionary(locale);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const status = today?.status ?? "not_punched";
  const onLeave = status === "leave";
  const isHoliday = status === "holiday";
  const working = Boolean(today?.punchInAt && !today?.punchOutAt);
  const done = Boolean(today?.punchInAt && today?.punchOutAt);

  function run(action: () => Promise<{ ok: boolean; message?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await attempt(action, t.common.noConnection);
      if (!result.ok) setError(result.message ?? t.common.somethingWentWrong);
    });
  }

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-ink-400">
          {t.hazri.today}
        </span>
        <span className="ml-auto">
          {onLeave ? (
            <StateChip tone="neel">{t.hazri.onLeave}</StateChip>
          ) : isHoliday ? (
            <StateChip tone="outline">{t.hazri.holiday}</StateChip>
          ) : status === "half_day" ? (
            <StateChip tone="outline">{t.hazri.halfDay}</StateChip>
          ) : done ? (
            <StateChip tone="outline">{t.hazri.completed}</StateChip>
          ) : working ? (
            <StateChip tone="neel">{t.hazri.working}</StateChip>
          ) : (
            <StateChip tone="outline">{t.hazri.notPunched}</StateChip>
          )}
        </span>
      </div>

      {today?.punchInAt ? (
        <dl className="mt-4 grid grid-cols-3 gap-3">
          <div>
            <dt className="text-[12px] text-ink-400">{t.hazri.punchedIn}</dt>
            <dd className="num text-[17px] font-bold text-ink-900">
              {formatPunchTime(today.punchInAt)}
            </dd>
          </div>
          <div>
            <dt className="text-[12px] text-ink-400">{t.hazri.punchedOut}</dt>
            <dd className="num text-[17px] font-bold text-ink-900">
              {today.punchOutAt ? formatPunchTime(today.punchOutAt) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[12px] text-ink-400">{t.hazri.worked}</dt>
            <dd className="num text-[17px] font-bold text-ink-900">
              {today.worked ?? "—"}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="mt-3 flex items-center gap-2 text-[15px] text-ink-500">
          <Clock className="size-4 shrink-0" aria-hidden="true" />
          {onLeave
            ? t.hazri.onLeaveToday
            : isHoliday
              ? t.hazri.holidayToday
              : t.hazri.notPunchedYet}
        </p>
      )}

      {error ? (
        <p
          role="alert"
          className="mt-3 rounded-card bg-laal-100 px-3 py-2 text-[15px] leading-[20px] text-laal-700"
        >
          {error}
        </p>
      ) : null}

      {!onLeave && !isHoliday && !done ? (
        <Button
          size="block"
          className="mt-4"
          disabled={pending}
          onClick={() => run(working ? punchOut : punchIn)}
        >
          {working ? (
            <LogOut aria-hidden="true" />
          ) : (
            <LogIn aria-hidden="true" />
          )}
          {pending
            ? t.common.loading
            : working
              ? t.hazri.punchOut
              : t.hazri.punchIn}
        </Button>
      ) : null}
    </Card>
  );
}
