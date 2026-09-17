import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FilePlus2 } from "lucide-react";

import { requireOrg, canManage } from "@/lib/auth/session";
import { shellFor } from "@/lib/auth/shell";
import { getPhase1 } from "@/lib/i18n/phase1";
import { getUx } from "@/lib/i18n/ux";
import { getProject, getUnassignedTasks } from "@/lib/projects/queries";
import { listProjectDocuments } from "@/lib/documents/queries";
import { getOrgMembers } from "@/lib/org/members";
import { stateWord } from "@/lib/tasks/present";
import { formatIndianDate } from "@/lib/tasks/format-date";
import { formatTime } from "@/lib/tasks/time";
import { AppShell } from "@/components/waakya/app-shell";
import { Avatar } from "@/components/ui/avatar";
import { DocumentList } from "@/components/waakya/document-list";
import { DocumentUploader } from "@/components/waakya/document-uploader";
import { ProjectStatusChip } from "../status-chip";
import { ProjectControls } from "./project-controls";

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

  return (
    <AppShell {...shell}>
      <main className="flex-1 p-4 pb-8">
        <Link href="/projects" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-neel-700">
          <ArrowLeft className="size-4" aria-hidden="true" />
          {p.projects.title}
        </Link>

        <div className="mt-3 flex flex-wrap items-start gap-3">
          <h1 className="min-w-0 flex-1 text-[24px] leading-[30px] font-bold text-ink-900">{project.name}</h1>
          <ProjectStatusChip locale={shell.locale} status={project.status} />
        </div>
        {project.description ? (
          <p className="mt-1 max-w-2xl text-[15px] leading-[22px] text-ink-700">{project.description}</p>
        ) : null}
        <p className="num mt-1 text-[13px] text-ink-500">
          {p.projects.openTasks(project.openTasks)}
          {project.startDate ? ` · ${p.projects.start}: ${formatIndianDate(`${project.startDate}T12:00:00Z`, shell.locale)}` : ""}
          {project.endDate ? ` · ${p.projects.end}: ${formatIndianDate(`${project.endDate}T12:00:00Z`, shell.locale)}` : ""}
        </p>

        {manages ? (
          <div className="mt-4">
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
        ) : null}

        <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col gap-6">
            <section>
              <h2 className="mb-2 text-[13px] font-semibold text-ink-700">{p.projects.tasks}</h2>
              {project.tasks.length === 0 ? (
                <p className="rounded-card border border-dashed border-paper-300 px-4 py-5 text-center text-[14px] text-ink-500">
                  {p.projects.noTasks}
                </p>
              ) : (
                <ul className="overflow-hidden rounded-card border border-paper-200 bg-paper-0">
                  {project.tasks.map((task) => (
                    <li key={task.id} className="border-b border-paper-100 last:border-b-0">
                      <Link href={`/kaam/${task.id}`} className="flex items-center gap-3 px-3.5 py-3 hover:bg-paper-50">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14.5px] font-semibold text-ink-900">{task.title}</span>
                          <span className="num block truncate text-[12.5px] text-ink-500">
                            {task.assigneeName}
                            {task.dueAt ? ` · ${formatIndianDate(task.dueAt, shell.locale)} ${formatTime(task.dueAt)}` : ""}
                          </span>
                        </span>
                        <span className="shrink-0 text-[12.5px] font-semibold text-ink-700">
                          {stateWord(task.state, shell.locale)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-[13px] font-semibold text-ink-700">{p.projects.documents}</h2>
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <Link
                    href={`/documents/templates?project=${project.id}`}
                    className="inline-flex h-9 items-center gap-1.5 rounded-button border border-neel-200 bg-paper-0 px-3 text-[13.5px] font-semibold text-neel-700 hover:bg-neel-50"
                  >
                    <FilePlus2 className="size-4" aria-hidden="true" />
                    {ux.templates.createFromTemplate}
                  </Link>
                  <DocumentUploader locale={shell.locale} projectId={project.id} compact />
                </div>
              </div>
              {documents.length === 0 ? (
                <p className="rounded-card border border-dashed border-paper-300 px-4 py-5 text-center text-[14px] text-ink-500">
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
              <h2 className="mb-2 text-[13px] font-semibold text-ink-700">{p.projects.members}</h2>
              <ul className="flex flex-wrap gap-2">
                {project.members.map((member) => (
                  <li key={member.userId} className="flex items-center gap-2 rounded-chip border border-paper-200 bg-paper-0 py-1 pr-3 pl-1">
                    <Avatar name={member.name} size={24} />
                    <span className="text-[13px] font-semibold text-ink-900">{member.name}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="mb-2 text-[13px] font-semibold text-ink-700">{p.projects.activity}</h2>
              {project.activity.length === 0 ? (
                <p className="text-[14px] text-ink-500">—</p>
              ) : (
                <ol className="flex flex-col gap-2.5">
                  {project.activity.map((entry) => (
                    <li key={entry.id} className="flex gap-2.5">
                      <span aria-hidden="true" className="mt-[7px] size-1.5 shrink-0 rounded-full bg-neel-400" />
                      <span className="text-[13.5px] leading-[19px] text-ink-700">
                        {entry.text}
                        <span className="num block text-[12px] text-ink-400">
                          {formatIndianDate(entry.at, shell.locale)} · {formatTime(entry.at)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
