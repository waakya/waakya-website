import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, Circle, CircleDot, FileText } from "lucide-react";

import { getLocale } from "@/lib/i18n/server";
import { getPortal } from "@/lib/i18n/portal";
import { customerProject, requireCustomer } from "@/lib/portal/principal";
import { getPortalProject } from "@/lib/portal/queries";
import { formatIndianDate } from "@/lib/tasks/format-date";
import { formatTime } from "@/lib/tasks/time";
import { Section } from "@/components/waakya/page";
import { DecideForm } from "./decide-form";
import { MessageForm } from "./message-form";

export const metadata: Metadata = { title: "Your project" };

/**
 * The customer's page (V3.5 chapter 6, made real): how far along, the
 * latest thing that happened, what comes next, what needs them, and the
 * photos, papers and list they were shown. Nothing here is hidden by
 * styling; every row passed a customer policy in the database.
 */
export default async function PortalProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const principal = await requireCustomer();
  const { id } = await params;
  if (!customerProject(principal, id)) notFound();
  const locale = await getLocale();
  const t = getPortal(locale).portal;
  const project = await getPortalProject(id, { yes: "Yes", no: "No", none: "—" });
  if (!project) notFound();
  const open = project.decisions.filter((d) => d.status === "open");
  const decided = project.decisions.filter((d) => d.status === "decided");

  return (
    <main className="p-4 pb-10">
      <p className="text-caption font-semibold text-fg-subtle">{t.title}</p>
      <h1 className="text-title-lg font-bold text-fg">{project.name}</h1>
      {project.summary ? <p className="mt-1 text-body text-fg-muted">{project.summary}</p> : null}

      {/* The one glance: how far along, in a number you can read from across
          the room; then the latest thing, the next thing, and whether anything
          waits on them — answered in words before any list begins. */}
      <section className="mt-5 rounded-card border border-line bg-surface p-4 shadow-card sm:p-5" aria-label={t.progress(project.progress)}>
        <div className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-end sm:gap-6">
          <p className="num flex items-baseline gap-2">
            <span className="font-display text-[44px] leading-none font-extrabold text-fg">{project.progress}%</span>
            <span className={project.progress >= 100 ? "text-label font-semibold text-hara-700" : "text-label font-semibold text-fg-subtle"}>
              {project.progress >= 100 ? t.allDone : t.onTrack}
            </span>
          </p>
          <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={project.progress} aria-label={t.progress(project.progress)} className="h-2 overflow-hidden rounded-full bg-paper-200 sm:mb-2">
            <div className={project.progress >= 100 ? "h-full rounded-full bg-hara-600" : "h-full rounded-full bg-neel-600"} style={{ width: `${Math.max(project.progress, 1)}%` }} />
          </div>
        </div>
        <dl className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-2">
          <div>
            <dt className="text-caption font-semibold text-fg-subtle">{t.latestUpdate}</dt>
            <dd className="text-body text-fg">{project.latestUpdate ? project.latestUpdate.body : t.nothingYet}</dd>
            {project.latestUpdate ? <dd className="num text-caption text-fg-subtle">{formatIndianDate(project.latestUpdate.at, locale)}</dd> : null}
          </div>
          <div>
            <dt className="text-caption font-semibold text-fg-subtle">{t.nextMilestone}</dt>
            <dd className="text-body text-fg">{project.nextMilestone ? project.nextMilestone.name : t.allDone}</dd>
            {project.nextMilestone?.dueDate ? <dd className="num text-caption text-fg-subtle">{formatIndianDate(`${project.nextMilestone.dueDate}T12:00:00Z`, locale)}</dd> : null}
          </div>
        </dl>
        <p className={open.length ? "mt-4 border-t border-line pt-3 text-body font-semibold text-neel-700" : "mt-4 border-t border-line pt-3 text-body-sm text-fg-subtle"}>
          {open.length ? <a href="#needs-you">{t.needsYou} · {open.length}</a> : t.nothingNeedsYou}
        </p>
      </section>

      {open.length ? (
        <Section title={t.needsYou} count={open.length} id="needs-you">
          <ul className="flex flex-col gap-3">
            {open.map((d) => (
              <li key={d.id} className="rounded-card border border-line border-l-4 border-l-neel-600 bg-surface p-4 shadow-card">
                <p className="text-body-lg font-bold text-fg">{d.title}</p>
                {d.description ? <p className="mt-1 text-body text-fg-muted">{d.description}</p> : null}
                <DecideForm locale={locale} decision={{ id: d.id, options: d.options }} />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {decided.length ? (
        <Section title={t.yourChoice} count={decided.length}>
          <ul className="divide-y divide-line rounded-card border border-line bg-surface">
            {decided.map((d) => (
              <li key={d.id} className="flex items-center gap-3 px-4 py-3">
                <CheckCircle2 className="size-5 shrink-0 text-hara-600" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block text-body text-fg">{d.title}</span>
                  <span className="block text-caption text-fg-subtle">{t.decided(d.options.find((o) => o.key === d.decidedOptionKey)?.label ?? d.decidedOptionKey ?? "")}{d.decidedAt ? ` · ${formatIndianDate(d.decidedAt, locale)}` : ""}</span>
                </span>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {project.milestones.length ? (
        <Section title={t.milestones} count={project.milestones.length}>
          <ol className="divide-y divide-line rounded-card border border-line bg-surface">
            {project.milestones.map((m) => (
              <li key={m.id} className="flex items-center gap-3 px-4 py-3">
                {m.status === "done" ? <CheckCircle2 className="size-5 shrink-0 text-hara-600" aria-hidden="true" /> : m.status === "in_progress" ? <CircleDot className="size-5 shrink-0 text-neel-600" aria-hidden="true" /> : <Circle className="size-5 shrink-0 text-fg-subtle" aria-hidden="true" />}
                <span className="min-w-0 flex-1 text-body text-fg">{m.name}</span>
                <span className="num text-caption text-fg-subtle">
                  {m.status === "done" ? t.done : m.status === "in_progress" ? t.inProgress : t.planned}
                  {m.dueDate && m.status !== "done" ? ` · ${formatIndianDate(`${m.dueDate}T12:00:00Z`, locale)}` : ""}
                </span>
              </li>
            ))}
          </ol>
        </Section>
      ) : null}

      {project.photos.length ? (
        <Section title={t.photos} count={project.photos.length}>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {project.photos.map((p) =>
              p.url ? (
                <li key={p.id}>
                  <a href={p.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-inner border border-line bg-surface">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt={p.taskTitle ?? t.photos} className="aspect-[4/3] w-full object-cover" loading="lazy" />
                  </a>
                  <p className="num mt-1 truncate text-caption text-fg-subtle">{p.taskTitle ?? ""} · {formatIndianDate(p.at, locale)}</p>
                </li>
              ) : null,
            )}
          </ul>
        </Section>
      ) : null}

      {project.records.map((group) => (
        <Section key={group.typePlural} title={group.typePlural} count={group.items.length}>
          <ul className="divide-y divide-line rounded-card border border-line bg-surface">
            {group.items.map((r) => (
              <li key={r.id} className="px-4 py-3">
                <p className="flex items-center justify-between gap-3 text-body font-semibold text-fg">
                  <span className="truncate">{r.title}</span>
                  {r.status ? <span className="shrink-0 rounded-chip border border-paper-200 px-2 py-0.5 text-caption font-semibold text-ink-700">{r.status}</span> : null}
                </p>
                {r.fields.length ? <p className="num mt-0.5 text-caption text-fg-subtle">{r.fields.map((f) => `${f.label}: ${f.value}`).join(" · ")}</p> : null}
              </li>
            ))}
          </ul>
        </Section>
      ))}

      {project.documents.length ? (
        <Section title={t.documents} count={project.documents.length}>
          <ul className="divide-y divide-line rounded-card border border-line bg-surface">
            {project.documents.map((d) => (
              <li key={d.id}>
                <a href={d.url ?? "#"} target="_blank" rel="noreferrer" className="flex min-h-tap items-center gap-3 px-4 py-3 text-body font-semibold text-neel-700">
                  <FileText className="size-5 shrink-0" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">{d.name}</span>
                  <span className="num text-caption font-normal text-fg-subtle">{formatIndianDate(d.at, locale)}</span>
                </a>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section title={t.updates} count={project.updates.length}>
        {project.updates.length === 0 ? (
          <p className="text-body-sm text-fg-subtle">{t.nothingYet}</p>
        ) : (
          <ol className="divide-y divide-line rounded-card border border-line bg-surface">
            {project.updates.map((u) => (
              <li key={u.id} className="px-4 py-3">
                <p className="text-body text-fg">{u.body}</p>
                <p className="num mt-0.5 text-caption text-fg-subtle">{formatIndianDate(u.at, locale)} {formatTime(u.at)}</p>
              </li>
            ))}
          </ol>
        )}
      </Section>

      <Section title={t.messages} count={project.messages.length} id="messages">
        {project.messages.length ? (
          <ol className="mb-3 flex flex-col gap-2">
            {project.messages.map((m) => (
              <li key={m.id} className={m.authorKind === "customer" ? "ml-8 rounded-card bg-neel-50 px-3 py-2" : "mr-8 rounded-card border border-line bg-surface px-3 py-2"}>
                <p className="text-caption font-semibold text-fg-subtle">{m.authorKind === "customer" ? t.you : t.business}</p>
                <p className="whitespace-pre-wrap text-body text-fg">{m.body}</p>
                <p className="num text-caption text-fg-subtle">{formatIndianDate(m.at, locale)} {formatTime(m.at)}</p>
              </li>
            ))}
          </ol>
        ) : null}
        <MessageForm locale={locale} projectId={project.id} />
      </Section>
    </main>
  );
}
