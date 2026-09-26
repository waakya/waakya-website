"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, IndianRupee, Play, Send, Undo2 } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getVendors } from "@/lib/i18n/vendors";
import type { Locale } from "@/lib/i18n";
import { progressVendorWork, recordVendorPayment, verifyVendorWork } from "@/lib/vendors/actions";

const TEXTAREA = "w-full rounded-button border-2 border-paper-200 bg-paper-0 px-3 py-2 text-body outline-none focus:border-neel-600";

/** The one thing each person can do next: start, submit, verify or send back, record a payment. */
export function AssignmentActions({
  locale,
  assignment,
  canProgress,
  canVerify,
  canPay,
}: {
  locale: Locale;
  assignment: { id: string; status: string; taskId: string | null; amount: number | null; paidTotal: number };
  canProgress: boolean;
  canVerify: boolean;
  canPay: boolean;
}) {
  const t = getVendors(locale);
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [note, setNote] = React.useState("");
  const [reject, setReject] = React.useState(false);
  const [amount, setAmount] = React.useState("");
  const run = (fn: () => Promise<{ ok: boolean; message?: string }>) =>
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) {
        toast.error(result.message ?? "");
        return;
      }
      setNote("");
      setReject(false);
      setAmount("");
      router.refresh();
    });
  const s = assignment.status;

  return (
    <aside className="flex flex-col gap-3 rounded-card border border-line bg-surface p-3 shadow-card">
      {canProgress && (s === "assigned" || s === "rejected") ? (
        <Button variant="outline" disabled={pending} onClick={() => run(() => progressVendorWork({ id: assignment.id, status: "in_progress" }))}>
          <Play aria-hidden="true" />
          {t.work.start}
        </Button>
      ) : null}
      {canProgress && (s === "assigned" || s === "in_progress" || s === "rejected") ? (
        <form
          className="flex flex-col gap-2 rounded-inner bg-paper-50 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => progressVendorWork({ id: assignment.id, status: "submitted", note }));
          }}
        >
          <Label htmlFor="submit-note">{t.work.submitNote}</Label>
          <textarea id="submit-note" rows={2} maxLength={2000} className={TEXTAREA} value={note} onChange={(e) => setNote(e.target.value)} />
          {assignment.taskId ? (
            <Link href={`/kaam/${assignment.taskId}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>{t.work.internalTask}</Link>
          ) : null}
          <Button type="submit" size="staff" disabled={pending}>
            <Send aria-hidden="true" />
            {t.work.submit}
          </Button>
        </form>
      ) : null}

      {canVerify && s === "submitted" ? (
        <div className="flex flex-col gap-2 rounded-inner bg-paper-50 p-3">
          <Button size="staff" disabled={pending} onClick={() => run(() => verifyVendorWork({ id: assignment.id, verdict: "verified" }))}>
            <Check aria-hidden="true" />
            {t.work.verify}
          </Button>
          {!reject ? (
            <Button variant="outline" disabled={pending} onClick={() => setReject(true)}>
              <Undo2 aria-hidden="true" />
              {t.work.reject}
            </Button>
          ) : (
            <form
              className="flex flex-col gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                run(() => verifyVendorWork({ id: assignment.id, verdict: "rejected", note }));
              }}
            >
              <Label htmlFor="reject-note">{t.work.rejectNote}</Label>
              <textarea id="reject-note" rows={2} maxLength={2000} className={TEXTAREA} value={note} onChange={(e) => setNote(e.target.value)} required />
              <Button type="submit" variant="danger" disabled={pending || note.trim().length === 0}>{t.work.reject}</Button>
            </form>
          )}
        </div>
      ) : null}

      {canPay && assignment.amount !== null && assignment.paidTotal < assignment.amount ? (
        <form
          className="flex flex-col gap-2 rounded-inner bg-paper-50 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => recordVendorPayment({ assignmentId: assignment.id, amount: Number(amount), note }));
          }}
        >
          <Label htmlFor="pay-amount">{t.payments.record}</Label>
          <Input id="pay-amount" type="number" inputMode="decimal" min={1} step="any" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          <Button type="submit" size="sm" variant="secondary" disabled={pending || !amount}>
            <IndianRupee aria-hidden="true" />
            {t.payments.record}
          </Button>
        </form>
      ) : null}
    </aside>
  );
}
