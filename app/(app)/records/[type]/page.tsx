import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Layers } from "lucide-react";

import { requireModule, viewerCan } from "@/lib/auth/session";
import { shellFor } from "@/lib/auth/shell";
import { getRecords } from "@/lib/i18n/records";
import { getRecordType, listRecords, relationChoices } from "@/lib/records/queries";
import { formatValue, listColumns, statusOf } from "@/lib/records/schema";
import { getMemberNames, getOrgMembers } from "@/lib/org/members";
import { AppShell } from "@/components/waakya/app-shell";
import { EmptyState, PageHeader } from "@/components/waakya/page";
import { StateChip } from "@/components/ui/state-chip";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RecordForm } from "./record-form";

export const metadata: Metadata = { title: "Records" };

/** One kind of record as a list: the columns the type asked for, the status in words. */
export default async function RecordListPage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ q?: string; status?: string; page?: string; archived?: string }>;
}) {
  const viewer = await requireModule("records");
  const { type: typeKey } = await params;
  const sp = await searchParams;
  const shell = await shellFor(viewer);
  const t = getRecords(shell.locale);
  const type = await getRecordType(viewer.org.id, typeKey);
  if (!type) notFound();
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const [result, members, choices, names] = await Promise.all([
    listRecords(viewer.org.id, type, { q: sp.q, status: sp.status, page, archived: sp.archived === "1" }),
    getOrgMembers(viewer.org.id),
    viewerCan(viewer, "records.write") ? relationChoices(viewer.org.id) : Promise.resolve({ projects: [], contacts: [] }),
    getMemberNames(viewer.org.id),
  ]);
  const columns = listColumns(type.fields, 4);
  const pages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const words = { yes: t.record.yes, no: t.record.no, none: t.record.none };
  const link = (next: Partial<{ status: string; page: number; q: string; archived: string }>) => {
    const q = new URLSearchParams();
    const status = next.status ?? sp.status;
    const query = next.q ?? sp.q;
    const archived = next.archived ?? sp.archived;
    if (status) q.set("status", status);
    if (query) q.set("q", query);
    if (archived === "1") q.set("archived", "1");
    if ((next.page ?? 1) > 1) q.set("page", String(next.page));
    const s = q.toString();
    return `/records/${type.key}${s ? `?${s}` : ""}`;
  };

  return (
    <AppShell {...shell} width="list">
      <main className="flex-1 p-4 pb-8 lg:px-0">
        <PageHeader back={{ href: "/records", label: t.title }} title={type.namePlural} description={type.description ?? undefined} />

        {viewerCan(viewer, "records.write") && !type.archivedAt ? (
          <div className="mt-5">
            <RecordForm
              locale={shell.locale}
              type={{ key: type.key, name: type.name, fields: type.fields, statuses: type.statuses, defaultStatus: type.defaultStatus, customerVisibleDefault: type.customerVisibleDefault }}
              people={members.map((m) => ({ id: m.userId, name: m.name }))}
              projects={choices.projects}
              contacts={choices.contacts}
              canSetVisibility={viewerCan(viewer, "projects.updates.publish")}
            />
          </div>
        ) : null}

        <form action={`/records/${type.key}`} method="get" role="search" className="mt-5 flex gap-2">
          {sp.status ? <input type="hidden" name="status" value={sp.status} /> : null}
          <input type="search" name="q" defaultValue={sp.q ?? ""} placeholder={t.list.search} aria-label={t.list.search} className="h-tap min-w-0 flex-1 rounded-button border-2 border-paper-200 bg-paper-0 px-4 text-body outline-none focus:border-neel-600" />
          <button type="submit" className={buttonVariants({ variant: "secondary", size: "owner" })}>{t.list.search}</button>
        </form>

        <nav aria-label={t.list.byStatus} className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0">
          <Link href={link({ status: "", page: 1 })} aria-current={!sp.status ? "page" : undefined} className={cn("shrink-0 rounded-chip border px-3 py-2 text-label font-semibold", !sp.status ? "border-neel-600 bg-neel-600 text-white" : "border-paper-200 bg-paper-0 text-ink-700")}>
            {t.list.all}
          </Link>
          {type.statuses.map((s) => (
            <Link key={s.key} href={link({ status: s.key, page: 1 })} aria-current={sp.status === s.key ? "page" : undefined} className={cn("shrink-0 rounded-chip border px-3 py-2 text-label font-semibold", sp.status === s.key ? "border-neel-600 bg-neel-600 text-white" : "border-paper-200 bg-paper-0 text-ink-700")}>
              {s.label}
            </Link>
          ))}
        </nav>

        {result.items.length === 0 ? (
          <EmptyState className="mt-6" icon={<Layers />} title={t.list.empty(type.namePlural)} body={t.list.emptyHelp} />
        ) : (
          <>
            <div className="mt-4 overflow-x-auto rounded-card border border-line bg-surface shadow-card">
              <table className="w-full min-w-[32rem] text-body-sm">
                <thead>
                  <tr className="border-b border-line text-left text-caption text-fg-subtle">
                    <th scope="col" className="px-4 py-2 font-semibold">{type.name}</th>
                    {columns.map((c) => (
                      <th key={c.key} scope="col" className="px-3 py-2 font-semibold">{c.label}</th>
                    ))}
                    <th scope="col" className="px-3 py-2 font-semibold">{t.record.status}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {result.items.map((r) => {
                    const status = statusOf(type.statuses, r.statusKey);
                    return (
                      <tr key={r.id} className="hover:bg-paper-50/70">
                        <td className="px-4 py-2.5">
                          <Link href={`/records/${type.key}/${r.id}`} className="font-semibold text-fg hover:text-neel-700">{r.title}</Link>
                          {r.projectName ? <span className="block truncate text-caption text-fg-subtle">{r.projectName}</span> : null}
                        </td>
                        {columns.map((c) => (
                          <td key={c.key} className="num px-3 py-2.5 text-fg">{formatValue(c, r.values[c.key], words, { names })}</td>
                        ))}
                        <td className="px-3 py-2.5">{status ? <StateChip tone={status.tone}>{status.label}</StateChip> : null}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="num mt-3 flex items-center justify-between text-label text-fg-subtle">
              <span>{t.list.showing((page - 1) * result.pageSize + 1, Math.min(page * result.pageSize, result.total), result.total)}</span>
              <span className="flex gap-2">
                {page > 1 ? <Link href={link({ page: page - 1 })} className={buttonVariants({ variant: "outline", size: "sm" })}>{t.list.previous}</Link> : null}
                {page < pages ? <Link href={link({ page: page + 1 })} className={buttonVariants({ variant: "outline", size: "sm" })}>{t.list.next}</Link> : null}
              </span>
            </div>
          </>
        )}
      </main>
    </AppShell>
  );
}
