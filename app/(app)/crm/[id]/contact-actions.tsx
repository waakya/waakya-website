"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Archive, ArchiveRestore, CalendarClock, MessageSquareText, PhoneCall, SquareCheckBig, UserCheck, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCrm } from "@/lib/i18n/crm";
import type { Locale } from "@/lib/i18n";
import { archiveContact, assignContact, convertToCustomer, createTaskForContact, logActivity, setFollowUp } from "@/lib/crm/actions";
import { setContactOptOut } from "@/lib/campaigns/actions";
import { getCampaigns } from "@/lib/i18n/campaigns";
import { ACTIVITY_KINDS, type LoggableActivity } from "@/lib/crm/model";

const SELECT = "h-tap w-full rounded-button border-2 border-paper-200 bg-paper-0 px-3 text-body outline-none focus:border-neel-600";
const TEXTAREA = "w-full rounded-button border-2 border-paper-200 bg-paper-0 px-3 py-2 text-body outline-none focus:border-neel-600";

type Panel = "log" | "task" | "follow" | null;

/**
 * What a person does with a customer: log what happened, decide what is
 * next, hand them to someone, make work. One panel open at a time, each a
 * small form, nothing hidden behind a menu.
 */
export function ContactActions({
  locale,
  contact,
  people,
  selfId,
  canAssign,
  canWrite,
  openDealId,
  presetLabels,
}: {
  locale: Locale;
  contact: { id: string; kind: "lead" | "customer"; ownerId: string | null; archived: boolean; nextActionAt: string | null; nextActionNote: string | null; fullName: string; emailOptOut?: boolean; whatsappOptOut?: boolean };
  people: { id: string; name: string }[];
  selfId: string;
  canAssign: boolean;
  canWrite: boolean;
  openDealId: string | null;
  presetLabels: Record<"one_hour" | "today_evening" | "tomorrow_morning", string>;
}) {
  const t = getCrm(locale);
  const router = useRouter();
  const [panel, setPanel] = React.useState<Panel>(null);
  const [pending, startTransition] = React.useTransition();
  const [kind, setKind] = React.useState<LoggableActivity>("call");
  const [body, setBody] = React.useState("");
  const [taskTitle, setTaskTitle] = React.useState("");
  const [assignee, setAssignee] = React.useState(contact.ownerId ?? selfId);
  const [preset, setPreset] = React.useState<"one_hour" | "today_evening" | "tomorrow_morning">("today_evening");
  const [followAt, setFollowAt] = React.useState(contact.nextActionAt ? toLocalInput(contact.nextActionAt) : "");
  const [followNote, setFollowNote] = React.useState(contact.nextActionNote ?? "");
  // Consent ticks answer at once and fall back if the server says no.
  const [emailOptOut, setEmailOptOut] = React.useState(!!contact.emailOptOut);
  const [whatsappOptOut, setWhatsappOptOut] = React.useState(!!contact.whatsappOptOut);
  // When the server's answer arrives, it wins (state adjusted during render,
  // the React-sanctioned way to follow a prop).
  const [seen, setSeen] = React.useState({ email: !!contact.emailOptOut, whatsapp: !!contact.whatsappOptOut });
  if (seen.email !== !!contact.emailOptOut || seen.whatsapp !== !!contact.whatsappOptOut) {
    setSeen({ email: !!contact.emailOptOut, whatsapp: !!contact.whatsappOptOut });
    setEmailOptOut(!!contact.emailOptOut);
    setWhatsappOptOut(!!contact.whatsappOptOut);
  }

  const run = (fn: () => Promise<{ ok: boolean; message?: string }>, after?: () => void) =>
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) {
        toast.error(result.message ?? "");
        return;
      }
      after?.();
      setPanel(null);
      router.refresh();
    });

  return (
    <aside className="flex flex-col gap-2 rounded-card border border-line bg-surface p-3 shadow-card" aria-label={t.actions.save}>
      {canWrite ? (
        <>
          <Button variant={panel === "log" ? "secondary" : "outline"} onClick={() => setPanel(panel === "log" ? null : "log")}>
            <PhoneCall aria-hidden="true" />
            {t.actions.logCall}
          </Button>
          {panel === "log" ? (
            <form
              className="flex flex-col gap-2 rounded-inner bg-paper-50 p-3"
              onSubmit={(e) => {
                e.preventDefault();
                run(() => logActivity({ contactId: contact.id, kind, body, opportunityId: openDealId ?? undefined }), () => setBody(""));
              }}
            >
              <select aria-label={t.activity.title} className={SELECT} value={kind} onChange={(e) => setKind(e.target.value as LoggableActivity)}>
                {ACTIVITY_KINDS.map((k) => (
                  <option key={k} value={k}>{t.activity.kinds[k]}</option>
                ))}
              </select>
              <textarea aria-label={t.activity.noteHint} placeholder={t.activity.noteHint} rows={3} maxLength={4000} className={TEXTAREA} value={body} onChange={(e) => setBody(e.target.value)} required />
              <Button type="submit" size="sm" disabled={pending || body.trim().length === 0}>{t.actions.save}</Button>
            </form>
          ) : null}

          <Button variant={panel === "follow" ? "secondary" : "outline"} onClick={() => setPanel(panel === "follow" ? null : "follow")}>
            <CalendarClock aria-hidden="true" />
            {t.actions.setFollowUp}
          </Button>
          {panel === "follow" ? (
            <form
              className="flex flex-col gap-2 rounded-inner bg-paper-50 p-3"
              onSubmit={(e) => {
                e.preventDefault();
                run(() => setFollowUp({ contactId: contact.id, at: followAt ? new Date(followAt).toISOString() : null, note: followNote }));
              }}
            >
              <Label htmlFor="follow-at">{t.fields.nextActionWhen}</Label>
              <Input id="follow-at" type="datetime-local" value={followAt} onChange={(e) => setFollowAt(e.target.value)} />
              <Label htmlFor="follow-note">{t.fields.nextAction}</Label>
              <Input id="follow-note" value={followNote} maxLength={200} onChange={(e) => setFollowNote(e.target.value)} />
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={pending}>{t.actions.save}</Button>
                {contact.nextActionAt ? (
                  <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => run(() => setFollowUp({ contactId: contact.id, at: null }))}>
                    {t.actions.clearFollowUp}
                  </Button>
                ) : null}
              </div>
            </form>
          ) : null}

          <Button variant={panel === "task" ? "secondary" : "outline"} onClick={() => setPanel(panel === "task" ? null : "task")}>
            <SquareCheckBig aria-hidden="true" />
            {t.actions.createTask}
          </Button>
          {panel === "task" ? (
            <form
              className="flex flex-col gap-2 rounded-inner bg-paper-50 p-3"
              onSubmit={(e) => {
                e.preventDefault();
                run(() => createTaskForContact({ contactId: contact.id, assigneeId: assignee, title: taskTitle, preset, opportunityId: openDealId ?? undefined }), () => setTaskTitle(""));
              }}
            >
              <Label htmlFor="task-title">{t.related.taskFor(contact.fullName)}</Label>
              <Input id="task-title" value={taskTitle} maxLength={140} onChange={(e) => setTaskTitle(e.target.value)} required />
              <select aria-label={t.fields.owner} className={SELECT} value={assignee} onChange={(e) => setAssignee(e.target.value)}>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <select aria-label={t.fields.nextActionWhen} className={SELECT} value={preset} onChange={(e) => setPreset(e.target.value as typeof preset)}>
                {(["one_hour", "today_evening", "tomorrow_morning"] as const).map((p) => (
                  <option key={p} value={p}>{presetLabels[p]}</option>
                ))}
              </select>
              <Button type="submit" size="sm" disabled={pending || taskTitle.trim().length < 2}>{t.actions.createTask}</Button>
            </form>
          ) : null}
        </>
      ) : null}

      {canAssign ? (
        <div className="rounded-inner bg-paper-50 p-3">
          <Label htmlFor="owner-select" className="flex items-center gap-1.5"><Users className="size-4" aria-hidden="true" />{t.fields.owner}</Label>
          <select
            id="owner-select"
            className={`mt-1 ${SELECT}`}
            value={contact.ownerId ?? ""}
            disabled={pending}
            onChange={(e) => run(() => assignContact({ id: contact.id, ownerId: e.target.value || null }))}
          >
            <option value="">{t.actions.unassigned}</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      ) : !contact.ownerId && canWrite ? (
        <Button variant="outline" disabled={pending} onClick={() => run(() => assignContact({ id: contact.id, ownerId: selfId }))}>
          <UserCheck aria-hidden="true" />
          {t.actions.assignToMe}
        </Button>
      ) : null}

      {canWrite && contact.kind === "lead" ? (
        <Button variant="outline" disabled={pending} onClick={() => run(() => convertToCustomer(contact.id))}>
          <UserCheck aria-hidden="true" />
          {t.actions.convert}
        </Button>
      ) : null}

      {canWrite ? (
        <div className="flex flex-col gap-1 rounded-inner bg-paper-50 p-3 text-body-sm text-fg">
          <label className="flex min-h-9 items-center gap-2">
            <input
              type="checkbox"
              checked={emailOptOut}
              disabled={pending}
              onChange={(e) => {
                const next = e.target.checked;
                setEmailOptOut(next);
                run(async () => {
                  const result = await setContactOptOut({ contactId: contact.id, channel: "email", optOut: next });
                  if (!result.ok) setEmailOptOut(!next);
                  return result;
                });
              }}
            />
            {getCampaigns(locale).optOut.email}
          </label>
          <label className="flex min-h-9 items-center gap-2">
            <input
              type="checkbox"
              checked={whatsappOptOut}
              disabled={pending}
              onChange={(e) => {
                const next = e.target.checked;
                setWhatsappOptOut(next);
                run(async () => {
                  const result = await setContactOptOut({ contactId: contact.id, channel: "whatsapp", optOut: next });
                  if (!result.ok) setWhatsappOptOut(!next);
                  return result;
                });
              }}
            />
            {getCampaigns(locale).optOut.whatsapp}
          </label>
        </div>
      ) : null}

      {canAssign ? (
        <Button variant="ghost" disabled={pending} onClick={() => run(() => archiveContact({ id: contact.id, archived: !contact.archived }))}>
          {contact.archived ? <ArchiveRestore aria-hidden="true" /> : <Archive aria-hidden="true" />}
          {contact.archived ? t.actions.restore : t.actions.archive}
        </Button>
      ) : null}
      <span className="sr-only"><MessageSquareText aria-hidden="true" /></span>
    </aside>
  );
}

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
