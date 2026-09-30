import { CalendarClock, Clock, UserX } from "lucide-react";

import { StateChip } from "@/components/ui/state-chip";
import { StateWord } from "@/components/waakya/state-word";
import { getCrm } from "@/lib/i18n/crm";
import type { Locale } from "@/lib/i18n";
import type { ContactRow } from "@/lib/crm/queries";

/** Kind, owner and follow-up as words with icons: never colour alone. */
export function ContactChips({ locale, contact }: { locale: Locale; contact: ContactRow }) {
  const t = getCrm(locale);
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      {/* Kind is a normal state, the owner a plain fact; only a missing owner
          or a late follow-up is an exception worth a chip (Visual V2). */}
      <StateWord tone={contact.kind === "customer" ? "done" : "go"}>{t.kind[contact.kind]}</StateWord>
      {contact.ownerName ? (
        <span className="text-label text-fg-muted">{contact.ownerName}</span>
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
