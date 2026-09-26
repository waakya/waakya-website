import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronDown, FilePlus2, FileText } from "lucide-react";

import { requireOrg, canManage } from "@/lib/auth/session";
import { shellFor } from "@/lib/auth/shell";
import { getPhase1 } from "@/lib/i18n/phase1";
import { getUx } from "@/lib/i18n/ux";
import { getProject, getUnassignedTasks } from "@/lib/projects/queries";
import { listProjectDocuments } from "@/lib/documents/queries";
import { getOrgMembers } from "@/lib/org/members";
import { stateWord } from "@/lib/tasks/present";
import { ticksFor } from "@/lib/tasks/state-machine";
import { getDesign } from "@/lib/i18n/design";
import { getDictionary } from "@/lib/i18n";
import { PageHeader } from "@/components/waakya/page";
import { Ticks } from "@/components/waakya/ticks";
import { StateChip } from "@/components/ui/state-chip";
import { Clock } from "lucide-react";
import { formatIndianDate } from "@/lib/tasks/format-date";
import { formatTime } from "@/lib/tasks/time";
import { AppShell } from "@/components/waakya/app-shell";
import { Avatar } from "@/components/ui/avatar";
import { DocumentList } from "@/components/waakya/document-list";
import { DocumentUploader } from "@/components/waakya/document-uploader";
import { ProjectStatusChip } from "../status-chip";
import { ProjectControls } from "./project-controls";
import { RevealGroup, RevealToggle } from "@/components/waakya/reveal";

export const metadata: Metadata = { title: "Project" };

