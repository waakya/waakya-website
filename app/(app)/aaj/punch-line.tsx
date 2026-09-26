"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarDays, LogIn, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getDictionary, type Locale } from "@/lib/i18n";
import { getPhase1 } from "@/lib/i18n/phase1";
import { getUx } from "@/lib/i18n/ux";
import { punchIn, punchOut } from "@/lib/actions/attendance";
import { formatPunchTime } from "@/lib/attendance/time";
import type { AttendanceDay } from "@/lib/attendance/queries";
import { attempt } from "@/lib/actions/attempt";

/**
 * Attendance as one line on Today (V3): where you stand, and the one button
 * for it. History, balances and holidays are a tap away on the full page.
 * Which action is offered comes from the record, never from local state.
 */
export function PunchLine({
  locale,
  today,
  size = "sm",
}: {
  locale: Locale;
  today: AttendanceDay | null;
  /** Staff screens use the staff tap target (56 px); managers the compact one. */
  size?: "sm" | "staff";
}) {
  const t = getDictionary(locale);
  const p = getPhase1(locale);
  const ux = getUx(locale);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const status = today?.status ?? "not_punched";
  const away = status === "leave" || status === "holiday";
  const working = Boolean(today?.punchInAt && !today?.punchOutAt);
  const done = Boolean(today?.punchInAt && today?.punchOutAt);

  const text = away
    ? status === "leave"
      ? t.hazri.onLeaveToday
      : t.hazri.holidayToday
    : done
      ? ux.attendance.punchedOut(formatPunchTime(today!.punchOutAt), today!.worked ?? "0m")
      : working
        ? p.today.punchedIn(formatPunchTime(today!.punchInAt))
        : p.today.notPunchedIn;

  function run(action: () => Promise<{ ok: boolean; message?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await attempt(action, t.common.noConnection);
      if (!result.ok) setError(result.message ?? t.common.somethingWentWrong);
    });
  }

  return (
    <section aria-label={ux.nav.attendance} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-1">
      <CalendarDays className="size-[18px] shrink-0 text-fg-subtle" aria-hidden="true" />
      <Link href="/hazri" className="num min-w-0 flex-1 text-body text-fg-muted hover:text-fg">
        {text}
      </Link>
      {!away && !done ? (
        <Button size={size} variant={working ? "outline" : "secondary"} disabled={pending} onClick={() => run(working ? punchOut : punchIn)}>
          {working ? <LogOut aria-hidden="true" /> : <LogIn aria-hidden="true" />}
          {pending ? t.common.loading : working ? t.hazri.punchOut : t.hazri.punchIn}
        </Button>
      ) : null}
      {error ? (
        <p role="alert" className="w-full text-label text-laal-700">
          {error}
        </p>
      ) : null}
    </section>
  );
}
