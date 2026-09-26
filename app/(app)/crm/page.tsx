import type { Metadata } from "next";
import Link from "next/link";
import { Contact, KanbanSquare, Phone, Search, Settings2 } from "lucide-react";

import { requireModule, viewerCan } from "@/lib/auth/session";
import { shellFor } from "@/lib/auth/shell";
import { getCrm } from "@/lib/i18n/crm";
import { listContacts, type ContactFilter, type ContactRow } from "@/lib/crm/queries";
import { getOrgMembers } from "@/lib/org/members";
import { formatIndianDate } from "@/lib/tasks/format-date";
import { AppShell } from "@/components/waakya/app-shell";
import { EmptyState, ListSurface, PageHeader } from "@/components/waakya/page";
import { buttonVariants } from "@/components/ui/button";
import { StateChip } from "@/components/ui/state-chip";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";
import { NewContact } from "./new-contact";
import { ContactChips } from "./contact-chips";

export const metadata: Metadata = { title: "Customers" };

const FILTERS: ContactFilter[] = ["all", "leads", "customers", "mine", "unassigned", "followUp", "archived"];

/**
 * Who is this, who owns them, what happens next. On a desk the list is a
 * table with those questions as its columns; on a phone each row answers the
 * same questions in two lines and a chip.
 */
export default async function CrmPage({ searchParams }: { searchParams: Promise<{ q?: string; f?: string; page?: string }> }) {
  const viewer = await requireModule("crm");
  const shell = await shellFor(viewer);
  const t = getCrm(shell.locale);
  const params = await searchParams;
  const filter = (FILTERS as string[]).includes(params.f ?? "") ? (params.f as ContactFilter) : "all";
  const q = (params.q ?? "").slice(0, 80);
  const page = Math.max(1, Number(params.page ?? 1) || 1);

  const [result, members] = await Promise.all([
    listContacts(viewer.org.id, { q, filter, page, viewerId: viewer.userId }),
    getOrgMembers(viewer.org.id),
  ]);
  const pages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const link = (next: Partial<{ q: string; f: string; page: number }>) => {
    const sp = new URLSearchParams();
    const fq = next.q ?? q;
    const ff = next.f ?? filter;
    if (fq) sp.set("q", fq);
    if (ff !== "all") sp.set("f", ff);
    if ((next.page ?? 1) > 1) sp.set("page", String(next.page));
    const s = sp.toString();
    return `/crm${s ? `?${s}` : ""}`;
  };
  const canWrite = viewerCan(viewer, "crm.write");

  return (
    <AppShell {...shell} width="list">
      <main className="flex-1 p-4 pb-8 lg:px-0">
        <PageHeader
          title={t.title}
          description={t.subtitle}
          actions={
            <>
              {viewerCan(viewer, "crm.pipeline.manage") ? (
                <Link href="/crm/settings" className={buttonVariants({ variant: "ghost", size: "icon" })} aria-label={t.pipeline.manage}>
                  <Settings2 aria-hidden="true" />
                </Link>
              ) : null}
              <Link href="/crm/pipeline" className={buttonVariants({ variant: "outline", size: "owner" })}>
                <KanbanSquare aria-hidden="true" />
                {t.pipeline.title}
              </Link>
              {canWrite ? (
                <NewContact
                  locale={shell.locale}
                  people={members.map((m) => ({ id: m.userId, name: m.name }))}
                  canAssign={viewerCan(viewer, "crm.assign")}
                  selfId={viewer.userId}
                />
              ) : null}
            </>
          }
        />

        <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <nav aria-label={t.filters.all} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0 lg:pb-0">
            {FILTERS.map((f) => (
              <Link
                key={f}
                href={link({ f, page: 1 })}
                aria-current={f === filter ? "page" : undefined}
                className={cn(
                  "shrink-0 rounded-chip border px-3 py-2 text-label font-semibold",
                  f === filter ? "border-neel-600 bg-neel-600 text-white" : "border-paper-200 bg-paper-0 text-ink-700",
                )}
              >
                {t.filters[f]}
              </Link>
            ))}
          </nav>
          <form action="/crm" method="get" role="search" className="flex gap-2 lg:w-80">
            {filter !== "all" ? <input type="hidden" name="f" value={filter} /> : null}
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder={t.search}
              aria-label={t.search}
              className="h-tap min-w-0 flex-1 rounded-button border-2 border-paper-200 bg-paper-0 px-4 text-body outline-none focus:border-neel-600"
            />
            <button type="submit" aria-label={t.search} className={buttonVariants({ variant: "outline", size: "icon" })}>
              <Search aria-hidden="true" />
            </button>
          </form>
        </div>

        {result.items.length === 0 ? (
          <EmptyState
            className="mt-6"
            icon={<Contact />}
            title={q || filter !== "all" ? t.empty.searchTitle : t.empty.title}
            body={q || filter !== "all" ? t.empty.searchBody : t.empty.body}
          />
        ) : (
          <>
            {/* A desk: the questions as columns. */}
            <div className="mt-4 hidden overflow-hidden rounded-card border border-line bg-surface shadow-card lg:block">
              <table className="w-full table-fixed border-collapse text-body-sm">
                <thead>
                  <tr className="border-b border-line text-left text-caption font-semibold text-fg-subtle">
                    <th scope="col" className="px-4 py-2.5 font-semibold">{t.fields.name}</th>
                    <th scope="col" className="w-32 px-3 py-2.5 font-semibold">{t.list.kind}</th>
                    <th scope="col" className="w-36 px-3 py-2.5 font-semibold">{t.fields.owner}</th>
                    <th scope="col" className="w-56 px-3 py-2.5 font-semibold">{t.fields.nextAction}</th>
                    <th scope="col" className="w-32 px-3 py-2.5 font-semibold">{t.list.lastActivity}</th>
                    <th scope="col" className="w-12 px-2 py-2.5"><span className="sr-only">{t.actions.call}</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {result.items.map((c) => (
                    <ContactTableRow key={c.id} c={c} locale={shell.locale} t={t} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* A phone: two lines and a chip. */}
            <ListSurface className="mt-4 lg:hidden" label={t.title}>
              {result.items.map((c) => (
                <li key={c.id} className="relative flex items-center gap-3 px-4 py-3 hover:bg-paper-50/70">
                  <div className="min-w-0 flex-1">
                    <Link href={`/crm/${c.id}`} className="block truncate text-body font-semibold text-fg after:absolute after:inset-0">
                      {c.fullName}
                    </Link>
                    <p className="num truncate text-caption text-fg-subtle">
                      {[c.companyName, c.phone, c.email].filter(Boolean).join(" · ")}
                    </p>
                    <div className="mt-1.5">
                      <ContactChips locale={shell.locale} contact={c} />
                    </div>
                  </div>
                  {c.phone ? (
                    <a
                      href={`tel:${c.phone}`}
                      aria-label={`${t.actions.call} ${c.fullName}`}
                      className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "relative z-10")}
                    >
                      <Phone aria-hidden="true" />
                    </a>
                  ) : null}
                </li>
              ))}
            </ListSurface>

            <div className="num mt-3 flex items-center justify-between text-label text-fg-subtle">
              <span>{t.counts.showing((page - 1) * result.pageSize + 1, Math.min(page * result.pageSize, result.total), result.total)}</span>
              <span className="flex gap-2">
                {page > 1 ? <Link href={link({ page: page - 1 })} className={buttonVariants({ variant: "outline", size: "sm" })}>{t.counts.previous}</Link> : null}
                {page < pages ? <Link href={link({ page: page + 1 })} className={buttonVariants({ variant: "outline", size: "sm" })}>{t.counts.next}</Link> : null}
              </span>
            </div>
          </>
        )}
      </main>
    </AppShell>
  );
}

