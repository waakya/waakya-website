import Link from "next/link";
import { CheckCircle2, Circle, CircleDot } from "lucide-react";

import { getPortal } from "@/lib/i18n/portal";
import type { Locale } from "@/lib/i18n";
import { getProjectCustomerView, visibilityItems } from "@/lib/projects/customer";
import { formatIndianDate } from "@/lib/tasks/format-date";
import { formatTime } from "@/lib/tasks/time";
import { DrawerAction } from "@/components/waakya/drawer-action";
import { StateWord } from "@/components/waakya/state-word";
import { ChangeLine } from "@/components/waakya/change-line";
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

  const accessWord = view.access?.status === "active" ? t.active : view.access?.status === "invited" ? t.invited : view.access ? t.revoked : t.noAccess;
  const accessTone = view.access?.status === "active" ? "done" : view.access?.status === "invited" ? "wait" : "quiet";

  // Visual V2: the customer side of a project is read first — who, whether
  // they have their page, what is waiting on them, what they said — and
  // changed on purpose, one action at a time, in a drawer.
  return (
    <div className="flex flex-col gap-8" id="customer">
      <section aria-labelledby="cust-h">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="cust-h" className="text-body font-bold text-fg">{t.customer}</h2>
          {manages ? (
            <DrawerAction label={t.access} title={t.customer}>
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
            </DrawerAction>
          ) : null}
        </div>
        <div className="mt-2 border-y border-line py-3">
          {view.contact ? (
            <p className="text-body font-semibold text-fg">
              <Link href={`/crm/${view.contact.id}`} className="text-neel-700 hover:underline">{view.contact.name}</Link>
              <span className="num block text-caption font-normal text-fg-subtle">{[view.contact.phone, view.contact.email].filter(Boolean).join(" · ")}</span>
            </p>
          ) : (
            <p className="text-body-sm text-fg-subtle">{t.noCustomer}</p>
          )}
          {portalOn ? (
            <p className="mt-2 flex flex-wrap items-center gap-x-2 text-caption text-fg-subtle">
              {t.access}: <StateWord tone={accessTone}>{accessWord}</StateWord>
            </p>
          ) : null}
          {view.summary ? <p className="mt-2 text-body-sm text-fg-muted">“{view.summary}”</p> : null}
        </div>
      </section>

      {portalOn && (open.length || manages || closed.length) ? (
        <section aria-labelledby="dec-h" id="decisions">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="dec-h" className="text-body font-bold text-fg">
              {t.decisions} {open.length ? <span className="num font-normal text-fg-subtle">{open.length}</span> : null}
            </h2>
            {manages ? (
              <DrawerAction label={t.askCustomer} title={t.askCustomer}>
                <DecisionControls locale={locale} projectId={projectId} decisionId={null} tasks={openTasks} records={records} startOpen />
              </DrawerAction>
            ) : null}
          </div>
          {open.length ? (
            <ul className="mt-2 border-y border-line">
              {open.map((d) => (
                <li key={d.id} className="relative flex flex-wrap items-center gap-2 border-b border-line py-2 pl-4 last:border-b-0">
                  <span aria-hidden="true" className="absolute top-2.5 bottom-2.5 left-0 w-[3px] rounded-full bg-amber-600" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-body-sm font-semibold text-fg">{d.title}</span>
                    <span className="block text-caption text-fg-subtle">
                      {d.options.map((o) => o.label).join(" / ")}{d.blocksTaskTitle ? ` · ${t.blocksTask}: ${d.blocksTaskTitle}` : ""}
                    </span>
                    <StateWord tone="wait" className="mt-0.5">{t.waiting}</StateWord>
                  </span>
                  {manages ? <DecisionControls locale={locale} projectId={projectId} decisionId={d.id} /> : null}
                </li>
              ))}
            </ul>
          ) : null}
          {closed.length ? (
            <ul className="mt-2">
              {closed.slice(0, 5).map((d) => (
                <li key={d.id} className="num flex items-center gap-2 py-1 text-caption text-fg-subtle">
                  <StateWord tone={d.status === "decided" ? "done" : "quiet"}>
                    {d.title}: {d.status === "decided" ? t.chosen(d.options.find((o) => o.key === d.decidedOptionKey)?.label ?? d.decidedOptionKey ?? "") : t.cancelled}
                  </StateWord>
                  {d.decidedAt ? <span>· {formatIndianDate(d.decidedAt, locale)}</span> : null}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {portalOn ? (
        <section aria-labelledby="msg-h">
          <h2 id="msg-h" className="text-body font-bold text-fg">
            {t.messages} {view.unreadMessages ? <span className="num font-normal text-laal-700">{view.unreadMessages}</span> : null}
          </h2>
          {view.messages.length ? (
            <ol className="mt-2 mb-3 flex flex-col gap-2">
              {view.messages.slice(-6).map((m) => (
                <li key={m.id} className={m.authorKind === "customer" ? "mr-6 rounded-card bg-neel-50 px-3 py-2" : "ml-6 rounded-card border border-line bg-surface px-3 py-2"}>
                  <p className="text-caption font-semibold text-fg-subtle">{m.authorKind === "customer" ? (view.contact?.name ?? t.customer) : (m.byName ?? "")}{m.unread ? " · new" : ""}</p>
                  <p className="whitespace-pre-wrap text-body-sm text-fg">{m.body}</p>
                  <p className="num text-caption text-fg-subtle">{formatIndianDate(m.at, locale)} {formatTime(m.at)}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-2 mb-2 text-body-sm text-fg-subtle">{t.noMessages}</p>
          )}
          {view.messages.length ? <MessageReply locale={locale} projectId={projectId} unread={view.unreadMessages} /> : null}
        </section>
      ) : null}

      <section aria-labelledby="upd-h">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="upd-h" className="text-body font-bold text-fg">
            {t.updates} <span className="num font-normal text-fg-subtle">{view.updates.length}</span>
          </h2>
          {manages ? (
            <DrawerAction label={t.publishUpdate} title={t.publishUpdate}>
              <UpdateForm locale={locale} projectId={projectId} />
            </DrawerAction>
          ) : null}
        </div>
        {view.updates.length ? (
          <ChangeLine
            className="mt-2"
            label={t.updates}
            items={view.updates.slice(0, 6).map((u) => ({
              id: u.id,
              mark: u.customerVisible ? "customer" : "moved",
              text: u.body,
              meta: `${u.byName ?? u.actorKind} · ${formatIndianDate(u.at, locale)} ${formatTime(u.at)} · ${u.customerVisible ? t.visibleToCustomer : t.internalOnly}`,
            }))}
          />
        ) : null}
      </section>

      {files && (files.documents.length || files.proofs.length) ? (
        <section aria-labelledby="vis-h">
          <h2 id="vis-h" className="text-body font-bold text-fg">{t.docVisible}</h2>
          <div className="mt-2">
            <VisibilityList locale={locale} projectId={projectId} documents={files.documents} proofs={files.proofs} />
          </div>
        </section>
      ) : null}
    </div>
  );
}

/** Milestones as the project's spine: done, running, next — with one verb each. */
export async function ProjectMilestones({ locale, orgId, projectId, manages }: { locale: Locale; orgId: string; projectId: string; manages: boolean }) {
  const t = getPortal(locale).business;
  const view = await getProjectCustomerView(orgId, projectId);
  return (
    <section aria-labelledby="ms-h">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="ms-h" className="text-body font-bold text-fg">
          {t.milestones} <span className="num font-normal text-fg-subtle">{view.milestones.length}</span>
        </h2>
        {manages ? (
          <DrawerAction label={t.addMilestone} title={t.addMilestone}>
            <MilestoneControls locale={locale} projectId={projectId} milestone={null} />
          </DrawerAction>
        ) : null}
      </div>
      {view.milestones.length ? (
        <ol className="mt-2 border-y border-line">
          {view.milestones.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line py-2 last:border-b-0">
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-body-sm font-semibold text-fg">
                  {m.status === "done" ? <CheckCircle2 className="size-4 shrink-0 text-hara-600" aria-hidden="true" /> : m.status === "in_progress" ? <CircleDot className="size-4 shrink-0 text-neel-600" aria-hidden="true" /> : <Circle className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />}
                  {m.name}
                </span>
                <span className="num block pl-6 text-caption text-fg-subtle">
                  {m.dueDate ? formatIndianDate(`${m.dueDate}T12:00:00Z`, locale) : ""}{m.dueDate ? " · " : ""}{m.customerVisible ? t.visibleToCustomer : t.internalOnly}
                </span>
              </span>
              {manages ? <MilestoneControls locale={locale} projectId={projectId} milestone={{ id: m.id, status: m.status, customerVisible: m.customerVisible }} /> : null}
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-2 border-y border-line py-3 text-body-sm text-fg-subtle">—</p>
      )}
    </section>
  );
}
