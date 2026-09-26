import type { Metadata } from "next";
import Link from "next/link";

import { requireOrg, canManage } from "@/lib/auth/session";
import { shellFor } from "@/lib/auth/shell";
import { getPhase1 } from "@/lib/i18n/phase1";
import { listProjects } from "@/lib/projects/queries";
import { getOrgMembers } from "@/lib/org/members";
import { formatIndianDate } from "@/lib/tasks/format-date";
import { AppShell } from "@/components/waakya/app-shell";
import { ListSurface, PageHeader } from "@/components/waakya/page";
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
        <PageHeader
          title={p.projects.title}
          description={p.projects.subtitle}
          actions={
            manages ? (
              <NewProject
                locale={shell.locale}
                people={members
                  .filter((member) => member.userId !== viewer.userId)
                  .map((member) => ({ id: member.userId, name: member.name }))}
              />
            ) : undefined
          }
        />

        {projects.length === 0 ? (
          <div className="mt-8 flex flex-col items-center rounded-card border border-dashed border-paper-300 px-6 py-10 text-center">
            <Illustration name="projects" className="h-32 w-auto" />
            <p className="mt-4 text-title-sm font-bold text-fg">{p.projects.empty}</p>
            <p className="mt-1 max-w-sm text-body leading-[21px] text-ink-500">
              {p.projects.emptyHelp}
            </p>
          </div>
        ) : (
          /* One surface, one project per row: how far along, how much is
             open, where the papers are, when it is due. */
          <ListSurface className="mt-5" label={p.projects.title}>
            {projects.map((project) => {
              const done = Math.max(0, project.totalTasks - project.openTasks);
              const pct = project.totalTasks > 0 ? Math.round((done / project.totalTasks) * 100) : null;
              return (
                <li key={project.id}>
                  <Link
                    href={`/projects/${project.id}`}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 px-4 py-3 transition-colors duration-150 hover:bg-paper-50/70 lg:grid-cols-[minmax(0,1fr)_10rem_auto]"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-body font-semibold text-fg">{project.name}</span>
                      <span className="num block truncate text-caption text-fg-subtle">
                        {[
                          p.projects.openTasks(project.openTasks),
                          `${project.documents} ${p.projects.documents.toLowerCase()}`,
                          project.endDate ? `${p.projects.end}: ${formatIndianDate(`${project.endDate}T12:00:00Z`, shell.locale)}` : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </span>
                    <span className="col-span-2 flex items-center gap-2 lg:col-span-1" aria-hidden={pct === null}>
                      {pct !== null ? (
                        <>
                          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-paper-200">
                            <span
                              className={project.status === "completed" ? "block h-full rounded-full bg-hara-600" : "block h-full rounded-full bg-neel-600"}
                              style={{ width: `${Math.max(pct, 2)}%` }}
                            />
                          </span>
                          <span className="num w-9 text-right text-caption font-semibold text-fg-muted">{pct}%</span>
                        </>
                      ) : null}
                    </span>
                    <span className="row-start-1 col-start-2 lg:col-start-3">
                      <ProjectStatusChip locale={shell.locale} status={project.status} />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ListSurface>
        )}
      </main>
    </AppShell>
  );
}
