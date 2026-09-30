"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Pencil, SquareCheckBig } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { getRecords } from "@/lib/i18n/records";
import type { Locale } from "@/lib/i18n";
import { archiveRecord, changeRecordStatus, createTaskForRecord } from "@/lib/records/actions";
import { nextStatuses } from "@/lib/records/schema";
import { cn } from "@/lib/utils";
import { RecordForm, type FormRecord, type FormType } from "../record-form";

const SELECT = "h-tap w-full rounded-button border-2 border-paper-200 bg-paper-0 px-3 text-body outline-none focus:border-neel-600";

type Panel = "status" | "task" | "edit" | null;

/**
 * What can be done with a record, as one bar (Visual V2: action first).
 * The record's current state is the page's heading; moving it on, making
 * work for it and editing it each open a drawer on a desk and a sheet on a
 * phone, so the record itself is never replaced by a form.
 */
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
  const [panel, setPanel] = React.useState<Panel>(null);
  const [statusKey, setStatusKey] = React.useState("");
  const [note, setNote] = React.useState("");
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

  const moves = nextStatuses(type.statuses, record.statusKey);
  const current = type.statuses.find((s) => s.key === record.statusKey);
  const close = () => setPanel(null);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {canChangeStatus && moves.length ? (
          <Button onClick={() => setPanel("status")}>
            {t.record.changeStatus}
            <ArrowRight aria-hidden="true" />
          </Button>
        ) : null}
        <Button variant="outline" onClick={() => setPanel("task")}>
          <SquareCheckBig aria-hidden="true" />
          {t.record.createTask}
        </Button>
        {canWrite ? (
          <Button variant="outline" onClick={() => setPanel("edit")}>
            <Pencil aria-hidden="true" />
            {t.record.edit}
          </Button>
        ) : null}
        {canArchive ? (
          <Button variant="verb" className="text-fg-muted decoration-paper-300 hover:text-fg" disabled={pending} onClick={() => run(() => archiveRecord({ id: record.id, archived: !record.archived }))}>
            {record.archived ? t.record.restore : t.record.archive}
          </Button>
        ) : null}
      </div>

      <Sheet open={panel !== null} onOpenChange={(open) => (open ? null : close())}>
        <SheetContent side="drawer" aria-describedby={undefined}>
          {panel === "status" ? (
            <>
              <SheetTitle>{t.record.changeStatus}</SheetTitle>
              <form
                className="mt-4 flex flex-col gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!statusKey) return;
                  run(() => changeRecordStatus({ id: record.id, statusKey, note }), () => {
                    setStatusKey("");
                    setNote("");
                    close();
                  });
                }}
              >
                {current ? (
                  <p className="text-body text-fg-muted">
                    {t.record.currentStatus}: <span className="font-semibold text-fg">{current.label}</span>
                  </p>
                ) : null}
                <fieldset>
                  <legend className="text-label font-semibold text-ink-700">{t.record.moveTo}</legend>
                  <div className="mt-2 flex flex-col gap-2">
                    {moves.map((s) => (
                      <label
                        key={s.key}
                        className={cn(
                          "flex min-h-tap cursor-pointer items-center gap-3 rounded-button border-2 px-4 text-body font-semibold",
                          statusKey === s.key ? "border-neel-600 bg-neel-50 text-neel-800" : "border-paper-200 bg-paper-0 text-fg",
                        )}
                      >
                        <input type="radio" name="rec-status" value={s.key} checked={statusKey === s.key} onChange={() => setStatusKey(s.key)} className="accent-neel-600" />
                        {s.label}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div>
                  <Label htmlFor="rec-note">{t.record.why}</Label>
                  <Input id="rec-note" className="mt-1" value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={pending || !statusKey}>{t.record.save}</Button>
                  <Button type="button" variant="outline" onClick={close}>{t.record.cancel}</Button>
                </div>
              </form>
            </>
          ) : panel === "task" ? (
            <>
              <SheetTitle>{t.record.createTask}</SheetTitle>
              <form
                className="mt-4 flex flex-col gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  run(() => createTaskForRecord({ recordId: record.id, assigneeId: assignee, title: taskTitle, preset }), () => {
                    setTaskTitle("");
                    close();
                  });
                }}
              >
                <div>
                  <Label htmlFor="rec-task">{t.record.tasks}</Label>
                  <Input id="rec-task" className="mt-1" value={taskTitle} maxLength={140} onChange={(e) => setTaskTitle(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="rec-assignee">{t.record.assignee}</Label>
                  <select id="rec-assignee" className={cn(SELECT, "mt-1")} value={assignee} onChange={(e) => setAssignee(e.target.value)}>
                    {people.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="rec-when">{presetLabels.today_evening}</Label>
                  <select id="rec-when" aria-label={presetLabels.today_evening} className={cn(SELECT, "mt-1")} value={preset} onChange={(e) => setPreset(e.target.value as typeof preset)}>
                    {(["one_hour", "today_evening", "tomorrow_morning"] as const).map((p) => (
                      <option key={p} value={p}>{presetLabels[p]}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={pending || taskTitle.trim().length < 2}>{t.record.createTask}</Button>
                  <Button type="button" variant="outline" onClick={close}>{t.record.cancel}</Button>
                </div>
              </form>
            </>
          ) : panel === "edit" ? (
            <>
              <SheetTitle>{t.record.edit}</SheetTitle>
              <div className="mt-4">
                <RecordForm bare locale={locale} type={type} people={people} projects={projects} contacts={contacts} record={record} canSetVisibility={canSetVisibility} onDone={close} onCancel={close} />
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}
