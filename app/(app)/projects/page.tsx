import type { Metadata } from "next";
import Link from "next/link";

import { requireOrg, canManage } from "@/lib/auth/session";
import { shellFor } from "@/lib/auth/shell";
import { getPhase1 } from "@/lib/i18n/phase1";
import { listProjects } from "@/lib/projects/queries";
import { getOrgMembers } from "@/lib/org/members";
import { formatIndianDate } from "@/lib/tasks/format-date";
import { AppShell } from "@/components/waakya/app-shell";
import { PageHeader } from "@/components/waakya/page";
import { Illustration } from "@/components/waakya/illustrations";
import { ProjectStatusChip } from "./status-chip";
import { NewProject } from "./new-project";

export const metadata: Metadata = { title: "Projects" };

/** Lightweight projects: what is running, how much is open, where the papers are. */
export default async function ProjectsPage() {
  const viewer = await requireOrg();
  const shell = await shellFor(viewer);
  const p = getPhase1(shell.locale);
  const manages = canManage(viewer.role);

  const [unsorted, members] = await Promise.all([
    listProjects(viewer.org.id),
    manages ? getOrgMembers(viewer.org.id) : Promise.resolve([]),
  ]);

  // Live work first; finished projects sink to the end.
  const ORDER = { active: 0, planned: 1, on_hold: 2, completed: 3 } as const;
  const projects = [...unsorted].sort((a, b) => ORDER[a.status] - ORDER[b.status]);

  return (
    <AppShell {...shell} width="list">
      <main className="flex-1 p-4 pb-8 lg:px-0">
        <PageHeader title={p.projects.title} description={p.projects.subtitle} />

        {manages ? (
          <div className="mt-5">
            <NewProject
              locale={shell.locale}
              people={members
                .filter((member) => member.userId !== viewer.userId)
                .map((member) => ({ id: member.userId, name: member.name }))}
            />
          </div>
        ) : null}

        {projects.length === 0 ? (
          <div className="mt-8 flex flex-col items-center rounded-card border border-dashed border-paper-300 px-6 py-10 text-center">
            <Illustration name="projects" className="h-32 w-auto" />
            <p className="mt-4 text-title-sm font-bold text-fg">{p.projects.empty}</p>
            <p className="mt-1 max-w-sm text-body leading-[21px] text-ink-500">
              {p.projects.emptyHelp}
            </p>
          </div>
        ) : (
          <ul className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-2.5 md:grid-cols-[repeat(2,minmax(0,1fr))]">
            {projects.map((project) => (
              <li key={project.id} className="min-w-0">
                <Link
                  href={`/projects/${project.id}`}
                  className="flex h-full flex-col rounded-card border border-line bg-surface p-4 shadow-card transition-colors duration-150 hover:border-neel-300"
                >
                  <span className="flex items-start gap-3">
                    <span className="min-w-0 flex-1 text-body-lg font-semibold text-fg">
                      {project.name}
                    </span>
                    <ProjectStatusChip locale={shell.locale} status={project.status} />
                  </span>
                  {project.description ? (
                    <span className="mt-1 line-clamp-2 text-body-sm leading-[20px] text-ink-500">
                      {project.description}
                    </span>
                  ) : null}
                  <span className="num mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-3 text-label text-fg-subtle">
                    <span>{p.projects.openTasks(project.openTasks)}</span>
                    <span>
                      {project.documents} {p.projects.documents.toLowerCase()}
                    </span>
                    {project.endDate ? (
                      <span>
                        {p.projects.end}: {formatIndianDate(`${project.endDate}T12:00:00Z`, shell.locale)}
                      </span>
                    ) : null}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </AppShell>
  );
}
