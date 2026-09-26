"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Archive, ArchiveRestore, Pencil, SquareCheckBig } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getRecords } from "@/lib/i18n/records";
import type { Locale } from "@/lib/i18n";
import { archiveRecord, changeRecordStatus, createTaskForRecord } from "@/lib/records/actions";
import { nextStatuses } from "@/lib/records/schema";
import { RecordForm, type FormRecord, type FormType } from "../record-form";

const SELECT = "h-tap w-full rounded-button border-2 border-paper-200 bg-paper-0 px-3 text-body outline-none focus:border-neel-600";

/** Change the status with a reason, edit the fields, make work, archive. */
export function RecordActions({
  locale,
  type,
  record,
  people,
  projects,
  contacts,
  canWrite,
  canChangeStatus,
  canArchive,
  canSetVisibility,
  presetLabels,
  selfId,
}: {
  locale: Locale;
  type: FormType;
  record: FormRecord & { statusKey: string | null; archived: boolean };
  people: { id: string; name: string }[];
  projects: { id: string; name: string }[];
  contacts: { id: string; name: string }[];
  canWrite: boolean;
  canChangeStatus: boolean;
  canArchive: boolean;
  canSetVisibility: boolean;
  presetLabels: Record<"one_hour" | "today_evening" | "tomorrow_morning", string>;
  selfId: string;
}) {
  const t = getRecords(locale);
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [editing, setEditing] = React.useState(false);
  const [statusKey, setStatusKey] = React.useState("");
  const [note, setNote] = React.useState("");
  const [taskOpen, setTaskOpen] = React.useState(false);
  const [taskTitle, setTaskTitle] = React.useState("");
  const [assignee, setAssignee] = React.useState(record.assigneeId ?? selfId);
  const [preset, setPreset] = React.useState<"one_hour" | "today_evening" | "tomorrow_morning">("today_evening");

  const run = (fn: () => Promise<{ ok: boolean; message?: string }>, after?: () => void) =>
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) {
        toast.error(result.message ?? "");
        return;
      }
      after?.();
      router.refresh();
    });

  if (editing) {
    return (
      <div className="lg:col-span-2">
        <RecordForm locale={locale} type={type} people={people} projects={projects} contacts={contacts} record={record} canSetVisibility={canSetVisibility} onDone={() => setEditing(false)} />
      </div>
    );
  }

  const moves = nextStatuses(type.statuses, record.statusKey);

  return (
    <aside className="flex flex-col gap-3 rounded-card border border-line bg-surface p-3 shadow-card">
      {canChangeStatus && moves.length ? (
        <form
          className="flex flex-col gap-2 rounded-inner bg-paper-50 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!statusKey) return;
            run(() => changeRecordStatus({ id: record.id, statusKey, note }), () => { setStatusKey(""); setNote(""); });
          }}
        >
          <Label htmlFor="rec-status">{t.record.changeStatus}</Label>
          <select id="rec-status" className={SELECT} value={statusKey} onChange={(e) => setStatusKey(e.target.value)}>
            <option value="">—</option>
            {moves.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
          <Label htmlFor="rec-note">{t.record.why}</Label>
          <Input id="rec-note" value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} />
          <Button type="submit" size="sm" disabled={pending || !statusKey}>{t.record.save}</Button>
        </form>
      ) : null}

      {canWrite ? (
        <Button variant="outline" onClick={() => setEditing(true)}>
          <Pencil aria-hidden="true" />
          {t.record.edit}
        </Button>
      ) : null}

      <Button variant={taskOpen ? "secondary" : "outline"} onClick={() => setTaskOpen(!taskOpen)}>
        <SquareCheckBig aria-hidden="true" />
        {t.record.createTask}
      </Button>
      {taskOpen ? (
        <form
          className="flex flex-col gap-2 rounded-inner bg-paper-50 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => createTaskForRecord({ recordId: record.id, assigneeId: assignee, title: taskTitle, preset }), () => { setTaskTitle(""); setTaskOpen(false); });
          }}
        >
          <Label htmlFor="rec-task">{t.record.tasks}</Label>
          <Input id="rec-task" value={taskTitle} maxLength={140} onChange={(e) => setTaskTitle(e.target.value)} required />
          <select aria-label={t.record.assignee} className={SELECT} value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            {people.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select aria-label={presetLabels.today_evening} className={SELECT} value={preset} onChange={(e) => setPreset(e.target.value as typeof preset)}>
            {(["one_hour", "today_evening", "tomorrow_morning"] as const).map((p) => (
              <option key={p} value={p}>{presetLabels[p]}</option>
            ))}
          </select>
          <Button type="submit" size="sm" disabled={pending || taskTitle.trim().length < 2}>{t.record.createTask}</Button>
        </form>
      ) : null}

      {canArchive ? (
        <Button variant="ghost" disabled={pending} onClick={() => run(() => archiveRecord({ id: record.id, archived: !record.archived }))}>
          {record.archived ? <ArchiveRestore aria-hidden="true" /> : <Archive aria-hidden="true" />}
          {record.archived ? t.record.restore : t.record.archive}
        </Button>
      ) : null}
    </aside>
  );
}
