import Link from "next/link";
import { CheckCircle2, Circle, CircleDot } from "lucide-react";

import { getPortal } from "@/lib/i18n/portal";
import type { Locale } from "@/lib/i18n";
import { getProjectCustomerView, visibilityItems } from "@/lib/projects/customer";
import { formatIndianDate } from "@/lib/tasks/format-date";
import { formatTime } from "@/lib/tasks/time";
import { Section } from "@/components/waakya/page";
import { StateChip } from "@/components/ui/state-chip";
import { CustomerControls, DecisionControls, MilestoneControls, MessageReply, UpdateForm, VisibilityList } from "./customer-panel-client";

/**
 * The business side of the customer's page. Everything the customer will
 * see is made here, on purpose, by a manager: the customer, their door, the
 * milestones, the updates, the decisions asked of them, and their messages.
 */
export async function CustomerPanel({
  locale,
  orgId,
  projectId,
  manages,
  contacts,
  openTasks,
  records,
  portalOn,
}: {
  locale: Locale;
  orgId: string;
  projectId: string;
  manages: boolean;
  contacts: { id: string; name: string }[];
  openTasks: { id: string; title: string }[];
  records: { id: string; title: string; statuses: { key: string; label: string }[] }[];
  portalOn: boolean;
}) {
  const t = getPortal(locale).business;
  const [view, files] = await Promise.all([getProjectCustomerView(orgId, projectId), manages && portalOn ? visibilityItems(orgId, projectId) : Promise.resolve(null)]);
  const open = view.decisions.filter((d) => d.status === "open");
  const closed = view.decisions.filter((d) => d.status !== "open");

  return (
    <div className="flex flex-col gap-6" id="customer">
      <Section title={t.customer}>
        <div className="rounded-card border border-line bg-surface p-4 shadow-card">
          {view.contact ? (
            <p className="text-body font-semibold text-fg">
              <Link href={`/crm/${view.contact.id}`} className="text-neel-700 hover:underline">{view.contact.name}</Link>
              <span className="num block text-caption font-normal text-fg-subtle">{[view.contact.phone, view.contact.email].filter(Boolean).join(" · ")}</span>
            </p>
          ) : (
            <p className="text-body-sm text-fg-subtle">{t.noCustomer}</p>
          )}
          {manages ? (
            <CustomerControls
              locale={locale}
              projectId={projectId}
              contactId={view.contact?.id ?? null}
              contacts={contacts}
              access={view.access ? { id: view.access.id, status: view.access.status, token: view.access.inviteToken, acceptedAt: view.access.acceptedAt } : null}
              summary={view.summary ?? ""}
              portalOn={portalOn}
              hasEmail={!!view.contact?.email}
            />
          ) : view.access ? (
            <p className="mt-2 text-caption text-fg-subtle">{t.access}: {view.access.status === "active" ? t.active : view.access.status === "invited" ? t.invited : t.revoked}</p>
          ) : null}
        </div>
      </Section>

      <Section title={t.milestones} count={view.milestones.length}>
        {view.milestones.length ? (
          <ol className="divide-y divide-line rounded-card border border-line bg-surface">
            {view.milestones.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-2 px-3 py-2">
                {m.status === "done" ? <CheckCircle2 className="size-5 shrink-0 text-hara-600" aria-hidden="true" /> : m.status === "in_progress" ? <CircleDot className="size-5 shrink-0 text-neel-600" aria-hidden="true" /> : <Circle className="size-5 shrink-0 text-fg-subtle" aria-hidden="true" />}
                <span className="min-w-0 flex-1">
                  <span className="block text-body-sm font-semibold text-fg">{m.name}</span>
                  <span className="num block text-caption text-fg-subtle">
                    {m.dueDate ? formatIndianDate(`${m.dueDate}T12:00:00Z`, locale) : ""}{m.dueDate ? " · " : ""}{m.customerVisible ? t.visibleToCustomer : t.internalOnly}
                  </span>
                </span>
                {manages ? <MilestoneControls locale={locale} projectId={projectId} milestone={{ id: m.id, status: m.status, customerVisible: m.customerVisible }} /> : null}
              </li>
            ))}
          </ol>
        ) : null}
        {manages ? <MilestoneControls locale={locale} projectId={projectId} milestone={null} /> : null}
      </Section>

      {portalOn ? (
        <Section title={t.decisions} count={open.length}>
          {open.length ? (
            <ul className="divide-y divide-line rounded-card border border-line bg-surface" id="decisions">
              {open.map((d) => (
                <li key={d.id} className="flex flex-wrap items-center gap-2 px-3 py-2">
                  <span className="min-w-0 flex-1">
                    <span className="block text-body-sm font-semibold text-fg">{d.title}</span>
                    <span className="block text-caption text-fg-subtle">
                      {d.options.map((o) => o.label).join(" / ")}{d.blocksTaskTitle ? ` · ${t.blocksTask}: ${d.blocksTaskTitle}` : ""}
                    </span>
                  </span>
                  <StateChip tone="amber">{t.waiting}</StateChip>
                  {manages ? <DecisionControls locale={locale} projectId={projectId} decisionId={d.id} /> : null}
                </li>
              ))}
            </ul>
          ) : null}
          {closed.length ? (
            <ul className="mt-2 text-caption text-fg-subtle">
              {closed.slice(0, 5).map((d) => (
                <li key={d.id} className="num">
                  {d.title}: {d.status === "decided" ? t.chosen(d.options.find((o) => o.key === d.decidedOptionKey)?.label ?? d.decidedOptionKey ?? "") : t.cancelled}
                  {d.decidedAt ? ` · ${formatIndianDate(d.decidedAt, locale)}` : ""}
                </li>
              ))}
            </ul>
          ) : null}
          {manages ? <DecisionControls locale={locale} projectId={projectId} decisionId={null} tasks={openTasks} records={records} /> : null}
        </Section>
      ) : null}

      <Section title={t.updates} count={view.updates.length}>
        {manages ? <UpdateForm locale={locale} projectId={projectId} /> : null}
        {view.updates.length ? (
          <ol className="mt-3 divide-y divide-line rounded-card border border-line bg-surface">
            {view.updates.map((u) => (
              <li key={u.id} className="px-3 py-2">
                <p className="text-body-sm text-fg">{u.body}</p>
                <p className="num text-caption text-fg-subtle">
                  {u.byName ?? u.actorKind} · {formatIndianDate(u.at, locale)} {formatTime(u.at)} · {u.customerVisible ? t.visibleToCustomer : t.internalOnly}
                </p>
              </li>
            ))}
          </ol>
        ) : null}
      </Section>

      {files && (files.documents.length || files.proofs.length) ? (
        <Section title={t.docVisible}>
          <VisibilityList locale={locale} projectId={projectId} documents={files.documents} proofs={files.proofs} />
        </Section>
      ) : null}

      {portalOn ? (
        <Section title={t.messages} count={view.unreadMessages || undefined}>
          {view.messages.length ? (
            <ol className="mb-3 flex flex-col gap-2">
              {view.messages.slice(-20).map((m) => (
                <li key={m.id} className={m.authorKind === "customer" ? "mr-8 rounded-card bg-neel-50 px-3 py-2" : "ml-8 rounded-card border border-line bg-surface px-3 py-2"}>
                  <p className="text-caption font-semibold text-fg-subtle">{m.authorKind === "customer" ? (view.contact?.name ?? t.customer) : (m.byName ?? "")}{m.unread ? " · new" : ""}</p>
                  <p className="whitespace-pre-wrap text-body-sm text-fg">{m.body}</p>
                  <p className="num text-caption text-fg-subtle">{formatIndianDate(m.at, locale)} {formatTime(m.at)}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mb-2 text-body-sm text-fg-subtle">{t.noMessages}</p>
          )}
          <MessageReply locale={locale} projectId={projectId} unread={view.unreadMessages} />
        </Section>
      ) : null}
    </div>
  );
}
