"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { requireOrg, canManage } from "@/lib/auth/session";
import { fail, ok, uuidSchema, type ActionResult } from "@/lib/validation";
import { validateRange, type LeaveKind } from "@/lib/attendance/leave";

/**
 * Attendance, leave and holidays.
 *
 * Every one of these calls a database function that establishes the
 * organisation from the caller's own membership. The org id passed from here
 * is checked there, not trusted, so a forged id fails inside the database
 * rather than relying on this layer to be careful.
 *
 * Errors come back as sentences a person can act on. The Postgres message is
 * never shown; it is matched and replaced.
 */

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date");

const leaveSchema = z.object({
  startDate: dateSchema,
  endDate: dateSchema,
  kind: z.enum(["full_day", "half_day"]),
  period: z.enum(["first_half", "second_half"]).nullable().optional(),
  reason: z.string().trim().max(400).optional(),
});

const decideSchema = z.object({
  requestId: uuidSchema,
  approve: z.boolean(),
  note: z.string().trim().max(400).optional(),
});

const creditSchema = z.object({
  userId: uuidSchema,
  // Leave moves in half days, and never by more than a year at a time.
  days: z.number().min(-365).max(365).refine((n) => n * 2 === Math.floor(n * 2), "half days"),
});

const holidaySchema = z.object({
  date: dateSchema,
  title: z.string().trim().min(2).max(80),
});

/** Turn a database complaint into something worth reading. */
function explain(message: string | undefined): string {
  const text = (message ?? "").toLowerCase();
  if (text.includes("already punched in")) return "You are already punched in.";
  if (text.includes("already punched out")) return "You have already punched out today.";
  if (text.includes("not punched in")) return "Punch in first.";
  if (text.includes("on leave today")) return "You are on leave today.";
  if (text.includes("not enough leave")) return "There is not enough leave balance for this request.";
  if (text.includes("decide your own leave")) return "Somebody else has to decide your leave.";
  if (text.includes("owner or admin")) return "Only an owner or admin can do that.";
  if (text.includes("not a member")) return "You are not a member of this business.";
  if (text.includes("end date is before")) return "The last day is before the first day.";
  if (text.includes("half day covers one date")) return "A half day covers one date.";
  if (text.includes("all holidays")) return "Those dates are already holidays.";
  if (text.includes("half days")) return "Leave moves in half days.";
  if (text.includes("not in this business")) return "That person is not in this business.";
  return "That did not go through. Please try again.";
}

function refreshAttendance() {
  revalidatePath("/hazri");
  revalidatePath("/aaj");
}

export async function punchIn(): Promise<ActionResult> {
  const viewer = await requireOrg();
  const supabase = await createClient();
  const { error } = await supabase.rpc("punch_in", { p_org: viewer.org.id });
  if (error) return fail(explain(error.message));
  refreshAttendance();
  return ok();
}

export async function punchOut(): Promise<ActionResult> {
  const viewer = await requireOrg();
  const supabase = await createClient();
  const { error } = await supabase.rpc("punch_out", { p_org: viewer.org.id });
  if (error) return fail(explain(error.message));
  refreshAttendance();
  return ok();
}

export async function applyLeave(input: unknown): Promise<ActionResult> {
  const parsed = leaveSchema.safeParse(input);
  if (!parsed.success) return fail("Check the dates for this leave.");

  const { startDate, endDate, kind, period, reason } = parsed.data;
  const range = validateRange(kind as LeaveKind, startDate, endDate);
  if (!range.ok) return fail(range.reason);

  const viewer = await requireOrg();
  const supabase = await createClient();
  const { error } = await supabase.rpc("apply_leave", {
    p_org: viewer.org.id,
    p_start: startDate,
    p_end: endDate,
    p_kind: kind,
    p_period: kind === "half_day" ? (period ?? "first_half") : undefined,
    p_reason: reason ?? undefined,
  });
  if (error) return fail(explain(error.message));
  refreshAttendance();
  return ok();
}

/** Approve or reject. Safe to press twice: the database refuses the second. */
export async function decideLeave(input: unknown): Promise<ActionResult> {
  const parsed = decideSchema.safeParse(input);
  if (!parsed.success) return fail("That request could not be read.");

  const viewer = await requireOrg();
  if (!canManage(viewer.role)) return fail("Only an owner or admin can do that.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("decide_leave_request", {
    p_request: parsed.data.requestId,
    p_approve: parsed.data.approve,
    p_note: parsed.data.note ?? undefined,
  });
  if (error) return fail(explain(error.message));
  refreshAttendance();
  return ok();
}

export async function creditLeave(input: unknown): Promise<ActionResult> {
  const parsed = creditSchema.safeParse(input);
  if (!parsed.success) return fail("Leave is credited in half days.");

  const viewer = await requireOrg();
  if (!canManage(viewer.role)) return fail("Only an owner or admin can do that.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("credit_leave", {
    p_org: viewer.org.id,
    p_user: parsed.data.userId,
    p_days: parsed.data.days,
  });
  if (error) return fail(explain(error.message));
  refreshAttendance();
  return ok();
}

export async function addHoliday(input: unknown): Promise<ActionResult> {
  const parsed = holidaySchema.safeParse(input);
  if (!parsed.success) return fail("A holiday needs a date and a name.");

  const viewer = await requireOrg();
  if (!canManage(viewer.role)) return fail("Only an owner or admin can do that.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("add_holiday", {
    p_org: viewer.org.id,
    p_date: parsed.data.date,
    p_title: parsed.data.title,
  });
  if (error) return fail(explain(error.message));
  refreshAttendance();
  return ok();
}
