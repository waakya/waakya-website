"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Copy, Plus, Trash2, UserPlus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPortal } from "@/lib/i18n/portal";
import type { Locale } from "@/lib/i18n";
import {
  addMilestone,
  cancelDecision,
  grantCustomerAccess,
  markCustomerMessagesRead,
  publishUpdate,
  replyToCustomer,
  requestDecision,
  revokeCustomerAccess,
  setCustomerSummary,
  setCustomerVisibility,
  setProjectCustomer,
  updateMilestone,
} from "@/lib/projects/customer-actions";

const SELECT = "h-tap w-full rounded-button border-2 border-paper-200 bg-paper-0 px-3 text-body outline-none focus:border-neel-600";
const TEXTAREA = "w-full rounded-button border-2 border-paper-200 bg-paper-0 px-3 py-2 text-body outline-none focus:border-neel-600";

function useRun() {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
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
  return { pending, run };
}

export function CustomerControls({
  locale,
  projectId,
  contactId,
  contacts,
  access,
  summary,
  portalOn,
  hasEmail,
}: {
  locale: Locale;
  projectId: string;
  contactId: string | null;
  contacts: { id: string; name: string }[];
  access: { id: string; status: string; token: string; acceptedAt: string | null } | null;
  summary: string;
  portalOn: boolean;
  hasEmail: boolean;
}) {
  const t = getPortal(locale).business;
  const { pending, run } = useRun();
  // The path only: the origin is added when copying, so server and client
  // render the same text.
  const [link, setLink] = React.useState<string | null>(access && access.status !== "revoked" ? `/portal/join/${access.token}` : null);
  const [copied, setCopied] = React.useState(false);
  const [line, setLine] = React.useState(summary);

  return (
    <div className="mt-3 flex flex-col gap-3">
      <div>
        <Label htmlFor="project-customer">{t.setCustomer}</Label>
        <select id="project-customer" className={`mt-1 ${SELECT}`} value={contactId ?? ""} disabled={pending} onChange={(e) => run(() => setProjectCustomer({ projectId, contactId: e.target.value || null }))}>
          <option value="">—</option>
          {contacts.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="project-summary">{t.summary}</Label>
        <div className="mt-1 flex gap-2">
          <Input id="project-summary" value={line} maxLength={240} placeholder={t.summaryHint} onChange={(e) => setLine(e.target.value)} />
          <Button variant="outline" disabled={pending || line === summary} onClick={() => run(() => setCustomerSummary({ projectId, summary: line }))}>{t.save}</Button>
        </div>
      </div>
      {portalOn && contactId ? (
        <div className="rounded-inner bg-paper-50 p-3">
          <p className="text-label font-semibold text-fg-muted">{t.access}</p>
          {access && access.status !== "revoked" ? (
            <>
              <p className="mt-1 text-body-sm text-fg">{access.status === "active" ? t.active : t.invited}</p>
              {link ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <code className="num min-w-0 flex-1 truncate rounded-inner border border-line bg-surface px-2 py-1 text-caption">{link}</code>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={async () => {
                      await navigator.clipboard.writeText(link.startsWith("/") ? `${window.location.origin}${link}` : link).catch(() => null);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                  >
                    {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                    {copied ? t.copied : t.copyLink}
                  </Button>
                </div>
              ) : null}
              <Button size="sm" variant="ghost" className="mt-2" disabled={pending} onClick={() => run(() => revokeCustomerAccess({ accessId: access.id, projectId }), () => setLink(null))}>
                <X aria-hidden="true" />
                {t.revoke}
              </Button>
            </>
          ) : (
            <>
              <p className="mt-1 text-body-sm text-fg-subtle">{hasEmail ? t.noAccess : t.errors.noEmail}</p>
              <Button
                size="sm"
                className="mt-2"
                disabled={pending || !hasEmail}
                onClick={() =>
                  run(async () => {
                    const result = await grantCustomerAccess(projectId);
                    if (result.ok) setLink(new URL(result.data.url).pathname);
                    return result;
                  })
                }
              >
                <UserPlus aria-hidden="true" />
                {t.grantAccess}
              </Button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function MilestoneControls({ locale, projectId, milestone }: { locale: Locale; projectId: string; milestone: { id: string; status: string; customerVisible: boolean } | null }) {
  const t = getPortal(locale).business;
  const { pending, run } = useRun();
  const [name, setName] = React.useState("");
  const [due, setDue] = React.useState("");
  const [visible, setVisible] = React.useState(true);

  if (!milestone) {
    return (
      <form
        className="mt-2 flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => addMilestone({ projectId, name, dueDate: due, customerVisible: visible }), () => { setName(""); setDue(""); });
        }}
      >
        <div className="min-w-40 flex-1">
          <Label htmlFor="ms-name">{t.milestoneName}</Label>
          <Input id="ms-name" className="mt-1 h-10 text-body-sm" value={name} maxLength={120} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="ms-due">{t.dueDate}</Label>
          <Input id="ms-due" type="date" className="mt-1 h-10 text-body-sm" value={due} onChange={(e) => setDue(e.target.value)} />
        </div>
        <label className="flex min-h-10 items-center gap-1 text-label text-fg-subtle">
          <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} />
          {t.visibleToCustomer}
        </label>
        <Button type="submit" size="sm" disabled={pending || name.trim().length === 0}>
          <Plus aria-hidden="true" />
          {t.addMilestone}
        </Button>
      </form>
    );
  }
  return (
    <span className="flex shrink-0 items-center gap-1">
      {milestone.status !== "done" ? (
        <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => updateMilestone({ id: milestone.id, projectId, status: "done" }))}>
          <Check aria-hidden="true" />
          {t.markDone}
        </Button>
      ) : (
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => updateMilestone({ id: milestone.id, projectId, status: "in_progress" }))}>{t.reopen}</Button>
      )}
      <Button size="sm" variant="ghost" aria-label={milestone.customerVisible ? t.internalOnly : t.visibleToCustomer} disabled={pending} onClick={() => run(() => updateMilestone({ id: milestone.id, projectId, customerVisible: !milestone.customerVisible }))}>
        {milestone.customerVisible ? t.internalOnly : t.visibleToCustomer}
      </Button>
      <Button size="icon" variant="ghost" aria-label={t.remove} disabled={pending} onClick={() => run(() => updateMilestone({ id: milestone.id, projectId, remove: true }))}>
        <Trash2 aria-hidden="true" />
      </Button>
    </span>
  );
}

export function UpdateForm({ locale, projectId }: { locale: Locale; projectId: string }) {
  const t = getPortal(locale).business;
  const { pending, run } = useRun();
  const [body, setBody] = React.useState("");
  return (
    <form className="flex flex-col gap-2" onSubmit={(e) => e.preventDefault()}>
      <Label htmlFor="update-body">{t.updateBody}</Label>
      <textarea id="update-body" rows={2} maxLength={2000} className={TEXTAREA} value={body} onChange={(e) => setBody(e.target.value)} />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={pending || body.trim().length === 0} onClick={() => run(() => publishUpdate({ projectId, body, customerVisible: true }), () => setBody(""))}>{t.publish}</Button>
        <Button size="sm" variant="outline" disabled={pending || body.trim().length === 0} onClick={() => run(() => publishUpdate({ projectId, body, customerVisible: false }), () => setBody(""))}>{t.saveInternal}</Button>
      </div>
    </form>
  );
}

export function DecisionControls({
  locale,
  projectId,
  decisionId,
  tasks = [],
  records = [],
}: {
  locale: Locale;
  projectId: string;
  decisionId: string | null;
  tasks?: { id: string; title: string }[];
  records?: { id: string; title: string; statuses: { key: string; label: string }[] }[];
}) {
  const t = getPortal(locale).business;
  const { pending, run } = useRun();
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [detail, setDetail] = React.useState("");
  const [options, setOptions] = React.useState("");
  const [taskId, setTaskId] = React.useState("");
  const [recordId, setRecordId] = React.useState("");
  const [status, setStatus] = React.useState("");
  const record = records.find((r) => r.id === recordId);

  if (decisionId) {
    return (
      <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => cancelDecision({ id: decisionId, projectId }))}>
        <X aria-hidden="true" />
        {t.cancel}
      </Button>
    );
  }
  if (!open) {
    return (
      <Button size="sm" variant="secondary" className="mt-2" onClick={() => setOpen(true)}>
        <Plus aria-hidden="true" />
        {t.askCustomer}
      </Button>
    );
  }
  return (
    <form
      className="mt-2 flex flex-col gap-2 rounded-inner bg-paper-50 p-3"
      onSubmit={(e) => {
        e.preventDefault();
        run(
          () =>
            requestDecision({
              projectId,
              title,
              description: detail,
              options: options.split(",").map((s) => s.trim()).filter(Boolean),
              blocksTaskId: taskId,
              blocksRecordId: recordId,
              unblockRecordStatus: status,
            }),
          () => { setOpen(false); setTitle(""); setDetail(""); setOptions(""); setTaskId(""); setRecordId(""); setStatus(""); },
        );
      }}
    >
      <Label htmlFor="dec-title">{t.decisionTitle}</Label>
      <Input id="dec-title" value={title} maxLength={140} onChange={(e) => setTitle(e.target.value)} required />
      <Label htmlFor="dec-detail">{t.decisionDetail}</Label>
      <Input id="dec-detail" value={detail} maxLength={1000} onChange={(e) => setDetail(e.target.value)} />
      <Label htmlFor="dec-options">{t.options}</Label>
      <Input id="dec-options" value={options} placeholder={t.optionsHint} onChange={(e) => setOptions(e.target.value)} required />
      {tasks.length ? (
        <>
          <Label htmlFor="dec-task">{t.blocksTask}</Label>
          <select id="dec-task" className={SELECT} value={taskId} onChange={(e) => setTaskId(e.target.value)}>
            <option value="">{t.noBlock}</option>
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>{task.title}</option>
            ))}
          </select>
        </>
      ) : null}
      {records.length ? (
        <>
          <Label htmlFor="dec-record">{t.blocksRecord}</Label>
          <select id="dec-record" className={SELECT} value={recordId} onChange={(e) => { setRecordId(e.target.value); setStatus(""); }}>
            <option value="">{t.noBlock}</option>
            {records.map((r) => (
              <option key={r.id} value={r.id}>{r.title}</option>
            ))}
          </select>
          {record ? (
            <>
              <Label htmlFor="dec-status">{t.unblockStatus}</Label>
              <select id="dec-status" className={SELECT} value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">—</option>
                {record.statuses.map((s) => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </>
          ) : null}
        </>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending || !title.trim() || !options.trim()}>{t.request}</Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>{t.cancel}</Button>
      </div>
    </form>
  );
}

export function MessageReply({ locale, projectId, unread }: { locale: Locale; projectId: string; unread: number }) {
  const t = getPortal(locale).business;
  const { pending, run } = useRun();
  const [body, setBody] = React.useState("");
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => replyToCustomer({ projectId, body }), () => setBody(""));
      }}
    >
      <Label htmlFor="reply-body">{t.reply}</Label>
      <textarea id="reply-body" rows={2} maxLength={4000} className={TEXTAREA} value={body} onChange={(e) => setBody(e.target.value)} />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending || body.trim().length === 0}>{t.reply}</Button>
        {unread > 0 ? (
          <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => run(() => markCustomerMessagesRead(projectId))}>{t.markRead}</Button>
        ) : null}
      </div>
    </form>
  );
}

