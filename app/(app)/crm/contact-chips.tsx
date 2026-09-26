import { CalendarClock, Clock, Sparkles, UserCheck, UserX } from "lucide-react";

import { StateChip } from "@/components/ui/state-chip";
import { getCrm } from "@/lib/i18n/crm";
import type { Locale } from "@/lib/i18n";
import type { ContactRow } from "@/lib/crm/queries";

/** Kind, owner and follow-up as words with icons: never colour alone. */
export function ContactChips({ locale, contact }: { locale: Locale; contact: ContactRow }) {
  const t = getCrm(locale);
  return (
    <div className="flex flex-wrap gap-1.5">
      <StateChip tone={contact.kind === "customer" ? "hara" : "neel"} icon={contact.kind === "customer" ? <UserCheck /> : <Sparkles />}>
        {t.kind[contact.kind]}
      </StateChip>
      {contact.ownerName ? (
        <StateChip tone="outline" icon={<UserCheck />}>{contact.ownerName}</StateChip>
      ) : contact.kind === "lead" ? (
        <StateChip tone="amber" icon={<UserX />}>{t.actions.unassigned}</StateChip>
      ) : null}
      {contact.followUp === "overdue" ? (
        <StateChip tone="laal" icon={<Clock />}>{t.followUp.overdue}</StateChip>
      ) : contact.followUp === "due" ? (
        <StateChip tone="amber" icon={<CalendarClock />}>{t.followUp.due}</StateChip>
      ) : null}
    </div>
  );
}
