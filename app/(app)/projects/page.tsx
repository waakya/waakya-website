import type { Metadata } from "next";
import Link from "next/link";

import { requireOrg, canManage } from "@/lib/auth/session";
import { shellFor } from "@/lib/auth/shell";
import { getPhase1 } from "@/lib/i18n/phase1";
import { listProjects } from "@/lib/projects/queries";
import { getOrgMembers } from "@/lib/org/members";
import { formatIndianDate } from "@/lib/tasks/format-date";
import { AppShell } from "@/components/waakya/app-shell";
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

  const [projects, members] = await Promise.all([
    listProjects(viewer.org.id),
    manages ? getOrgMembers(viewer.org.id) : Promise.resolve([]),
  ]);

  return (
    <AppShell {...shell}>
      <main className="flex-1 p-4 pb-8">
        <h1 className="text-[24px] leading-[30px] font-bold text-ink-900">{p.projects.title}</h1>
        <p className="mt-0.5 text-[15px] leading-[20px] text-ink-500">{p.projects.subtitle}</p>

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
            <p className="mt-4 font-display text-[22px] font-bold text-ink-900">{p.projects.empty}</p>
            <p className="mt-1 max-w-sm text-[15px] leading-[21px] text-ink-500">
              {p.projects.emptyHelp}
            </p>
          </div>
        ) : (
          <ul className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-2.5 md:grid-cols-[repeat(2,minmax(0,1fr))]">
            {projects.map((project) => (
              <li key={project.id} className="min-w-0">
                <Link
                  href={`/projects/${project.id}`}
                  className="flex h-full flex-col rounded-card border border-paper-200 bg-paper-0 p-4 transition-colors hover:border-neel-300"
                >
                  <span className="flex items-start gap-3">
                    <span className="min-w-0 flex-1 truncate text-[16px] font-semibold text-ink-900">
                      {project.name}
                    </span>
                    <ProjectStatusChip locale={shell.locale} status={project.status} />
                  </span>
                  {project.description ? (
                    <span className="mt-1 line-clamp-2 text-[14px] leading-[20px] text-ink-500">
                      {project.description}
                    </span>
                  ) : null}
                  <span className="num mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-ink-500">
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
