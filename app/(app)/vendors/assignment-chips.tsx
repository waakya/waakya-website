import { Clock, Undo2 } from "lucide-react";

import { StateChip } from "@/components/ui/state-chip";
import { StateWord } from "@/components/waakya/state-word";
import { getVendors } from "@/lib/i18n/vendors";
import type { Locale } from "@/lib/i18n";
import type { AssignmentRow } from "@/lib/vendors/queries";

/**
 * Vendor work, stated (Visual V2 status grammar): the normal path as a
 * state word — assigned, in progress, verified — and a chip only when
 * something needs a look: handed in and waiting to be verified, sent back,
 * or late. Payment is a fact beside it, not a badge.
 */
export function AssignmentChips({ locale, assignment, today }: { locale: Locale; assignment: AssignmentRow; today?: string }) {
  const t = getVendors(locale).work;
  const s = assignment.executionStatus;
  const late = !!assignment.dueDate && !!today && assignment.dueDate < today && !["verified", "rejected"].includes(s);
  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      {s === "submitted" ? (
        <StateChip tone="neel">{t.statuses[s]}</StateChip>
      ) : s === "rejected" ? (
        <StateChip tone="laal" icon={<Undo2 />}>{t.statuses[s]}</StateChip>
      ) : (
        <StateWord tone={s === "verified" ? "done" : s === "in_progress" ? "go" : "quiet"}>{t.statuses[s]}</StateWord>
      )}
      {late ? <StateChip tone="laal" icon={<Clock />}>{t.late}</StateChip> : null}
      {assignment.amount !== null ? (
        <span className={assignment.paymentStatus === "paid" ? "text-label font-semibold text-hara-700" : "text-label text-fg-subtle"}>
          ₹ {t.payment[assignment.paymentStatus]}
        </span>
      ) : null}
    </span>
  );
}
