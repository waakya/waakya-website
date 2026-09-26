import Link from "next/link";

import { Avatar } from "@/components/ui/avatar";
import { type Locale } from "@/lib/i18n";
import { getDesign } from "@/lib/i18n/design";
import { getDictionary } from "@/lib/i18n";
import { getPhase1 } from "@/lib/i18n/phase1";
import { formatPunchTime } from "@/lib/attendance/time";
import type { TeamAttendanceRow } from "@/lib/attendance/queries";

const TEAM_SHOWN = 8;

export interface TeamPulse {
  id: string;
  name: string;
  total: number;
  done: number;
  late: number;
}

/**
 * "Who is on, and who is behind" — the manager's coordination view, one line
 * per person (V3: the People idea from architecture C, without a separate
 * directory). Lateness in words; the person's work is one tap away in Work.
 */
export function TeamToday({
  locale,
  staff,
  attendance,
}: {
  locale: Locale;
  staff: TeamPulse[];
  attendance: TeamAttendanceRow[];
}) {
  const t = getDictionary(locale);
  const d = getDesign(locale);
  const p = getPhase1(locale);
  const presence = new Map(attendance.map((row) => [row.userId, row]));

  if (staff.length === 0) return <p className="text-body text-fg-subtle">{t.desktop.noOne}</p>;

  // Who is behind comes first; a large team stays a short list, with the
  // whole team one tap away (Today stays bounded however big the business).
  const shown = [...staff].sort((a, b) => b.late - a.late || a.name.localeCompare(b.name)).slice(0, TEAM_SHOWN);

  return (
    <>
    <ul aria-label={d.v3.teamToday} className="divide-y divide-line">
      {shown.map((person) => {
        const row = presence.get(person.id);
        const where =
          row?.status === "leave"
            ? p.team.onLeave
            : row?.punchInAt
              ? `${p.team.inToday} · ${formatPunchTime(row.punchInAt)}`
              : p.team.notIn;
        return (
          <li key={person.id}>
            <Link
              href={`/work?person=${person.id}`}
              className="flex items-center gap-3 py-2.5 transition-colors duration-150 hover:bg-paper-50/70"
            >
              <Avatar name={person.name} size={30} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-body-sm font-semibold text-fg" title={person.name}>
                  {person.name}
                </span>
                <span className="num block truncate text-caption text-fg-subtle">{where}</span>
              </span>
              <span className="num shrink-0 text-right text-caption text-fg-subtle">
                {person.total > 0 ? d.today.staffProgress(person.done, person.total) : "—"}
                {/* Only lateness is red; progress is not an alarm. */}
                {person.late > 0 ? (
                  <span className="block font-semibold text-laal-700">{person.late} {t.chips.late}</span>
                ) : null}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
    {staff.length > TEAM_SHOWN ? (
      <Link href="/hazri#team" className="num mt-1 inline-flex min-h-11 items-center text-label font-semibold text-neel-700 hover:text-neel-800">
        {d.v3.allTeam(staff.length)}
      </Link>
    ) : null}
    </>
  );
}
