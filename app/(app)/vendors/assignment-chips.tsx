import { CheckCircle2, CircleDot, Clock, IndianRupee, Send, Undo2 } from "lucide-react";

import { StateChip } from "@/components/ui/state-chip";
import { getVendors } from "@/lib/i18n/vendors";
import type { Locale } from "@/lib/i18n";
import type { AssignmentRow } from "@/lib/vendors/queries";

/** Execution and payment as words with icons; late in red only when the date has passed. */
export function AssignmentChips({ locale, assignment, today }: { locale: Locale; assignment: AssignmentRow; today?: string }) {
  const t = getVendors(locale).work;
  const s = assignment.executionStatus;
  const late = !!assignment.dueDate && !!today && assignment.dueDate < today && !["verified", "rejected"].includes(s);
  const tone = s === "verified" ? "hara" : s === "submitted" ? "amber" : s === "rejected" ? "laal" : s === "in_progress" ? "neel" : "outline";
  const icon = s === "verified" ? <CheckCircle2 /> : s === "submitted" ? <Send /> : s === "rejected" ? <Undo2 /> : <CircleDot />;
  return (
    <span className="flex flex-wrap gap-1.5">
      <StateChip tone={tone} icon={icon}>{t.statuses[s]}</StateChip>
      {late ? <StateChip tone="laal" icon={<Clock />}>{t.late}</StateChip> : null}
      {assignment.amount !== null ? (
        <StateChip tone={assignment.paymentStatus === "paid" ? "hara" : "outline"} icon={<IndianRupee />}>{t.payment[assignment.paymentStatus]}</StateChip>
      ) : null}
    </span>
  );
}
