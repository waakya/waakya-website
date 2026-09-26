import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getMemberNames } from "@/lib/org/members";
import { getTaskProofs, type ProofItem } from "@/lib/tasks/proofs";

export type ExecutionStatus = "assigned" | "in_progress" | "submitted" | "verified" | "rejected";
export type PaymentStatus = "unpaid" | "partial" | "paid";

export interface VendorRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  category: string | null;
  status: "active" | "inactive";
  openWork: number;
}

export interface AssignmentRow {
  id: string;
  vendorId: string;
  vendorName: string;
  projectId: string | null;
  projectName: string | null;
  recordId: string | null;
  recordTitle: string | null;
  taskId: string | null;
  taskAssigneeId: string | null;
  taskAssigneeName: string | null;
  title: string;
  details: string | null;
  amount: number | null;
  paymentStatus: PaymentStatus;
  executionStatus: ExecutionStatus;
  dueDate: string | null;
  submittedAt: string | null;
  submittedNote: string | null;
  verifiedAt: string | null;
  verifiedByName: string | null;
  rejectionNote: string | null;
  customerVisible: boolean;
  createdAt: string;
  createdByName: string | null;
}

export interface AssignmentDetail extends AssignmentRow {
  payments: { id: string; amount: number; paidAt: string; note: string | null; byName: string | null }[];
  paidTotal: number;
  proofs: ProofItem[];
  recordStatusOnSubmit: string | null;
  recordStatusOnVerify: string | null;
}

export const listVendors = cache(async (orgId: string): Promise<VendorRow[]> => {
  const supabase = await createClient();
  const [{ data: vendors }, { data: open }] = await Promise.all([
    supabase.from("vendors").select("id, name, phone_e164, email, category, status").eq("org_id", orgId).is("archived_at", null).order("name"),
    supabase.from("vendor_assignments").select("vendor_id").eq("org_id", orgId).not("execution_status", "in", '("verified","rejected")'),
  ]);
  const counts = new Map<string, number>();
  for (const a of open ?? []) counts.set(a.vendor_id, (counts.get(a.vendor_id) ?? 0) + 1);
  return (vendors ?? []).map((v) => ({
    id: v.id,
    name: v.name,
    phone: v.phone_e164,
    email: v.email,
    category: v.category,
    status: v.status as VendorRow["status"],
    openWork: counts.get(v.id) ?? 0,
  }));
});

const ASSIGNMENT_COLUMNS =
  "id, vendor_id, project_id, record_id, task_id, title, details, amount, payment_status, execution_status, due_date, submitted_at, submitted_note, verified_at, verified_by, rejection_note, customer_visible, created_at, created_by, record_status_on_submit, record_status_on_verify, vendors(name), projects(name), records(title), tasks!vendor_assignments_task_id_fkey(assigned_to)";

type Raw = {
  id: string; vendor_id: string; project_id: string | null; record_id: string | null; task_id: string | null; title: string; details: string | null;
  amount: number | string | null; payment_status: string; execution_status: string; due_date: string | null; submitted_at: string | null; submitted_note: string | null;
  verified_at: string | null; verified_by: string | null; rejection_note: string | null; customer_visible: boolean; created_at: string; created_by: string | null;
  record_status_on_submit: string | null; record_status_on_verify: string | null;
  vendors: { name: string } | null; projects: { name: string } | null; records: { title: string } | null; tasks: { assigned_to: string | null } | null;
};

