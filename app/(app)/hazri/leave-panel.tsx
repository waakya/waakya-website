"use client";

import * as React from "react";
import { CalendarPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StateChip } from "@/components/ui/state-chip";
import { getDictionary, type Locale } from "@/lib/i18n";
import { applyLeave } from "@/lib/actions/attendance";
import { formatDays, leaveDaysFor, type LeaveKind } from "@/lib/attendance/leave";
import { formatWorkDate, workDate } from "@/lib/attendance/time";
import type { HolidayRow, LeaveRequestRow } from "@/lib/attendance/queries";
import { attempt } from "@/lib/actions/attempt";

/**
 * Leave, from the employee's side.
 *
 * The cost of the request is shown before it is sent, using the same rules the
 * database will apply, so nobody is surprised by what gets deducted. Nothing
 * is deducted until somebody approves it.
 */
export function LeavePanel({
  locale,
  balance,
  requests,
  holidays,
}: {
  locale: Locale;
  balance: number;
  requests: LeaveRequestRow[];
  holidays: HolidayRow[];
}) {
  const t = getDictionary(locale);
  const [open, setOpen] = React.useState(false);
  const [kind, setKind] = React.useState<LeaveKind>("full_day");
  const [start, setStart] = React.useState(workDate());
  const [end, setEnd] = React.useState(workDate());
  const [reason, setReason] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const holidayDates = holidays.map((holiday) => holiday.date);
  const cost = leaveDaysFor(kind, start, kind === "half_day" ? start : end, holidayDates);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await attempt(
        () =>
          applyLeave({
            startDate: start,
            endDate: kind === "half_day" ? start : end,
            kind,
            period: kind === "half_day" ? "first_half" : null,
            reason: reason || undefined,
          }),
        t.common.noConnection,
      );
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setOpen(false);
      setReason("");
    });
  }

  return (
    <section id="leave" className="scroll-mt-4">
      <h2 className="mb-2 text-[13px] leading-[18px] font-semibold text-ink-700">
        {t.hazri.leave}
      </h2>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <p className="text-[12px] text-ink-400">{t.hazri.balance}</p>
            <p
              data-testid="leave-balance"
              className="num text-[24px] leading-tight font-bold text-ink-900"
            >
              {formatDays(balance)}
            </p>
          </div>
          <Button
            variant="outline"
            className="ml-auto"
            onClick={() => setOpen((value) => !value)}
          >
            <CalendarPlus aria-hidden="true" />
            {t.hazri.applyLeave}
          </Button>
        </div>

        {open ? (
          <form onSubmit={submit} noValidate className="mt-4 border-t border-paper-100 pt-4">
            <div className="flex gap-2">
              {(["full_day", "half_day"] as const).map((option) => (
                <Button
                  key={option}
                  type="button"
                  size="sm"
                  variant={kind === option ? "primary" : "outline"}
                  onClick={() => setKind(option)}
                >
                  {option === "full_day" ? t.hazri.fullDay : t.hazri.halfDay}
                </Button>
              ))}
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="leave-start">{t.hazri.from}</Label>
                <Input
                  id="leave-start"
                  type="date"
                  value={start}
                  onChange={(event) => setStart(event.target.value)}
                  className="mt-1"
                />
              </div>
              {kind === "full_day" ? (
                <div>
                  <Label htmlFor="leave-end">{t.hazri.to}</Label>
                  <Input
                    id="leave-end"
                    type="date"
                    value={end}
                    min={start}
                    onChange={(event) => setEnd(event.target.value)}
                    className="mt-1"
                  />
                </div>
              ) : null}
            </div>

            <div className="mt-3">
              <Label htmlFor="leave-reason">{t.hazri.reason}</Label>
              <Input
                id="leave-reason"
                value={reason}
                maxLength={200}
                onChange={(event) => setReason(event.target.value)}
                className="mt-1"
              />
            </div>

            <p className="num mt-3 text-[13px] text-ink-500">
              {t.hazri.thisCosts(formatDays(cost))}
            </p>

            {error ? (
              <p
                role="alert"
                className="mt-2 rounded-card bg-laal-100 px-3 py-2 text-[15px] leading-[20px] text-laal-700"
              >
                {error}
              </p>
            ) : null}

            <Button type="submit" size="block" className="mt-3" disabled={pending}>
              {pending ? t.common.loading : t.hazri.sendRequest}
            </Button>
          </form>
        ) : null}

        {requests.length > 0 ? (
          <ul className="mt-4 flex flex-col gap-1.5 border-t border-paper-100 pt-3">
            {requests.slice(0, 5).map((request) => (
              <li key={request.id} className="flex items-center gap-2.5">
                <span className="num text-[13px] text-ink-700">
                  {formatWorkDate(request.startDate)}
                  {request.endDate !== request.startDate
                    ? ` – ${formatWorkDate(request.endDate)}`
                    : ""}
                </span>
                <span className="num text-[12px] text-ink-400">
                  {formatDays(request.days)}
                </span>
                <span className="ml-auto">
                  {request.status === "approved" ? (
                    <StateChip tone="hara">{t.hazri.approved}</StateChip>
                  ) : request.status === "rejected" ? (
                    <StateChip tone="laal">{t.hazri.rejected}</StateChip>
                  ) : (
                    <StateChip tone="outline">{t.hazri.pending}</StateChip>
                  )}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {holidays.length > 0 ? (
          <div className="mt-4 border-t border-paper-100 pt-3">
            <p className="mb-1.5 text-[12px] font-semibold text-ink-500">
              {t.hazri.holidays}
            </p>
            <ul className="flex flex-col gap-1">
              {holidays.map((holiday) => (
                <li key={holiday.id} className="flex items-center gap-3">
                  <span className="num w-[58px] shrink-0 text-[13px] font-semibold text-ink-900">
                    {formatWorkDate(holiday.date)}
                  </span>
                  <span className="truncate text-[13px] text-ink-700">{holiday.title}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Card>
    </section>
  );
}
