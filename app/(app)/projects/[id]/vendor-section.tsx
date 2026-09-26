import Link from "next/link";

import { getVendors } from "@/lib/i18n/vendors";
import { istDateKey } from "@/lib/tasks/time";
import type { Locale } from "@/lib/i18n";
import { listAssignments } from "@/lib/vendors/queries";
import { assignChoices } from "@/lib/vendors/choices";
import { ListSurface, Section } from "@/components/waakya/page";
import { AssignForm } from "@/app/(app)/vendors/assign-form";
import { AssignmentChips } from "@/app/(app)/vendors/assignment-chips";

/** The vendor work on this project: who is delivering what, and where each piece stands. */
export async function VendorSection({ locale, orgId, projectId, manages }: { locale: Locale; orgId: string; projectId: string; manages: boolean }) {
  const t = getVendors(locale);
  const [work, choices] = await Promise.all([listAssignments(orgId, { projectId }), manages ? assignChoices(orgId) : Promise.resolve(null)]);
  const today = istDateKey();
  return (
    <Section title={t.work.title} count={work.length} action={choices ? <AssignForm locale={locale} choices={choices} fixedProjectId={projectId} /> : null}>
      {work.length === 0 ? (
        <p className="text-body-sm text-fg-subtle">{t.work.empty}</p>
      ) : (
        <ListSurface>
          {work.map((a) => (
            <li key={a.id}>
              <Link href={`/vendors/assignments/${a.id}`} className="flex flex-wrap items-center gap-2 px-3.5 py-3 hover:bg-paper-50/70">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body-sm font-semibold text-fg">{a.title}</span>
                  <span className="num block truncate text-caption text-fg-subtle">{[a.vendorName, a.taskAssigneeName].filter(Boolean).join(" · ")}</span>
                </span>
                <AssignmentChips locale={locale} assignment={a} today={today} />
              </Link>
            </li>
          ))}
        </ListSurface>
      )}
    </Section>
  );
}