function ContactTableRow({ c, locale, t }: { c: ContactRow; locale: Locale; t: ReturnType<typeof getCrm> }) {
  const next = c.nextActionAt ? formatIndianDate(c.nextActionAt, locale) : null;
  const last = c.lastActivityAt ? formatIndianDate(c.lastActivityAt, locale) : null;
  return (
    <tr className="hover:bg-paper-50/70">
      <td className="px-4 py-2.5 align-middle">
        <Link href={`/crm/${c.id}`} className="block truncate font-semibold text-fg hover:text-neel-700">
          {c.fullName}
        </Link>
        <span className="num block truncate text-caption text-fg-subtle">
          {[c.companyName, c.phone, c.email].filter(Boolean).join(" · ")}
        </span>
      </td>
      <td className="px-3 py-2.5 align-middle">
        <StateChip tone={c.kind === "customer" ? "hara" : "neel"}>{t.kind[c.kind]}</StateChip>
      </td>
      <td className="px-3 py-2.5 align-middle">
        {c.ownerName ? (
          <span className="block truncate text-fg">{c.ownerName}</span>
        ) : (
          <span className={cn("block truncate", c.kind === "lead" ? "font-semibold text-amber-700" : "text-fg-subtle")}>{t.actions.unassigned}</span>
        )}
      </td>
      <td className="px-3 py-2.5 align-middle">
        {next ? (
          <>
            <span
              className={cn(
                "num block truncate font-semibold",
                c.followUp === "overdue" ? "text-laal-700" : c.followUp === "due" ? "text-amber-700" : "text-fg",
              )}
            >
              {next}
              {c.followUp === "overdue" ? ` · ${t.followUp.overdue}` : c.followUp === "due" ? ` · ${t.followUp.due}` : ""}
            </span>
            {c.nextActionNote ? <span className="block truncate text-caption text-fg-subtle">{c.nextActionNote}</span> : null}
          </>
        ) : (
          <span className="text-fg-subtle">{t.list.none}</span>
        )}
      </td>
      <td className="num px-3 py-2.5 align-middle text-fg-subtle">{last ?? t.list.nothingYet}</td>
      <td className="px-2 py-2.5 align-middle">
        {c.phone ? (
          <a href={`tel:${c.phone}`} aria-label={`${t.actions.call} ${c.fullName}`} className={buttonVariants({ variant: "ghost", size: "icon" })}>
            <Phone aria-hidden="true" />
          </a>
        ) : null}
      </td>
    </tr>
  );
}
