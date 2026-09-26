import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, Phone, MessageCircle } from "lucide-react";

import { requireModule, viewerCan } from "@/lib/auth/session";
import { shellFor } from "@/lib/auth/shell";
import { getCrm } from "@/lib/i18n/crm";
import { getDictionary } from "@/lib/i18n";
import { getContact, getPipeline } from "@/lib/crm/queries";
import { getOrgMembers } from "@/lib/org/members";
import { formatIndianDate } from "@/lib/tasks/format-date";
import { formatTime } from "@/lib/tasks/time";
import { stateWord } from "@/lib/tasks/present";
import { AppShell } from "@/components/waakya/app-shell";
import { ListSurface, PageHeader, Section } from "@/components/waakya/page";
import { buttonVariants } from "@/components/ui/button";
import { StateChip } from "@/components/ui/state-chip";
import { ContactChips } from "../contact-chips";
import { ContactActions } from "./contact-actions";
import { DealCard } from "./deal-card";

export const metadata: Metadata = { title: "Customer" };

/**
 * One person, everything about them: how to reach them, who owns them, what
 * the deal is, what happened, what work is running for them, what is next.
 */
export default async function ContactPage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await requireModule("crm");
  const { id } = await params;
  const shell = await shellFor(viewer);
  const t = getCrm(shell.locale);
  const d = getDictionary(shell.locale);
  const [contact, pipeline, members] = await Promise.all([
    getContact(viewer.org.id, id),
    getPipeline(viewer.org.id),
    getOrgMembers(viewer.org.id),
  ]);
  if (!contact) notFound();
  const openDeal = contact.opportunities.find((o) => o.status === "open") ?? null;
  const people = members.map((m) => ({ id: m.userId, name: m.name }));

  return (
    <AppShell {...shell} width="list">
      <main className="flex-1 p-4 pb-28 lg:px-0 lg:pb-10">
        <PageHeader
          back={{ href: "/crm", label: t.title }}
          title={contact.fullName}
          description={[contact.companyName, contact.source ? t.sources[contact.source as keyof typeof t.sources] ?? contact.source : null].filter(Boolean).join(" · ") || undefined}
          actions={
            <>
              {contact.phone ? (
                <a href={`tel:${contact.phone}`} className={buttonVariants({ variant: "primary", size: "owner" })}>
                  <Phone aria-hidden="true" />
                  {t.actions.call}
                </a>
              ) : null}
              {contact.phone && !contact.whatsappOptOut ? (
                <a href={`https://wa.me/${contact.phone.replace("+", "")}`} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "outline", size: "owner" })}>
                  <MessageCircle aria-hidden="true" />
                  {t.actions.whatsapp}
                </a>
              ) : null}
              {contact.email && !contact.emailOptOut ? (
                <a href={`mailto:${contact.email}`} className={buttonVariants({ variant: "outline", size: "icon" })} aria-label={t.fields.email}>
                  <Mail aria-hidden="true" />
                </a>
              ) : null}
            </>
          }
        />
        <div className="mt-3">
          <ContactChips locale={shell.locale} contact={contact} />
        </div>
        <dl className="num mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-body-sm">
          {contact.phone ? (<><dt className="text-fg-subtle">{t.fields.phone}</dt><dd className="text-fg">{contact.phone}</dd></>) : null}
          {contact.email ? (<><dt className="text-fg-subtle">{t.fields.email}</dt><dd className="break-all text-fg">{contact.email}</dd></>) : null}
          <dt className="text-fg-subtle">{t.fields.owner}</dt>
          <dd className="text-fg">{contact.ownerName ?? t.actions.unassigned}</dd>
          <dt className="text-fg-subtle">{t.fields.nextAction}</dt>
          <dd className="text-fg">
            {contact.nextActionAt
              ? `${formatIndianDate(contact.nextActionAt, shell.locale)} ${formatTime(contact.nextActionAt)}${contact.nextActionNote ? ` · ${contact.nextActionNote}` : ""}`
              : t.followUp.none}
          </dd>
          {contact.projectName ? (
            <><dt className="text-fg-subtle">{t.fields.project}</dt><dd><Link href={`/projects/${contact.projectId}`} className="font-semibold text-neel-700">{contact.projectName}</Link></dd></>
          ) : null}
          {contact.notes ? (<><dt className="text-fg-subtle">{t.fields.notes}</dt><dd className="whitespace-pre-wrap text-fg">{contact.notes}</dd></>) : null}
        </dl>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
          <div className="min-w-0">
            <Section title={t.deal.title}>
              <DealCard locale={shell.locale} contactId={contact.id} deal={openDeal} closed={contact.opportunities.filter((o) => o.status !== "open")} stages={pipeline.stages} canWrite={viewerCan(viewer, "crm.write")} />
            </Section>

            <Section title={t.related.tasks} count={contact.tasks.length}>
              {contact.tasks.length === 0 ? (
                <p className="text-body-sm text-fg-subtle">{t.related.noTasks}</p>
              ) : (
                <ListSurface>
                  {contact.tasks.map((task) => (
                    <li key={task.id} className="flex items-center gap-3 px-4 py-3">
                      <Link href={`/kaam/${task.id}`} className="min-w-0 flex-1 truncate text-body font-semibold text-fg">{task.title}</Link>
                      <span className="num text-caption text-fg-subtle">{task.assigneeName}</span>
                      <StateChip tone="outline">{stateWord(task.state, shell.locale)}</StateChip>
                    </li>
                  ))}
                </ListSurface>
              )}
            </Section>

            <Section title={t.activity.title} count={contact.activities.length}>
              {contact.activities.length === 0 ? (
                <p className="text-body-sm text-fg-subtle">{t.activity.empty}</p>
              ) : (
                <ol className="divide-y divide-line rounded-card border border-line bg-surface">
                  {contact.activities.map((a) => (
                    <li key={a.id} className="px-4 py-3">
                      <p className="text-body text-fg">
                        <span className="font-semibold">{t.activity.kinds[a.kind as keyof typeof t.activity.kinds] ?? a.kind}</span>
                        {a.body ? <> · {a.taskId ? <Link href={`/kaam/${a.taskId}`} className="text-neel-700">{a.body}</Link> : a.body}</> : null}
                      </p>
                      <p className="num mt-0.5 text-caption text-fg-subtle">
                        {a.actorName ?? (a.actorKind === "integration" ? t.sources.website : a.actorKind === "customer" ? t.kind.customer : d.org.roles.member)} · {formatIndianDate(a.occurredAt, shell.locale)} {formatTime(a.occurredAt)}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </Section>
          </div>

          <ContactActions
            locale={shell.locale}
            contact={{
              id: contact.id,
              kind: contact.kind,
              ownerId: contact.ownerId,
              archived: !!contact.archivedAt,
              nextActionAt: contact.nextActionAt,
              nextActionNote: contact.nextActionNote,
              fullName: contact.fullName,
              emailOptOut: contact.emailOptOut,
              whatsappOptOut: contact.whatsappOptOut,
            }}
            people={people}
            selfId={viewer.userId}
            canAssign={viewerCan(viewer, "crm.assign")}
            canWrite={viewerCan(viewer, "crm.write")}
            openDealId={openDeal?.id ?? null}
            presetLabels={{ one_hour: d.create.oneHour, today_evening: d.create.todayEvening, tomorrow_morning: d.create.tomorrowMorning }}
          />
        </div>
      </main>
    </AppShell>
  );
}
