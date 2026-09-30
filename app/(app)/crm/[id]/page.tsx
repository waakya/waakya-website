import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, Phone, MessageCircle, UserX } from "lucide-react";

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
import { PageHeader, Section } from "@/components/waakya/page";
import { Ledger } from "@/components/waakya/ledger";
import { ChangeLine } from "@/components/waakya/change-line";
import { StateWord } from "@/components/waakya/state-word";
import { Ticks } from "@/components/waakya/ticks";
import { ticksFor } from "@/lib/tasks/state-machine";
import { buttonVariants } from "@/components/ui/button";
import { StateChip } from "@/components/ui/state-chip";
import { ContactActions, OwnerSelect } from "./contact-actions";
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
        {/* Current state, in one band: what they are to you, who owns them, what is next. */}
        <div className="mt-4 flex flex-col gap-3 border-y border-line py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
            <StateWord tone={contact.kind === "customer" ? "done" : "go"} className="text-body">{t.kind[contact.kind]}</StateWord>
            {viewerCan(viewer, "crm.assign") ? (
              <OwnerSelect locale={shell.locale} contactId={contact.id} ownerId={contact.ownerId} people={people} />
            ) : contact.ownerName ? (
              <span className="text-body-sm text-fg-muted">{t.fields.owner}: <span className="font-semibold text-fg">{contact.ownerName}</span></span>
            ) : (
              <StateChip tone="amber" icon={<UserX />}>{t.actions.unassigned}</StateChip>
            )}
            <span className="num text-body-sm text-fg-muted">
              {t.fields.nextAction}:{" "}
              {contact.nextActionAt ? (
                <span className={contact.followUp === "overdue" ? "font-semibold text-laal-700" : contact.followUp === "due" ? "font-semibold text-amber-700" : "font-semibold text-fg"}>
                  {formatIndianDate(contact.nextActionAt, shell.locale)} {formatTime(contact.nextActionAt)}
                  {contact.nextActionNote ? ` · ${contact.nextActionNote}` : ""}
                </span>
              ) : (
                <span className="text-fg-subtle">{t.followUp.none}</span>
              )}
            </span>
          </div>
        </div>

        <div className="mt-4">
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

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-12">
          <div className="min-w-0">
            <Section title={t.deal.title}>
              <DealCard locale={shell.locale} contactId={contact.id} deal={openDeal} closed={contact.opportunities.filter((o) => o.status !== "open")} stages={pipeline.stages} canWrite={viewerCan(viewer, "crm.write")} />
            </Section>

            <Section title={t.related.tasks} count={contact.tasks.length}>
              {contact.tasks.length === 0 ? (
                <p className="text-body-sm text-fg-subtle">{t.related.noTasks}</p>
              ) : (
                <ul className="border-y border-line">
                  {contact.tasks.map((task) => {
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

            <Section title={t.activity.title} count={contact.activities.length}>
              {contact.activities.length === 0 ? (
                <p className="text-body-sm text-fg-subtle">{t.activity.empty}</p>
              ) : (
                <ChangeLine
                  label={t.activity.title}
                  items={contact.activities.map((a) => ({
                    id: a.id,
                    mark: a.actorKind === "customer" ? "customer" : a.taskId ? "moved" : "proof",
                    text: (
                      <>
                        <span className="font-semibold">{t.activity.kinds[a.kind as keyof typeof t.activity.kinds] ?? a.kind}</span>
                        {a.body ? <> · {a.taskId ? <Link href={`/kaam/${a.taskId}`} className="text-neel-700 hover:underline">{a.body}</Link> : a.body}</> : null}
                      </>
                    ),
                    meta: `${a.actorName ?? (a.actorKind === "integration" ? t.sources.website : a.actorKind === "customer" ? t.kind.customer : d.org.roles.member)} · ${formatIndianDate(a.occurredAt, shell.locale)} ${formatTime(a.occurredAt)}`,
                  }))}
                />
              )}
            </Section>
          </div>

          <aside aria-label={contact.fullName}>
            <Ledger
              rows={[
                { key: "phone", label: t.fields.phone, value: contact.phone ?? "—", empty: !contact.phone },
                { key: "email", label: t.fields.email, value: <span className="break-all">{contact.email ?? "—"}</span>, empty: !contact.email },
                { key: "company", label: t.fields.company, value: contact.companyName ?? "—", empty: !contact.companyName },
                { key: "source", label: t.fields.source, value: contact.source ? (t.sources[contact.source as keyof typeof t.sources] ?? contact.source) : "—", empty: !contact.source },
                ...(contact.projectName
                  ? [{ key: "project", label: t.fields.project, value: <Link href={`/projects/${contact.projectId}`} className="font-semibold text-neel-700 hover:underline">{contact.projectName}</Link> }]
                  : []),
                { key: "notes", label: t.fields.notes, value: contact.notes ?? "—", empty: !contact.notes },
              ]}
            />
          </aside>
        </div>
      </main>
    </AppShell>
  );
}
