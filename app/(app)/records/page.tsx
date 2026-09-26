import type { Metadata } from "next";
import Link from "next/link";
import { Layers, Settings2 } from "lucide-react";

import { requireModule, viewerCan } from "@/lib/auth/session";
import { shellFor } from "@/lib/auth/shell";
import { getRecords } from "@/lib/i18n/records";
import { listRecordTypes } from "@/lib/records/queries";
import { AppShell } from "@/components/waakya/app-shell";
import { EmptyState, ListSurface, PageHeader } from "@/components/waakya/page";
import { buttonVariants } from "@/components/ui/button";
import { RECORD_TEMPLATES } from "@/lib/records/templates";
import { InstallTemplate } from "./types/install-template";

export const metadata: Metadata = { title: "Records" };

/** The kinds of things this business keeps lists of, each with how many there are. */
export default async function RecordsPage() {
  const viewer = await requireModule("records");
  const shell = await shellFor(viewer);
  const t = getRecords(shell.locale);
  const types = await listRecordTypes(viewer.org.id);
  const manages = viewerCan(viewer, "records.types.manage");

  return (
    <AppShell {...shell} width="list">
      <main className="flex-1 p-4 pb-8 lg:px-0">
        <PageHeader
          title={t.title}
          description={t.subtitle}
          actions={
            manages ? (
              <Link href="/records/types" className={buttonVariants({ variant: "outline", size: "owner" })}>
                <Settings2 aria-hidden="true" />
                {t.types.manage}
              </Link>
            ) : null
          }
        />
        {types.length === 0 ? (
          <EmptyState
            className="mt-6"
            icon={<Layers />}
            title={t.types.empty}
            body={t.types.emptyHelp}
            action={
              manages ? (
                <div className="flex flex-wrap justify-center gap-2">
                  {Object.values(RECORD_TEMPLATES).map((template) => (
                    <InstallTemplate key={template.key} locale={shell.locale} templateKey={template.key} label={template.namePlural} />
                  ))}
                </div>
              ) : null
            }
          />
        ) : (
          <ListSurface className="mt-5" label={t.types.title}>
            {types.map((type) => (
              <li key={type.id}>
                <Link href={`/records/${type.key}`} className="flex min-h-tap items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-paper-50/70">
                  <span className="min-w-0 flex-1">
                    <span className="block text-body font-semibold text-fg">{type.namePlural}</span>
                    {type.description ? <span className="block truncate text-caption text-fg-subtle">{type.description}</span> : null}
                  </span>
                  <span className="num text-body font-semibold text-fg-subtle">{type.count}</span>
                </Link>
              </li>
            ))}
          </ListSurface>
        )}
      </main>
    </AppShell>
  );
}
