import Link from "next/link";

import { getVendors } from "@/lib/i18n/vendors";
import { istDateKey } from "@/lib/tasks/time";
import type { Locale } from "@/lib/i18n";
import { listAssignments } from "@/lib/vendors/queries";
import { assignChoices } from "@/lib/vendors/choices";
import { AssignForm } from "@/app/(app)/vendors/assign-form";
import { AssignmentChips } from "@/app/(app)/vendors/assignment-chips";

/** The vendor work on this project: who is delivering what, and where each piece stands. */
export async function VendorSection({ locale, orgId, projectId, manages }: { locale: Locale; orgId: string; projectId: string; manages: boolean }) {
  const t = getVendors(locale);
  const [work, choices] = await Promise.all([listAssignments(orgId, { projectId }), manages ? assignChoices(orgId) : Promise.resolve(null)]);
  const today = istDateKey();
  return (
    <section aria-labelledby="vendor-h">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="vendor-h" className="text-body font-bold text-fg">
          {t.work.title} <span className="num font-normal text-fg-subtle">{work.length}</span>
        </h2>
        {choices ? <AssignForm locale={locale} choices={choices} fixedProjectId={projectId} verb /> : null}
      </div>
      {work.length === 0 ? (
        <p className="mt-2 border-y border-line py-3 text-body-sm text-fg-subtle">{t.work.empty}</p>
      ) : (
        <ul className="mt-2 border-y border-line">
          {work.map((a) => (
            <li key={a.id} className="border-b border-line last:border-b-0">
              <Link href={`/vendors/assignments/${a.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 hover:bg-paper-100/60">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body-sm font-semibold text-fg">{a.title}</span>
                  <span className="num block truncate text-caption text-fg-subtle">{[a.vendorName, a.taskAssigneeName].filter(Boolean).join(" · ")}</span>
                </span>
                <AssignmentChips locale={locale} assignment={a} today={today} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
