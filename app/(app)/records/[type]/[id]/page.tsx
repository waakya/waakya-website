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
import { PageHeader, Section } from "@/components/waakya/page";
import { Ledger } from "@/components/waakya/ledger";
import { ChangeLine } from "@/components/waakya/change-line";
import { StateWord, wordTone } from "@/components/waakya/state-word";
import { Ticks } from "@/components/waakya/ticks";
import { ticksFor } from "@/lib/tasks/state-machine";
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

  const tone = wordTone(status?.tone);
  const fieldRows = type.fields.map((f) => {
    const raw = record.values[f.key];
    const empty = raw === null || raw === undefined || raw === "" || (Array.isArray(raw) && raw.length === 0);
    return { key: f.key, label: f.label, value: formatValue(f, raw, words, { names }), empty, field: f };
  });
  // One line that says what this record is — only values that explain
  // themselves without their label: a choice, a quantity with its unit, an
  // amount of money ("3 BHK · 1,420 sq ft · ₹85,00,000"). A bare "A" or "1"
  // would say nothing, so those stay in the ledger below.
  const summary = fieldRows
    .filter((r) => !r.empty && (r.field.fieldType === "money" || r.field.fieldType === "select" || (r.field.fieldType === "number" && r.field.unit)))
    .slice(0, 3);

  return (
    <AppShell {...shell} width="list">
      <main className="flex-1 p-4 pb-10 lg:px-0">
        <PageHeader
          back={{ href: `/records/${type.key}`, label: type.namePlural }}
          title={record.title}
          description={[type.name, record.projectName, record.contactName].filter(Boolean).join(" · ")}
        />

        {/* Current state, then what can be done with it. */}
        <div className="mt-4 flex flex-col gap-4 border-y border-line py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {status ? (
                tone === "exception" ? (
                  <StateChip tone={status.tone}>{status.label}</StateChip>
                ) : (
                  <StateWord tone={tone} className="text-body">{status.label}</StateWord>
                )
              ) : null}
              <span className="text-caption text-fg-subtle">{record.customerVisible ? t.record.customerVisible : t.record.customerHidden}</span>
            </p>
            {summary.length ? (
              <p className="num mt-1.5 text-body text-fg">
                {summary.map((r, i) => (
                  <React.Fragment key={r.key}>
                    {i > 0 ? <span className="text-fg-subtle"> · </span> : null}
                    <span className="font-semibold">{r.value}</span>
                  </React.Fragment>
                ))}
              </p>
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

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
          <div className="min-w-0">
            <Ledger
              emptyLabel={t.record.emptyFields}
              rows={[
                ...fieldRows.map((r) => ({ key: r.key, label: r.label, value: r.value, empty: r.empty })),
                { key: "_assignee", label: t.record.assignee, value: record.assigneeName ?? t.record.none, empty: !record.assigneeName },
                ...(record.projectName
                  ? [{ key: "_project", label: t.record.project, value: <Link href={`/projects/${record.projectId}`} className="font-semibold text-neel-700 hover:underline">{record.projectName}</Link> }]
                  : []),
                ...(record.contactName
                  ? [{ key: "_contact", label: t.record.contact, value: <Link href={`/crm/${record.contactId}`} className="font-semibold text-neel-700 hover:underline">{record.contactName}</Link> }]
                  : []),
              ]}
            />

            <Section title={t.record.tasks} count={record.tasks.length}>
              {record.tasks.length === 0 ? (
                <p className="text-body-sm text-fg-subtle">{t.record.noTasks}</p>
              ) : (
                <ul className="border-y border-line">
                  {record.tasks.map((task) => {
                    const ticks = ticksFor(task.state);
                    return (
                      <li key={task.id} className="border-b border-line last:border-b-0">
                        <Link href={`/kaam/${task.id}`} className="flex min-h-12 items-center gap-3 py-2 hover:bg-paper-100/60">
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-body font-semibold text-fg">{task.title}</span>
                            <span className="num block truncate text-caption text-fg-subtle">{task.assigneeName} · {stateWord(task.state, shell.locale)}</span>
                          </span>
                          {ticks ? <Ticks state={ticks} locale={shell.locale} size={16} /> : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Section>
          </div>

          {history.entries.length ? (
            <section aria-labelledby="rec-history">
              <h2 id="rec-history" className="text-body font-bold text-fg">
                {t.record.history} <span className="num font-normal text-fg-subtle">{history.entries.length}</span>
              </h2>
              <ChangeLine
                className="mt-2"
                label={t.record.history}
                items={history.entries.map((e, i) => ({
                  id: e.id,
                  mark: i === 0 ? "moved" : "waiting",
                  text: e.text,
                  meta: `${e.actor} · ${formatIndianDate(e.at, shell.locale)} ${formatTime(e.at)}`,
                }))}
              />
            </section>
          ) : null}
        </div>
      </main>
    </AppShell>
  );
}