function toRow(r: Raw, names: Map<string, string>): AssignmentRow {
  const assignee = r.tasks?.assigned_to ?? null;
  return {
    id: r.id,
    vendorId: r.vendor_id,
    vendorName: r.vendors?.name ?? "",
    projectId: r.project_id,
    projectName: r.projects?.name ?? null,
    recordId: r.record_id,
    recordTitle: r.records?.title ?? null,
    taskId: r.task_id,
    taskAssigneeId: assignee,
    taskAssigneeName: assignee ? (names.get(assignee) ?? null) : null,
    title: r.title,
    details: r.details,
    amount: r.amount === null ? null : Number(r.amount),
    paymentStatus: r.payment_status as PaymentStatus,
    executionStatus: r.execution_status as ExecutionStatus,
    dueDate: r.due_date,
    submittedAt: r.submitted_at,
    submittedNote: r.submitted_note,
    verifiedAt: r.verified_at,
    verifiedByName: r.verified_by ? (names.get(r.verified_by) ?? null) : null,
    rejectionNote: r.rejection_note,
    customerVisible: r.customer_visible,
    createdAt: r.created_at,
    createdByName: r.created_by ? (names.get(r.created_by) ?? null) : null,
  };
}

export async function listAssignments(orgId: string, filter: { vendorId?: string; projectId?: string; status?: ExecutionStatus[] } = {}): Promise<AssignmentRow[]> {
  const supabase = await createClient();
  let query = supabase.from("vendor_assignments").select(ASSIGNMENT_COLUMNS).eq("org_id", orgId).order("created_at", { ascending: false }).limit(200);
  if (filter.vendorId) query = query.eq("vendor_id", filter.vendorId);
  if (filter.projectId) query = query.eq("project_id", filter.projectId);
  if (filter.status?.length) query = query.in("execution_status", filter.status);
  const [{ data }, names] = await Promise.all([query, getMemberNames(orgId)]);
  return ((data ?? []) as unknown as Raw[]).map((r) => toRow(r, names));
}

export const getAssignment = cache(async (orgId: string, id: string): Promise<AssignmentDetail | null> => {
  const supabase = await createClient();
  const [{ data }, names] = await Promise.all([
    supabase.from("vendor_assignments").select(ASSIGNMENT_COLUMNS).eq("org_id", orgId).eq("id", id).maybeSingle(),
    getMemberNames(orgId),
  ]);
  if (!data) return null;
  const row = toRow(data as unknown as Raw, names);
  const [{ data: payments }, proofs] = await Promise.all([
    supabase.from("vendor_payments").select("id, amount, paid_at, note, recorded_by").eq("assignment_id", id).order("paid_at", { ascending: false }),
    row.taskId ? getTaskProofs(row.taskId, orgId) : Promise.resolve([] as ProofItem[]),
  ]);
  const list = (payments ?? []).map((p) => ({ id: p.id, amount: Number(p.amount), paidAt: p.paid_at, note: p.note, byName: p.recorded_by ? (names.get(p.recorded_by) ?? null) : null }));
  return {
    ...row,
    payments: list,
    paidTotal: list.reduce((sum, p) => sum + p.amount, 0),
    proofs,
    recordStatusOnSubmit: (data as unknown as Raw).record_status_on_submit,
    recordStatusOnVerify: (data as unknown as Raw).record_status_on_verify,
  };
});

/** What Today reads: work submitted and waiting, and work past its date. */
export async function vendorAttention(orgId: string, today: string): Promise<{
  toVerify: AssignmentRow[];
  toVerifyCount: number;
  late: AssignmentRow[];
  lateCount: number;
}> {
  const supabase = await createClient();
  const names = await getMemberNames(orgId);
  const [{ data: submitted, count: toVerifyCount }, { data: late, count: lateCount }] = await Promise.all([
    supabase.from("vendor_assignments").select(ASSIGNMENT_COLUMNS, { count: "exact" }).eq("org_id", orgId).eq("execution_status", "submitted").order("submitted_at", { ascending: true }).limit(5),
    supabase.from("vendor_assignments").select(ASSIGNMENT_COLUMNS, { count: "exact" }).eq("org_id", orgId).in("execution_status", ["assigned", "in_progress", "rejected"]).lt("due_date", today).order("due_date", { ascending: true }).limit(5),
  ]);
  return {
    toVerify: ((submitted ?? []) as unknown as Raw[]).map((r) => toRow(r, names)),
    toVerifyCount: toVerifyCount ?? 0,
    late: ((late ?? []) as unknown as Raw[]).map((r) => toRow(r, names)),
    lateCount: lateCount ?? 0,
  };
}
