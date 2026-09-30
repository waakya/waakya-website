"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Archive, ArchiveRestore, CalendarClock, PhoneCall, SquareCheckBig, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
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

type Panel = "log" | "task" | "follow" | "more" | null;

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

  const panelTitle = panel === "log" ? t.actions.logCall : panel === "follow" ? t.actions.setFollowUp : panel === "task" ? t.actions.createTask : panel === "more" ? t.actions.preferences : "";

  // Visual V2: the record is read first; what can be done with it is one
  // bar, and each action's small form opens in a drawer (a sheet on a phone).
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {canWrite ? (
          <>
            <Button variant="outline" onClick={() => setPanel("log")}>
              <PhoneCall aria-hidden="true" />
              {t.actions.logCall}
            </Button>
            <Button variant="outline" onClick={() => setPanel("follow")}>
              <CalendarClock aria-hidden="true" />
              {t.actions.setFollowUp}
            </Button>
            <Button variant="outline" onClick={() => setPanel("task")}>
              <SquareCheckBig aria-hidden="true" />
              {t.actions.createTask}
            </Button>
          </>
        ) : null}
        {canWrite && contact.kind === "lead" ? (
          <Button variant="verb" disabled={pending} onClick={() => run(() => convertToCustomer(contact.id))}>
            {t.actions.convert}
          </Button>
        ) : null}
        {!canAssign && !contact.ownerId && canWrite ? (
          <Button variant="verb" disabled={pending} onClick={() => run(() => assignContact({ id: contact.id, ownerId: selfId }))}>
            {t.actions.assignToMe}
          </Button>
        ) : null}
        {canWrite || canAssign ? (
          <Button variant="verb" className="text-fg-muted decoration-paper-300 hover:text-fg" onClick={() => setPanel("more")}>
            {t.actions.preferences}
          </Button>
        ) : null}
      </div>

      <Sheet open={panel !== null} onOpenChange={(open) => (open ? null : setPanel(null))}>
        <SheetContent side="drawer" aria-describedby={undefined}>
          <SheetTitle>{panelTitle}</SheetTitle>
          <div className="mt-4">
            {panel === "log" ? (
              <form
                className="flex flex-col gap-3"
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
                <textarea aria-label={t.activity.noteHint} placeholder={t.activity.noteHint} rows={4} maxLength={4000} className={TEXTAREA} value={body} onChange={(e) => setBody(e.target.value)} required />
                <div className="flex gap-2">
                  <Button type="submit" disabled={pending || body.trim().length === 0}>{t.actions.save}</Button>
                  <Button type="button" variant="outline" onClick={() => setPanel(null)}>{t.actions.cancel}</Button>
                </div>
              </form>
            ) : panel === "follow" ? (
              <form
                className="flex flex-col gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  run(() => setFollowUp({ contactId: contact.id, at: followAt ? new Date(followAt).toISOString() : null, note: followNote }));
                }}
              >
                <div>
                  <Label htmlFor="follow-at">{t.fields.nextActionWhen}</Label>
                  <Input id="follow-at" className="mt-1" type="datetime-local" value={followAt} onChange={(e) => setFollowAt(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="follow-note">{t.fields.nextAction}</Label>
                  <Input id="follow-note" className="mt-1" value={followNote} maxLength={200} onChange={(e) => setFollowNote(e.target.value)} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={pending}>{t.actions.save}</Button>
                  {contact.nextActionAt ? (
                    <Button type="button" variant="ghost" disabled={pending} onClick={() => run(() => setFollowUp({ contactId: contact.id, at: null }))}>
                      {t.actions.clearFollowUp}
                    </Button>
                  ) : null}
                </div>
              </form>
            ) : panel === "task" ? (
              <form
                className="flex flex-col gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  run(() => createTaskForContact({ contactId: contact.id, assigneeId: assignee, title: taskTitle, preset, opportunityId: openDealId ?? undefined }), () => setTaskTitle(""));
                }}
              >
                <div>
                  <Label htmlFor="task-title">{t.related.taskFor(contact.fullName)}</Label>
                  <Input id="task-title" className="mt-1" value={taskTitle} maxLength={140} onChange={(e) => setTaskTitle(e.target.value)} required />
                </div>
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
                <Button type="submit" disabled={pending || taskTitle.trim().length < 2}>{t.actions.createTask}</Button>
              </form>
            ) : panel === "more" ? (
              <div className="flex flex-col gap-4">
                {canWrite ? (
                  <div className="flex flex-col gap-1 text-body text-fg">
                    <label className="flex min-h-tap items-center gap-3">
                      <input
                        type="checkbox"
                        checked={emailOptOut}
                        disabled={pending}
                        onChange={(e) => {
                          const next = e.target.checked;
                          setEmailOptOut(next);
                          startTransition(async () => {
                            const result = await setContactOptOut({ contactId: contact.id, channel: "email", optOut: next });
                            if (!result.ok) {
                              setEmailOptOut(!next);
                              toast.error(result.message ?? "");
                            }
                            router.refresh();
                          });
                        }}
                      />
                      {getCampaigns(locale).optOut.email}
                    </label>
                    <label className="flex min-h-tap items-center gap-3">
                      <input
                        type="checkbox"
                        checked={whatsappOptOut}
                        disabled={pending}
                        onChange={(e) => {
                          const next = e.target.checked;
                          setWhatsappOptOut(next);
                          startTransition(async () => {
                            const result = await setContactOptOut({ contactId: contact.id, channel: "whatsapp", optOut: next });
                            if (!result.ok) {
                              setWhatsappOptOut(!next);
                              toast.error(result.message ?? "");
                            }
                            router.refresh();
                          });
                        }}
                      />
                      {getCampaigns(locale).optOut.whatsapp}
                    </label>
                  </div>
                ) : null}
                {canAssign ? (
                  <Button variant="outline" disabled={pending} onClick={() => run(() => archiveContact({ id: contact.id, archived: !contact.archived }))}>
                    {contact.archived ? <ArchiveRestore aria-hidden="true" /> : <Archive aria-hidden="true" />}
                    {contact.archived ? t.actions.restore : t.actions.archive}
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

/** Who owns this customer, changed in place — ownership is the relationship. */
export function OwnerSelect({ locale, contactId, ownerId, people }: { locale: Locale; contactId: string; ownerId: string | null; people: { id: string; name: string }[] }) {
  const t = getCrm(locale);
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  return (
    <label className="flex items-center gap-2 text-body-sm">
      <span className="flex items-center gap-1.5 text-fg-subtle">
        <Users className="size-4" aria-hidden="true" />
        {t.fields.owner}
      </span>
      <select
        className={`h-10 rounded-button border-2 border-paper-200 bg-paper-0 px-2 text-body-sm font-semibold outline-none focus:border-neel-600 ${ownerId ? "text-fg" : "text-amber-700"}`}
        value={ownerId ?? ""}
        disabled={pending}
        onChange={(e) =>
          startTransition(async () => {
            const result = await assignContact({ id: contactId, ownerId: e.target.value || null });
            if (!result.ok) toast.error(result.message ?? "");
            router.refresh();
          })
        }
      >
        <option value="">{t.actions.unassigned}</option>
        {people.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
    </label>
  );
}

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
