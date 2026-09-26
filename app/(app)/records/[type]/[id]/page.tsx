import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireModule, viewerCan } from "@/lib/auth/session";
import { shellFor } from "@/lib/auth/shell";
import { getRecords } from "@/lib/i18n/records";
import { getDictionary } from "@/lib/i18n";
import { getRecord, getRecordType, relationChoices, relationNames } from "@/lib/records/queries";
import { formatValue, statusOf } from "@/lib/records/schema";
import { getOrgMembers } from "@/lib/org/members";
import { listHistory } from "@/lib/events/history";
import { stateWord } from "@/lib/tasks/present";
import { formatIndianDate } from "@/lib/tasks/format-date";
import { formatTime } from "@/lib/tasks/time";
import { AppShell } from "@/components/waakya/app-shell";
import { ListSurface, PageHeader, Section } from "@/components/waakya/page";
import { StateChip } from "@/components/ui/state-chip";
import { RecordActions } from "./record-actions";

export const metadata: Metadata = { title: "Record" };

/** One record: every field in words, the status and how to change it, the work on it, its history. */
export default async function RecordPage({ params }: { params: Promise<{ type: string; id: string }> }) {
  const viewer = await requireModule("records");
  const { type: typeKey, id } = await params;
  const shell = await shellFor(viewer);
  const t = getRecords(shell.locale);
  const d = getDictionary(shell.locale);
  const type = await getRecordType(viewer.org.id, typeKey);
  if (!type) notFound();
  const record = await getRecord(viewer.org.id, id);
  if (!record) notFound();
  const [names, members, choices, history] = await Promise.all([
    relationNames(viewer.org.id, type.fields, record.values),
    getOrgMembers(viewer.org.id),
    viewerCan(viewer, "records.write") ? relationChoices(viewer.org.id) : Promise.resolve({ projects: [], contacts: [] }),
    viewerCan(viewer, "audit.read") ? listHistory(viewer.org.id, shell.locale, { before: null, type: null, entityId: record.id }) : Promise.resolve({ entries: [], nextBefore: null }),
  ]);
  const status = statusOf(type.statuses, record.statusKey);
  const words = { yes: t.record.yes, no: t.record.no, none: t.record.none };

  return (
    <AppShell {...shell} width="list">
      <main className="flex-1 p-4 pb-8 lg:px-0">
        <PageHeader
          back={{ href: `/records/${type.key}`, label: type.namePlural }}
          title={record.title}
          description={[type.name, record.projectName, record.contactName].filter(Boolean).join(" · ")}
          actions={status ? <StateChip tone={status.tone}>{status.label}</StateChip> : null}
        />
        <p className="mt-2 text-caption text-fg-subtle">{record.customerVisible ? t.record.customerVisible : t.record.customerHidden}</p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
          <div className="min-w-0">
            <dl className="grid grid-cols-[minmax(8rem,auto)_minmax(0,1fr)] gap-x-4 gap-y-2 rounded-card border border-line bg-surface p-4 text-body-sm shadow-card">
              {type.fields.map((f) => (
                <React.Fragment key={f.key}>
                  <dt className="text-fg-subtle">{f.label}</dt>
                  <dd className="num whitespace-pre-wrap text-fg">{formatValue(f, record.values[f.key], words, { names })}</dd>
                </React.Fragment>
              ))}
              <dt className="text-fg-subtle">{t.record.assignee}</dt>
              <dd className="text-fg">{record.assigneeName ?? t.record.none}</dd>
              {record.projectName ? (<><dt className="text-fg-subtle">{t.record.project}</dt><dd><Link href={`/projects/${record.projectId}`} className="font-semibold text-neel-700">{record.projectName}</Link></dd></>) : null}
              {record.contactName ? (<><dt className="text-fg-subtle">{t.record.contact}</dt><dd><Link href={`/crm/${record.contactId}`} className="font-semibold text-neel-700">{record.contactName}</Link></dd></>) : null}
            </dl>

            <Section title={t.record.tasks} count={record.tasks.length}>
              {record.tasks.length === 0 ? (
                <p className="text-body-sm text-fg-subtle">{t.record.noTasks}</p>
              ) : (
                <ListSurface>
                  {record.tasks.map((task) => (
                    <li key={task.id} className="flex items-center gap-3 px-4 py-3">
                      <Link href={`/kaam/${task.id}`} className="min-w-0 flex-1 truncate text-body font-semibold text-fg">{task.title}</Link>
                      <span className="num text-caption text-fg-subtle">{task.assigneeName}</span>
                      <StateChip tone="outline">{stateWord(task.state, shell.locale)}</StateChip>
                    </li>
                  ))}
                </ListSurface>
              )}
            </Section>

            {history.entries.length ? (
              <Section title={t.record.history} count={history.entries.length}>
                <ol className="divide-y divide-line rounded-card border border-line bg-surface">
                  {history.entries.map((e) => (
                    <li key={e.id} className="px-4 py-3">
                      <p className="text-body text-fg">{e.text}</p>
                      <p className="num mt-0.5 text-caption text-fg-subtle">{e.actor} · {formatIndianDate(e.at, shell.locale)} {formatTime(e.at)}</p>
                    </li>
                  ))}
                </ol>
              </Section>
            ) : null}
          </div>

          <RecordActions
            locale={shell.locale}
            type={{ key: type.key, name: type.name, fields: type.fields, statuses: type.statuses, defaultStatus: type.defaultStatus, customerVisibleDefault: type.customerVisibleDefault }}
            record={{ id: record.id, title: record.title, values: record.values, projectId: record.projectId, contactId: record.contactId, assigneeId: record.assigneeId, customerVisible: record.customerVisible, statusKey: record.statusKey, archived: !!record.archivedAt }}
            people={members.map((m) => ({ id: m.userId, name: m.name }))}
            projects={choices.projects}
            contacts={choices.contacts}
            canWrite={viewerCan(viewer, "records.write") && !type.archivedAt}
            canChangeStatus={viewerCan(viewer, "records.status.change")}
            canArchive={viewerCan(viewer, "tasks.verify")}
            canSetVisibility={viewerCan(viewer, "projects.updates.publish")}
            presetLabels={{ one_hour: d.create.oneHour, today_evening: d.create.todayEvening, tomorrow_morning: d.create.tomorrowMorning }}
            selfId={viewer.userId}
          />
        </div>
      </main>
    </AppShell>
  );
}