export function VisibilityList({
  locale,
  projectId,
  documents,
  proofs,
}: {
  locale: Locale;
  projectId: string;
  documents: { id: string; name: string; visible: boolean }[];
  proofs: { id: string; taskTitle: string; kind: string; visible: boolean }[];
}) {
  const t = getPortal(locale).business;
  const { pending, run } = useRun();
  if (!documents.length && !proofs.length) return null;
  return (
    <ul className="divide-y divide-line rounded-card border border-line bg-surface">
      {documents.map((d) => (
        <li key={d.id} className="flex min-h-tap items-center gap-3 px-3 py-2">
          <input id={`vis-doc-${d.id}`} type="checkbox" checked={d.visible} disabled={pending} onChange={(e) => run(() => setCustomerVisibility({ kind: "document", id: d.id, visible: e.target.checked, projectId }))} />
          <label htmlFor={`vis-doc-${d.id}`} className="min-w-0 flex-1 truncate text-body-sm text-fg">{d.name}</label>
          <span className="text-caption text-fg-subtle">{t.docVisible}</span>
        </li>
      ))}
      {proofs.map((p) => (
        <li key={p.id} className="flex min-h-tap items-center gap-3 px-3 py-2">
          <input id={`vis-proof-${p.id}`} type="checkbox" checked={p.visible} disabled={pending} onChange={(e) => run(() => setCustomerVisibility({ kind: "proof", id: p.id, visible: e.target.checked, projectId }))} />
          <label htmlFor={`vis-proof-${p.id}`} className="min-w-0 flex-1 truncate text-body-sm text-fg">{p.taskTitle} · {p.kind}</label>
          <span className="text-caption text-fg-subtle">{t.proofVisible}</span>
        </li>
      ))}
    </ul>
  );
}
