"use client";

import * as React from "react";
import { Check, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StateChip } from "@/components/ui/state-chip";
import { Avatar } from "@/components/ui/avatar";
import { getDictionary, type Locale } from "@/lib/i18n";
import { getUx } from "@/lib/i18n/ux";
import { addHoliday, creditLeave, decideLeave } from "@/lib/actions/attendance";
import { formatDays } from "@/lib/attendance/leave";
import { formatPunchTime, formatWorkDate, workDate } from "@/lib/attendance/time";
import type {
  HolidayRow,
  LeaveRequestRow,
  TeamAttendanceRow,
} from "@/lib/attendance/queries";

/**
 * The manager's half of the screen: who is in, what is waiting on a decision,
 * what everybody has left, and when the office is shut.
 *
 * Approving is deliberately boring — one press, and the row states the outcome
 * rather than disappearing, so it is obvious what just happened.
 */
export function TeamPanel({
  locale,
  team,
  pending,
  balances,
  holidays,
  names,
}: {
  locale: Locale;
  team: TeamAttendanceRow[];
  pending: LeaveRequestRow[];
  balances: { userId: string; name: string; days: number }[];
  holidays: HolidayRow[];
  names: Record<string, string>;
}) {
  const t = getDictionary(locale);
  const ux = getUx(locale);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, startTransition] = React.useTransition();

  const [holidayDate, setHolidayDate] = React.useState(workDate());
  const [holidayTitle, setHolidayTitle] = React.useState("");

  function run(action: () => Promise<{ ok: boolean; message?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.message ?? t.common.somethingWentWrong);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {error ? (
        <p
          role="alert"
          data-testid="team-error"
          className="rounded-card bg-laal-100 px-3 py-2 text-[15px] leading-[20px] text-laal-700"
        >
          {error}
        </p>
      ) : null}

      {/* waiting on a decision */}
      <section id="leave-requests" className="scroll-mt-4">
        <h2 className="mb-2 text-[13px] leading-[18px] font-semibold text-ink-700">
          {t.hazri.pendingLeave}
        </h2>
        {pending.length === 0 ? (
          <p className="rounded-card border border-dashed border-paper-300 px-4 py-5 text-center text-[15px] text-ink-500">
            {t.hazri.nothingWaiting}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {pending.map((request) => (
              <li key={request.id}>
                <Card className="flex flex-wrap items-center gap-3 p-3.5">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold text-ink-900">
                      {names[request.userId] ?? t.desktop.noOne}
                    </span>
                    <span className="num block truncate text-[12px] text-ink-400">
                      {formatWorkDate(request.startDate)}
                      {request.endDate !== request.startDate
                        ? ` – ${formatWorkDate(request.endDate)}`
                        : ""}{" "}
                      · {formatDays(request.days)}
                      {request.reason ? ` · ${request.reason}` : ""}
                    </span>
                  </span>
                  <span className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={busy}
                      onClick={() =>
                        run(() => decideLeave({ requestId: request.id, approve: true }))
                      }
                    >
                      <Check aria-hidden="true" />
                      {t.hazri.approve}
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={busy}
                      onClick={() =>
                        run(() => decideLeave({ requestId: request.id, approve: false }))
                      }
                    >
                      <X aria-hidden="true" />
                      {t.hazri.reject}
                    </Button>
                  </span>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* who is in */}
      <section>
        <h2 className="mb-2 text-[13px] leading-[18px] font-semibold text-ink-700">
          {t.hazri.teamToday}
        </h2>
        <ul className="overflow-hidden rounded-card border border-paper-200 bg-paper-0">
          {team.map((member) => (
            <li
              key={member.userId}
              className="flex items-center gap-3 border-b border-paper-100 px-3.5 py-2.5 last:border-b-0"
            >
              <Avatar name={member.name} size={30} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-semibold text-ink-900">
                  {member.name}
                </span>
                <span className="num block truncate text-[12px] text-ink-400">
                  {member.punchInAt
                    ? `${formatPunchTime(member.punchInAt)}${
                        member.punchOutAt ? ` – ${formatPunchTime(member.punchOutAt)}` : ""
                      }${member.worked ? ` · ${member.worked}` : ""}`
                    : t.hazri.notPunched}
                </span>
              </span>
              {member.status === "leave" ? (
                <StateChip tone="neel">{t.hazri.onLeave}</StateChip>
              ) : member.status === "half_day" ? (
                <StateChip tone="outline">{t.hazri.halfDay}</StateChip>
              ) : member.status === "holiday" ? (
                <StateChip tone="outline">{t.hazri.holiday}</StateChip>
              ) : member.punchOutAt ? (
                <StateChip tone="outline">{t.hazri.completed}</StateChip>
              ) : member.punchInAt ? (
                <StateChip tone="neel">{t.hazri.working}</StateChip>
              ) : (
                <StateChip tone="outline">{t.hazri.notPunched}</StateChip>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* balances */}
      <section>
        <h2 className="mb-2 text-[13px] leading-[18px] font-semibold text-ink-700">
          {t.hazri.balances}
        </h2>
        <ul className="overflow-hidden rounded-card border border-paper-200 bg-paper-0">
          {balances.map((person) => (
            <li
              key={person.userId}
              className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-paper-100 px-3.5 py-2.5 last:border-b-0"
            >
              {/* Name and balance on one line; the buttons wrap below on a
                  phone so a name is never squeezed out. */}
              <span className="flex min-w-[10rem] flex-1 items-baseline gap-3">
                <span className="min-w-0 flex-1 truncate text-[14px] text-ink-900">{person.name}</span>
                <span className="num shrink-0 text-[14px] font-semibold text-ink-900">{formatDays(person.days)}</span>
              </span>
              <span className="flex shrink-0 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => run(() => creditLeave({ userId: person.userId, days: 0.5 }))}
                >
                  <Plus aria-hidden="true" />
                  {ux.attendance.addHalf}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => run(() => creditLeave({ userId: person.userId, days: 1 }))}
                >
                  <Plus aria-hidden="true" />
                  {ux.attendance.addDay}
                </Button>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* holidays */}
      <section id="holidays" className="scroll-mt-4">
        <h2 className="mb-2 text-[13px] leading-[18px] font-semibold text-ink-700">
          {t.hazri.holidays}
        </h2>
        <Card className="p-3.5">
          {holidays.length > 0 ? (
            <ul className="mb-3 flex flex-col gap-1.5">
              {holidays.map((holiday) => (
                <li key={holiday.id} className="flex items-center gap-3">
                  <span className="num w-[58px] shrink-0 text-[13px] font-semibold text-ink-900">
                    {formatWorkDate(holiday.date)}
                  </span>
                  <span className="truncate text-[13px] text-ink-700">{holiday.title}</span>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="flex flex-wrap items-end gap-2">
            <Input
              type="date"
              aria-label={t.hazri.holidayDate}
              value={holidayDate}
              onChange={(event) => setHolidayDate(event.target.value)}
              className="w-[160px]"
            />
            <Input
              aria-label={t.hazri.holidayName}
              placeholder={t.hazri.holidayName}
              value={holidayTitle}
              maxLength={60}
              onChange={(event) => setHolidayTitle(event.target.value)}
              className="min-w-[140px] flex-1"
            />
            <Button
              disabled={busy || holidayTitle.trim().length < 2}
              onClick={() =>
                run(async () => {
                  const result = await addHoliday({
                    date: holidayDate,
                    title: holidayTitle.trim(),
                  });
                  if (result.ok) setHolidayTitle("");
                  return result;
                })
              }
            >
              {t.hazri.addHoliday}
            </Button>
          </div>
        </Card>
      </section>
    </div>
  );
}
