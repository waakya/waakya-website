import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireModule, viewerCan } from "@/lib/auth/session";
import { shellFor } from "@/lib/auth/shell";
import { getVendors } from "@/lib/i18n/vendors";
import { getAssignment } from "@/lib/vendors/queries";
import { formatIndianDate } from "@/lib/tasks/format-date";
import { formatTime, istDateKey } from "@/lib/tasks/time";
import { AppShell } from "@/components/waakya/app-shell";
import { PageHeader, Section } from "@/components/waakya/page";
import { AssignmentChips } from "../../assignment-chips";
import { AssignmentActions } from "./assignment-actions";

export const metadata: Metadata = { title: "Vendor work" };

/** One piece of vendor work: what, who, when, proof, payment, and the next step for whoever is looking. */
export default async function AssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await requireModule("vendors");
  const { id } = await params;
  const shell = await shellFor(viewer);
  const t = getVendors(shell.locale);
  const a = await getAssignment(viewer.org.id, id);
  if (!a) notFound();
  const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
  const today = istDateKey();
  const manages = viewerCan(viewer, "vendors.verify");
  const isOwner = a.taskAssigneeId === viewer.userId;

  return (
    <AppShell {...shell} width="list">
      <main className="flex-1 p-4 pb-8 lg:px-0">
        <PageHeader back={{ href: `/vendors/${a.vendorId}`, label: a.vendorName }} title={a.title} description={[a.projectName, a.recordTitle, a.dueDate ? `${t.work.dueDate}: ${formatIndianDate(`${a.dueDate}T12:00:00Z`, shell.locale)}` : null].filter(Boolean).join(" · ") || undefined} />
        <div className="mt-3"><AssignmentChips locale={shell.locale} assignment={a} today={today} /></div>
        {a.details ? <p className="mt-3 max-w-2xl text-body text-fg-muted">{a.details}</p> : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
          <div className="min-w-0">
            <dl className="num grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 rounded-card border border-line bg-surface p-4 text-body-sm shadow-card">
              <dt className="text-fg-subtle">{t.work.amount}</dt><dd className="text-fg">{a.amount !== null ? money.format(a.amount) : "—"}</dd>
              <dt className="text-fg-subtle">{t.work.owner}</dt><dd className="text-fg">{a.taskAssigneeName ?? "—"}{a.taskId ? <> · <Link href={`/kaam/${a.taskId}`} className="font-semibold text-neel-700">{t.work.internalTask}</Link></> : null}</dd>
              {a.projectName ? (<><dt className="text-fg-subtle">{t.work.project}</dt><dd><Link href={`/projects/${a.projectId}`} className="font-semibold text-neel-700">{a.projectName}</Link></dd></>) : null}
              {a.recordTitle ? (<><dt className="text-fg-subtle">{t.work.record}</dt><dd className="text-fg">{a.recordTitle}</dd></>) : null}
              {a.submittedAt ? (<><dt className="text-fg-subtle">{t.work.statuses.submitted}</dt><dd className="text-fg">{formatIndianDate(a.submittedAt, shell.locale)} {formatTime(a.submittedAt)}{a.submittedNote ? ` · ${a.submittedNote}` : ""}</dd></>) : null}
              {a.verifiedAt ? (<><dt className="text-fg-subtle">{t.work.statuses.verified}</dt><dd className="text-fg">{a.verifiedByName ?? ""} · {formatIndianDate(a.verifiedAt, shell.locale)}</dd></>) : null}
              {a.rejectionNote ? (<><dt className="text-fg-subtle">{t.work.rejectNote}</dt><dd className="text-fg">{a.rejectionNote}</dd></>) : null}
            </dl>

            <Section title={t.work.proofs} count={a.proofs.length}>
              {a.proofs.length === 0 ? (
                <p className="text-body-sm text-fg-subtle">{t.work.noProofs}</p>
              ) : (
                <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {a.proofs.map((p) => (
                    <li key={p.id} className="rounded-inner border border-line bg-surface p-2 text-caption text-fg-subtle">
                      {p.url && p.kind === "photo" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <a href={p.url} target="_blank" rel="noreferrer"><img src={p.url} alt={a.title} className="aspect-[4/3] w-full rounded-inner object-cover" /></a>
                      ) : (
                        <p className="text-body-sm text-fg">{p.body ?? p.kind}</p>
                      )}
                      <p className="num mt-1">{p.byName} · {formatIndianDate(p.at, shell.locale)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            {manages ? (
              <Section title={t.payments.title} count={a.payments.length}>
                {a.amount !== null ? <p className="num mb-2 text-body-sm text-fg-subtle">{t.payments.paid(money.format(a.paidTotal), money.format(a.amount))}</p> : null}
                {a.payments.length === 0 ? (
                  <p className="text-body-sm text-fg-subtle">{t.payments.none}</p>
                ) : (
                  <ul className="divide-y divide-line rounded-card border border-line bg-surface">
                    {a.payments.map((p) => (
                      <li key={p.id} className="num flex items-center gap-3 px-4 py-2 text-body-sm">
                        <span className="flex-1 text-fg">{money.format(p.amount)}{p.note ? ` · ${p.note}` : ""}</span>
                        <span className="text-caption text-fg-subtle">{formatIndianDate(`${p.paidAt}T12:00:00Z`, shell.locale)}{p.byName ? ` · ${p.byName}` : ""}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            ) : null}
          </div>

          <AssignmentActions
            locale={shell.locale}
            assignment={{ id: a.id, status: a.executionStatus, taskId: a.taskId, amount: a.amount, paidTotal: a.paidTotal }}
            canProgress={isOwner || manages}
            canVerify={manages}
            canPay={viewerCan(viewer, "vendors.payment.record")}
          />
        </div>
      </main>
    </AppShell>
  );
}
