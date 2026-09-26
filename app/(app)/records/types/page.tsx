import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireModule, viewerCan } from "@/lib/auth/session";
import { shellFor } from "@/lib/auth/shell";
import { getRecords } from "@/lib/i18n/records";
import { listRecordTypes } from "@/lib/records/queries";
import { RECORD_TEMPLATES } from "@/lib/records/templates";
import { AppShell } from "@/components/waakya/app-shell";
import { PageHeader, Section } from "@/components/waakya/page";
import { InstallTemplate } from "./install-template";
import { TypeEditor } from "./type-editor";

export const metadata: Metadata = { title: "Record types" };

/** Where a business shapes its own lists: templates to start from, and the editor for each type. */
export default async function RecordTypesPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const viewer = await requireModule("records");
  if (!viewerCan(viewer, "records.types.manage")) redirect("/records");
  const shell = await shellFor(viewer);
  const t = getRecords(shell.locale);
  const types = await listRecordTypes(viewer.org.id, true);
  const { edit } = await searchParams;
  const editing = edit ? types.find((x) => x.key === edit) ?? null : null;

  return (
    <AppShell {...shell} width="list">
      <main className="flex-1 p-4 pb-8 lg:px-0">
        <PageHeader back={{ href: "/records", label: t.title }} title={t.types.title} description={t.types.subtitle} />

        <Section title={t.types.templates}>
          <div className="flex flex-wrap gap-2">
            {Object.values(RECORD_TEMPLATES).map((template) => (
              <InstallTemplate
                key={template.key}
                locale={shell.locale}
                templateKey={template.key}
                label={template.namePlural}
                installed={types.some((x) => x.key === template.key && !x.archivedAt)}
              />
            ))}
          </div>
        </Section>

        <Section title={editing ? editing.namePlural : t.types.newType}>
          <TypeEditor
            key={editing?.key ?? "new"}
            locale={shell.locale}
            initial={
              editing
                ? {
                    key: editing.key,
                    name: editing.name,
                    namePlural: editing.namePlural,
                    description: editing.description ?? "",
                    statuses: editing.statuses,
                    defaultStatus: editing.defaultStatus ?? editing.statuses[0]?.key ?? "",
                    customerVisibleDefault: editing.customerVisibleDefault,
                    fields: editing.fields,
                    archived: !!editing.archivedAt,
                  }
                : null
            }
            existing={types.map((x) => ({ key: x.key, name: x.namePlural, archived: !!x.archivedAt }))}
          />
        </Section>
      </main>
    </AppShell>
  );
}