export default async function ProjectPage({ params }: PageProps<"/projects/[id]">) {
  const { id } = await params;
  const viewer = await requireOrg();
  const project = await getProject(viewer.org.id, id);
  if (!project) notFound();

  const shell = await shellFor(viewer);
  const p = getPhase1(shell.locale);
  const ux = getUx(shell.locale);
  const manages = canManage(viewer.role);

  const [documents, members, unassigned] = await Promise.all([
    listProjectDocuments(viewer.org.id, id),
    manages ? getOrgMembers(viewer.org.id) : Promise.resolve([]),
    manages ? getUnassignedTasks(viewer.org.id) : Promise.resolve([]),
  ]);

  const memberIds = new Set(project.members.map((member) => member.userId));
  const d = getDesign(shell.locale);
  const t = getDictionary(shell.locale);
  const now = new Date();
  // Real progress from the work itself: done or verified out of everything
  // not cancelled. No invented percentages.
  const counted = project.tasks.filter((task) => task.state !== "cancelled");
  const finished = counted.filter((task) => ["done", "verified"].includes(task.state)).length;
  const isLateTask = (task: (typeof project.tasks)[number]) =>
    !!task.dueAt && Date.parse(task.dueAt) < now.getTime() && !["done", "verified", "cancelled"].includes(task.state);
  // What is still moving comes first — late at the top, then by deadline;
  // finished work waits behind one line (V3: current state before history).
  const openTasks = project.tasks
    .filter((task) => !["done", "verified", "cancelled"].includes(task.state))
    .sort((a, b) => {
      const at = a.dueAt ? Date.parse(a.dueAt) : Infinity;
      const bt = b.dueAt ? Date.parse(b.dueAt) : Infinity;
      return Number(isLateTask(b)) - Number(isLateTask(a)) || at - bt;
    });
  const closedTasks = project.tasks.filter((task) => ["done", "verified", "cancelled"].includes(task.state));

  const taskItem = (task: (typeof project.tasks)[number]) => {
    const ticks = ticksFor(task.state);
    const late = isLateTask(task);
    return (
      <li key={task.id}>
        <Link href={`/kaam/${task.id}`} className="flex items-center gap-3 px-3.5 py-3 transition-colors duration-150 hover:bg-paper-50">
          <span className="min-w-0 flex-1">
            <span className="line-clamp-2 text-body-sm font-semibold text-fg">{task.title}</span>
            <span className="num block truncate text-caption text-fg-subtle">
              {task.assigneeName} · {stateWord(task.state, shell.locale)}
              {task.dueAt && !["verified", "cancelled"].includes(task.state)
                ? ` · ${formatIndianDate(task.dueAt, shell.locale)} ${formatTime(task.dueAt)}`
                : ""}
            </span>
          </span>
          {late ? (
            <StateChip tone="laal" icon={<Clock />} className="shrink-0">
              {t.chips.late}
            </StateChip>
          ) : ticks ? (
            <Ticks state={ticks} locale={shell.locale} size={18} />
          ) : null}
        </Link>
      </li>
    );
  };

  return (
    <AppShell {...shell} width="list">
      <main className="flex-1 p-4 pb-8 lg:px-0">
        <PageHeader
          back={{ href: "/projects", label: p.projects.title }}
          title={
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {project.name}
              <ProjectStatusChip locale={shell.locale} status={project.status} />
            </span>
          }
          description={
            <>
              {project.startDate ? `${p.projects.start}: ${formatIndianDate(`${project.startDate}T12:00:00Z`, shell.locale)}` : ""}
              {project.startDate && project.endDate ? " · " : ""}
              {project.endDate ? `${p.projects.end}: ${formatIndianDate(`${project.endDate}T12:00:00Z`, shell.locale)}` : ""}
            </>
          }
        />
        {project.description ? (
          <p className="mt-3 max-w-2xl text-body text-fg-muted">{project.description}</p>
        ) : null}

        {counted.length > 0 ? (
          <div className="mt-4 max-w-md">
            <p className="num flex items-baseline justify-between text-label text-fg-subtle">
              <span className="font-semibold text-fg-muted">{d.today.staffProgress(finished, counted.length)}</span>
              <span>{p.projects.openTasks(project.openTasks)}</span>
            </p>
            <div
              role="progressbar"
              aria-label={d.today.staffProgress(finished, counted.length)}
              aria-valuemin={0}
              aria-valuemax={counted.length}
              aria-valuenow={finished}
              className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-paper-200"
            >
              <div className="h-full rounded-full bg-neel-600" style={{ width: `${(finished / counted.length) * 100}%` }} />
            </div>
          </div>
        ) : null}

        {manages ? (
          // Changing a project is occasional; reading it is daily. The
          // controls wait behind one line.
          <details className="group mt-4">
            <summary className="inline-flex min-h-10 cursor-pointer list-none items-center gap-1.5 text-body-sm font-semibold text-neel-700">
              {d.v3.manageProject}
              <ChevronDown className="size-4 transition-transform duration-150 group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="mt-2">
            <ProjectControls
              locale={shell.locale}
              projectId={project.id}
              status={project.status}
              candidates={members
                .filter((member) => !memberIds.has(member.userId))
                .map((member) => ({ id: member.userId, name: member.name }))}
              tasks={unassigned}
            />
            </div>
          </details>
        ) : null}

        <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col gap-6">
            <section>
              <h2 className="mb-2 text-body font-bold text-fg">{p.projects.tasks}</h2>
              {/* AI/Voice (later): the project summary belongs here, above the
                  work it summarises — not in a side panel. */}
              {project.tasks.length === 0 ? (
                <p className="rounded-card border border-dashed border-paper-300 px-4 py-5 text-center text-body-sm text-ink-500">
                  {p.projects.noTasks}
                </p>
              ) : (
                <>
                  {openTasks.length > 0 ? (
                    <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface shadow-card">
                      {openTasks.map(taskItem)}
                    </ul>
                  ) : null}
                  {closedTasks.length > 0 ? (
                    <details className="group/closed mt-3" open={openTasks.length === 0 || undefined}>
                      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-body-sm font-semibold text-fg-muted">
                        {d.v3.finished}
                        <span className="num font-normal text-fg-subtle">{closedTasks.length}</span>
                        <ChevronDown className="size-4 text-fg-subtle transition-transform duration-150 group-open/closed:rotate-180" aria-hidden="true" />
                      </summary>
                      <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
                        {closedTasks.map(taskItem)}
                      </ul>
                    </details>
                  ) : null}
                </>
              )}
            </section>

            <section>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-body font-bold text-fg">{p.projects.documents}</h2>
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <Link
                    href={`/documents/templates?project=${project.id}`}
                    className="inline-flex h-9 items-center gap-1.5 rounded-button border border-neel-200 bg-paper-0 px-3 text-label font-semibold text-neel-700 hover:bg-neel-50"
                  >
                    <FilePlus2 className="size-4" aria-hidden="true" />
                    {ux.templates.createFromTemplate}
                  </Link>
                  <DocumentUploader locale={shell.locale} projectId={project.id} compact />
                </div>
              </div>
              {documents.length === 0 ? (
                <p className="rounded-card border border-dashed border-paper-300 px-4 py-5 text-center text-body-sm text-ink-500">
                  {p.projects.noDocuments}
                </p>
              ) : (
                <DocumentList
                  locale={shell.locale}
                  documents={documents}
                  viewerId={viewer.userId}
                  manages={manages}
                  showLinks={false}
                />
              )}
            </section>
          </div>

          <div className="flex min-w-0 flex-col gap-6">
            <section>
              <h2 className="mb-2 text-body font-bold text-fg">{p.projects.members}</h2>
              <ul className="flex flex-wrap gap-2">
                {project.members.map((member) => (
                  <li key={member.userId} className="flex max-w-full items-center gap-2 rounded-chip border border-line bg-surface py-1 pr-3 pl-1">
                    <Avatar name={member.name} size={24} />
                    <span className="truncate text-label font-semibold text-fg">{member.name}</span>
                  </li>
                ))}
              </ul>
            </section>

            <RevealGroup as="section" id="project-activity" className="group/activity">
              <h2 className="mb-2 text-body font-bold text-fg">{p.projects.activity}</h2>
              {project.activity.length === 0 ? (
                <p className="text-body-sm text-ink-500">—</p>
              ) : (
                <ol id="project-activity" className="flex flex-col gap-3">
                  {project.activity.map((entry, index) => (
                    <li key={entry.id} className={index < 3 ? "flex gap-2.5" : "hidden gap-2.5 group-data-[open=true]/activity:flex"}>
                      {entry.kind === "document" ? (
                        <FileText aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-fg-subtle" />
                      ) : entry.toState && ticksFor(entry.toState) ? (
                        <span className="mt-0.5 shrink-0">
                          <Ticks state={ticksFor(entry.toState)!} locale={shell.locale} size={16} />
                        </span>
                      ) : (
                        <span aria-hidden="true" className="mt-[7px] size-1.5 shrink-0 rounded-full bg-paper-300" />
                      )}
                      <span className="min-w-0 text-label text-fg-muted">
                        <span className="font-semibold text-fg">{entry.actor}</span>
                        {entry.kind === "task" && entry.toState ? ` · ${stateWord(entry.toState, shell.locale)}` : ""}
                        <span className="block truncate text-fg-muted">{entry.subject}</span>
                        <span className="num block text-caption text-fg-subtle">
                          {formatIndianDate(entry.at, shell.locale)} · {formatTime(entry.at)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>
              )}
              {project.activity.length > 3 ? (
                <RevealToggle className="mt-1 text-label font-semibold text-neel-700" more={d.v3.showAll(project.activity.length)} less={d.v3.showLess} />
              ) : null}
            </RevealGroup>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
