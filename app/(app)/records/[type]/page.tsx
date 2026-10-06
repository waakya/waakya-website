import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Layers, Search } from "lucide-react";

import { requireModule, viewerCan } from "@/lib/auth/session";
import { shellFor } from "@/lib/auth/shell";
import { getRecords } from "@/lib/i18n/records";
import { getRecordType, listRecords, relationChoices } from "@/lib/records/queries";
import { formatValue, listColumns, statusOf } from "@/lib/records/schema";
import { getMemberNames, getOrgMembers } from "@/lib/org/members";
import { AppShell } from "@/components/waakya/app-shell";
import { EmptyState, PageHeader } from "@/components/waakya/page";
import { StateChip } from "@/components/ui/state-chip";
import { StateWord, wordTone } from "@/components/waakya/state-word";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NewRecord } from "./new-record";

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
        <PageHeader
          back={{ href: "/records", label: t.title }}
          title={type.namePlural}
          description={type.description ?? undefined}
          actions={
            viewerCan(viewer, "records.write") && !type.archivedAt ? (
              <NewRecord
                locale={shell.locale}
                type={{ key: type.key, name: type.name, fields: type.fields, statuses: type.statuses, defaultStatus: type.defaultStatus, customerVisibleDefault: type.customerVisibleDefault }}
                people={members.map((m) => ({ id: m.userId, name: m.name }))}
                projects={choices.projects}
                contacts={choices.contacts}
                canSetVisibility={viewerCan(viewer, "projects.updates.publish")}
              />
            ) : undefined
          }
        />

        <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label={t.list.byStatus} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0 lg:pb-0">
          <Link href={link({ status: "", page: 1 })} aria-current={!sp.status ? "page" : undefined} className={cn("shrink-0 rounded-chip border px-3 py-2 text-label font-semibold", !sp.status ? "border-neel-600 bg-neel-600 text-white" : "border-paper-200 bg-paper-0 text-ink-700")}>
            {t.list.all}
          </Link>
          {type.statuses.map((s) => (
            <Link key={s.key} href={link({ status: s.key, page: 1 })} aria-current={sp.status === s.key ? "page" : undefined} className={cn("shrink-0 rounded-chip border px-3 py-2 text-label font-semibold", sp.status === s.key ? "border-neel-600 bg-neel-600 text-white" : "border-paper-200 bg-paper-0 text-ink-700")}>
              {s.label}
            </Link>
          ))}
        </nav>
        <form action={`/records/${type.key}`} method="get" role="search" className="flex gap-2 lg:w-80">
          {sp.status ? <input type="hidden" name="status" value={sp.status} /> : null}
          <input type="search" name="q" defaultValue={sp.q ?? ""} placeholder={t.list.search} aria-label={t.list.search} className="h-tap min-w-0 flex-1 rounded-button border-2 border-paper-200 bg-paper-0 px-4 text-body outline-none focus:border-neel-600" />
          <button type="submit" aria-label={t.list.search} className={buttonVariants({ variant: "outline", size: "icon" })}>
            <Search aria-hidden="true" />
          </button>
        </form>
        </div>

        {result.items.length === 0 ? (
          <EmptyState className="mt-6" icon={<Layers />} title={t.list.empty(type.namePlural)} body={t.list.emptyHelp} />
        ) : (
          <>
            {/* A desk: the questions as columns, the status second. */}
            <div className="mt-4 hidden overflow-hidden rounded-card border border-line bg-surface shadow-card md:block">
              <table className="w-full table-fixed text-body-sm">
                <thead>
                  <tr className="border-b border-line text-left text-caption text-fg-subtle">
                    <th scope="col" className="w-[28%] px-4 py-2.5 font-semibold">{type.name}</th>
                    <th scope="col" className="w-32 px-3 py-2.5 font-semibold">{t.record.status}</th>
                    {columns.map((c) => (
                      <th key={c.key} scope="col" className="px-3 py-2.5 font-semibold">{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {result.items.map((r) => {
                    const status = statusOf(type.statuses, r.statusKey);
                    return (
                      <tr key={r.id} className="hover:bg-paper-50/70">
                        <td className="px-4 py-2.5">
                          <Link href={`/records/${type.key}/${r.id}`} className="block truncate font-semibold text-fg hover:text-neel-700">{r.title}</Link>
                          {r.projectName ? <span className="block truncate text-caption text-fg-subtle">{r.projectName}</span> : null}
                        </td>
                        <td className="px-3 py-2.5"><RecordStatus status={status} /></td>
                        {columns.map((c) => (
                          <td key={c.key} className="num truncate px-3 py-2.5 text-fg">{formatValue(c, r.values[c.key], words, { names })}</td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* A phone: the record, its status, then two facts — never a table to scroll sideways. */}
            <ul aria-label={type.namePlural} className="mt-4 border-y border-line md:hidden">
              {result.items.map((r) => {
                const status = statusOf(type.statuses, r.statusKey);
                const facts = columns
                  .map((c) => ({ c, v: r.values[c.key] }))
                  .filter(({ v }) => v !== null && v !== undefined && v !== "")
                  .slice(0, 3)
                  .map(({ c, v }) => formatValue(c, v, words, { names }));
                return (
                  <li key={r.id} className="relative flex min-h-14 items-center gap-3 border-b border-line py-2.5 last:border-b-0 hover:bg-paper-100/60">
                    <span className="min-w-0 flex-1">
                      {/* The title is the link; the whole row is its target. */}
                      <Link href={`/records/${type.key}/${r.id}`} className="block truncate text-body font-semibold text-fg after:absolute after:inset-0">
                        {r.title}
                      </Link>
                      {facts.length ? <span className="num block truncate text-caption text-fg-subtle">{facts.join(" · ")}</span> : null}
                    </span>
                    <RecordStatus status={status} />
                  </li>
                );
              })}
            </ul>
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

/** A normal status as a word; a red one stays a chip, because it is an exception. */
function RecordStatus({ status }: { status: ReturnType<typeof statusOf> }) {
  if (!status) return null;
  const tone = wordTone(status.tone);
  return tone === "exception" ? <StateChip tone={status.tone}>{status.label}</StateChip> : <StateWord tone={tone}>{status.label}</StateWord>;
}
