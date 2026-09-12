import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import { getOrgMembers } from "@/lib/org/members";
import { monthRange, workDate, workedDuration } from "./time";
import type { LeaveKind, LeaveStatus } from "./leave";

/**
 * Reads for attendance, leave and holidays.
 *
 * Row level security already limits a team member to their own rows, so these
 * functions do not re-filter by user: an owner asking for the team gets the
 * team, and a member asking the same question gets themselves. The filter that
 * matters — the organisation — is always passed explicitly by a caller that
 * has been through `requireOrg()`.
 */

export type AttendanceStatus = "present" | "absent" | "leave" | "half_day" | "holiday";

export interface AttendanceDay {
  id: string;
  workDate: string;
  punchInAt: string | null;
  punchOutAt: string | null;
  status: AttendanceStatus;
  worked: string | null;
}

export interface LeaveRequestRow {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  kind: LeaveKind;
  halfDayPeriod: "first_half" | "second_half" | null;
  days: number;
  reason: string | null;
  status: LeaveStatus;
  reviewedAt: string | null;
  createdAt: string;
}

export interface HolidayRow {
  id: string;
  date: string;
  title: string;
}

export interface TeamAttendanceRow {
  userId: string;
  name: string;
  role: string;
  status: AttendanceStatus | "not_punched";
  punchInAt: string | null;
  punchOutAt: string | null;
  worked: string | null;
}

function toDay(row: {
  id: string;
  work_date: string;
  punch_in_at: string | null;
  punch_out_at: string | null;
  status: string;
}): AttendanceDay {
  return {
    id: row.id,
    workDate: row.work_date,
    punchInAt: row.punch_in_at,
    punchOutAt: row.punch_out_at,
    status: row.status as AttendanceStatus,
    worked: workedDuration(row.punch_in_at, row.punch_out_at),
  };
}

function toLeave(row: {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  request_type: string;
  half_day_period: string | null;
  days_requested: number | string;
  reason: string | null;
  status: string;
  reviewed_at: string | null;
  created_at: string;
}): LeaveRequestRow {
  return {
    id: row.id,
    userId: row.user_id,
    startDate: row.start_date,
    endDate: row.end_date,
    kind: row.request_type as LeaveKind,
    halfDayPeriod: row.half_day_period as LeaveRequestRow["halfDayPeriod"],
    days: Number(row.days_requested),
    reason: row.reason,
    status: row.status as LeaveStatus,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
  };
}

/** Today's own record, or null before the first punch. */
export const getMyToday = cache(
  async (orgId: string, userId: string): Promise<AttendanceDay | null> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("attendance_records")
      .select("id, work_date, punch_in_at, punch_out_at, status")
      .eq("org_id", orgId)
      .eq("user_id", userId)
      .eq("work_date", workDate())
      .maybeSingle();
    return data ? toDay(data) : null;
  },
);

/** This month's own history, newest first. */
export const getMyMonth = cache(
  async (orgId: string, userId: string): Promise<AttendanceDay[]> => {
    const supabase = await createClient();
    const { start, end } = monthRange();
    const { data } = await supabase
      .from("attendance_records")
      .select("id, work_date, punch_in_at, punch_out_at, status")
      .eq("org_id", orgId)
      .eq("user_id", userId)
      .gte("work_date", start)
      .lte("work_date", end)
      .order("work_date", { ascending: false });
    return (data ?? []).map(toDay);
  },
);

/** Days available. A person with no row has never been credited any. */
export const getMyLeaveBalance = cache(
  async (orgId: string, userId: string): Promise<number> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("leave_balances")
      .select("balance_days")
      .eq("org_id", orgId)
      .eq("user_id", userId)
      .maybeSingle();
    return data ? Number(data.balance_days) : 0;
  },
);

export const getMyLeaveRequests = cache(
  async (orgId: string, userId: string): Promise<LeaveRequestRow[]> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("leave_requests")
      .select(
        "id, user_id, start_date, end_date, request_type, half_day_period, days_requested, reason, status, reviewed_at, created_at",
      )
      .eq("org_id", orgId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    return (data ?? []).map(toLeave);
  },
);

/** Everything waiting on an approver. Members see nothing here, by policy. */
export const getPendingLeave = cache(
  async (orgId: string): Promise<LeaveRequestRow[]> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("leave_requests")
      .select(
        "id, user_id, start_date, end_date, request_type, half_day_period, days_requested, reason, status, reviewed_at, created_at",
      )
      .eq("org_id", orgId)
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    return (data ?? []).map(toLeave);
  },
);

/** Upcoming days the office is shut. */
export const getHolidays = cache(async (orgId: string): Promise<HolidayRow[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("holidays")
    .select("id, holiday_date, title")
    .eq("org_id", orgId)
    .gte("holiday_date", monthRange().start)
    .order("holiday_date", { ascending: true })
    .limit(30);
  return (data ?? []).map((row) => ({
    id: row.id,
    date: row.holiday_date,
    title: row.title,
  }));
});

/**
 * Who is in today.
 *
 * Two queries and a merge rather than a join: `attendance_records.user_id`
 * points at `auth.users`, which PostgREST cannot join to `profiles`, and the
 * team is small enough that the second round trip is cheaper than a view.
 */
export const getTeamToday = cache(
  async (orgId: string): Promise<TeamAttendanceRow[]> => {
    const supabase = await createClient();
    const [members, { data }] = await Promise.all([
      getOrgMembers(orgId),
      supabase
        .from("attendance_records")
        .select("user_id, punch_in_at, punch_out_at, status")
        .eq("org_id", orgId)
        .eq("work_date", workDate()),
    ]);

    const byUser = new Map((data ?? []).map((row) => [row.user_id, row]));

    return members.map((member) => {
      const row = byUser.get(member.userId);
      return {
        userId: member.userId,
        name: member.name,
        role: member.role,
        status: row ? (row.status as AttendanceStatus) : "not_punched",
        punchInAt: row?.punch_in_at ?? null,
        punchOutAt: row?.punch_out_at ?? null,
        worked: workedDuration(row?.punch_in_at ?? null, row?.punch_out_at ?? null),
      };
    });
  },
);

/** Everyone's balance, for the owner's screen. */
export const getTeamBalances = cache(
  async (orgId: string): Promise<{ userId: string; name: string; days: number }[]> => {
    const supabase = await createClient();
    const [members, { data }] = await Promise.all([
      getOrgMembers(orgId),
      supabase.from("leave_balances").select("user_id, balance_days").eq("org_id", orgId),
    ]);
    const byUser = new Map((data ?? []).map((row) => [row.user_id, Number(row.balance_days)]));
    return members.map((member) => ({
      userId: member.userId,
      name: member.name,
      days: byUser.get(member.userId) ?? 0,
    }));
  },
);
