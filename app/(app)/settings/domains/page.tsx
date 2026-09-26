import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireModule, viewerCan } from "@/lib/auth/session";
import { shellFor } from "@/lib/auth/shell";
import { getDomains } from "@/lib/i18n/domains";
import { createClient } from "@/lib/supabase/server";
import { verificationRecord } from "@/lib/domains/hostname";
import { formatIndianDate } from "@/lib/tasks/format-date";
import { formatTime } from "@/lib/tasks/time";
import { AppShell } from "@/components/waakya/app-shell";
import { ListSurface, PageHeader, Section } from "@/components/waakya/page";
import { StateChip } from "@/components/ui/state-chip";
import { AddDomain, DomainControls } from "./domain-controls";

export const metadata: Metadata = { title: "Custom domain" };

/** A hostname, the record that proves it is yours, and where it stands. */
export default async function DomainsPage() {
  const viewer = await requireModule("custom_domains");
  if (!viewerCan(viewer, "domains.manage")) redirect("/settings");
  const shell = await shellFor(viewer);
  const t = getDomains(shell.locale);
  const supabase = await createClient();
  const { data: domains } = await supabase.from("organization_domains").select("id, hostname, status, verification_token, verified_at, last_checked_at, last_error").eq("org_id", viewer.org.id).neq("status", "removed").order("created_at", { ascending: false });
  return (
    <AppShell {...shell} width="list">
      <main className="flex-1 p-4 pb-8 lg:px-0">
        <PageHeader back={{ href: "/settings", label: "Settings" }} title={t.title} description={t.subtitle} />
        <Section title={t.hostname} action={<AddDomain locale={shell.locale} />}>
          {(domains ?? []).length === 0 ? (
            <p className="text-body-sm text-fg-subtle">{t.empty}</p>
          ) : (
            <ListSurface>
              {(domains ?? []).map((d) => {
                const record = verificationRecord(d.hostname, d.verification_token);
                return (
                  <li key={d.id} className="flex flex-col gap-2 px-4 py-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="num min-w-0 flex-1 truncate text-body font-semibold text-fg">{d.hostname}</span>
                      <StateChip tone={d.status === "active" ? "hara" : d.status === "verified" ? "neel" : "amber"}>{t.statuses[d.status as keyof typeof t.statuses] ?? d.status}</StateChip>
                      <DomainControls locale={shell.locale} id={d.id} status={d.status} />
                    </div>
                    {d.status === "pending" ? (
                      <div className="rounded-inner bg-paper-50 p-3 text-caption text-fg">
                        <p className="font-semibold">{t.record}</p>
                        <p className="text-fg-subtle">{t.recordHelp}</p>
                        <dl className="num mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1">
                          <dt className="text-fg-subtle">{t.recordName}</dt><dd className="break-all font-semibold">{record.name}</dd>
                          <dt className="text-fg-subtle">{t.recordValue}</dt><dd className="break-all font-semibold">{record.value}</dd>
                        </dl>
                        {d.last_checked_at ? <p className="num mt-2 text-fg-subtle">{t.checked}: {formatIndianDate(d.last_checked_at, shell.locale)} {formatTime(d.last_checked_at)} · {t.notFound}</p> : null}
                      </div>
                    ) : (
                      <p className="text-caption text-fg-subtle"><span className="font-semibold">{t.attach}:</span> {t.attachHelp}</p>
                    )}
                  </li>
                );
              })}
            </ListSurface>
          )}
        </Section>
      </main>
    </AppShell>
  );
}
