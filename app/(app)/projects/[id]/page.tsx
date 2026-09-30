import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronDown, FilePlus2 } from "lucide-react";

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
import { CustomerPanel, ProjectMilestones } from "./customer-panel";
import { getProjectCustomerView } from "@/lib/projects/customer";
import { getPortal } from "@/lib/i18n/portal";
import { getPlatform } from "@/lib/i18n/platform";
import { ChangeLine, type LineMark } from "@/components/waakya/change-line";
import { buttonVariants } from "@/components/ui/button";
import { VendorSection } from "./vendor-section";
import { createClient } from "@/lib/supabase/server";

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

  const supabaseForPanel = await createClient();
  const [documents, members, unassigned, contactRows, recordRows] = await Promise.all([
    listProjectDocuments(viewer.org.id, id),
    manages ? getOrgMembers(viewer.org.id) : Promise.resolve([]),
    manages ? getUnassignedTasks(viewer.org.id) : Promise.resolve([]),
    manages && viewer.modules.has("crm")
      ? supabaseForPanel.from("crm_contacts").select("id, full_name").eq("org_id", viewer.org.id).is("archived_at", null).order("full_name").limit(300)
      : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
    manages && viewer.modules.has("records")
      ? supabaseForPanel.from("records").select("id, title, record_types(statuses)").eq("org_id", viewer.org.id).eq("project_id", id).is("archived_at", null).limit(100)
      : Promise.resolve({ data: [] as { id: string; title: string; record_types: { statuses: unknown } | null }[] }),
  ]);
  const panelContacts = (contactRows.data ?? []).map((c) => ({ id: c.id, name: c.full_name }));
  const panelRecords = (recordRows.data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    statuses: (((r.record_types as { statuses: unknown } | null)?.statuses as { key: string; label: string }[] | null) ?? []).map((s) => ({ key: s.key, label: s.label })),
  }));

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
      <li key={task.id} className="border-b border-line last:border-b-0">
        <Link href={`/kaam/${task.id}`} className="flex min-h-12 items-center gap-3 py-2 transition-colors duration-150 hover:bg-paper-100/60">
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

  const view = await getProjectCustomerView(viewer.org.id, project.id);
  const portal = getPortal(shell.locale);
  const nextMilestone = view.milestones.find((m) => m.status !== "done") ?? null;
  const lateCount = openTasks.filter(isLateTask).length;
  const openDecisions = view.decisions.filter((dc) => dc.status === "open").length;
  // Progress from the work; with no tasks yet, from the milestones — both real.
  const msDone = view.milestones.filter((m) => m.status === "done").length;
  const byTasks = counted.length > 0;
  const pct = byTasks ? Math.round((finished / counted.length) * 100) : view.milestones.length ? Math.round((msDone / view.milestones.length) * 100) : null;
  const progressLabel = byTasks ? d.today.staffProgress(finished, counted.length) : `${d.today.staffProgress(msDone, view.milestones.length)} · ${portal.business.milestones}`;
  const MARK = (entry: (typeof project.activity)[number]): LineMark =>
    entry.kind === "document" ? "moved" : entry.toState === "verified" ? "verified" : entry.toState === "done" ? "proof" : "moved";

  return (
    <AppShell {...shell} width="list">
      <main className="flex-1 p-4 pb-10 lg:px-0">
        <PageHeader
          back={{ href: "/projects", label: p.projects.title }}
          title={project.name}
          description={
            <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
              <ProjectStatusChip locale={shell.locale} status={project.status} />
              <span>
                {project.startDate ? `${p.projects.start}: ${formatIndianDate(`${project.startDate}T12:00:00Z`, shell.locale)}` : ""}
                {project.startDate && project.endDate ? " · " : ""}
                {project.endDate ? `${p.projects.end}: ${formatIndianDate(`${project.endDate}T12:00:00Z`, shell.locale)}` : ""}
              </span>
            </span>
          }
        />
        {project.description ? <p className="mt-3 max-w-2xl text-body text-fg-muted">{project.description}</p> : null}

        {/* Current state, in one band: how far, what is next, for whom, with whom. */}
        <div className="mt-5 grid gap-5 border-y border-line py-4 sm:grid-cols-[auto_minmax(0,1fr)] lg:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:gap-10">
          <div className="min-w-0">
            {pct !== null ? (
              <>
                <p className="num flex items-baseline gap-2">
                  <span className="font-display text-[40px] leading-none font-extrabold text-fg">{pct}%</span>
                  <span className="text-label text-fg-subtle">{progressLabel}</span>
                </p>
                <div
                  role="progressbar"
                  aria-label={progressLabel}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={pct}
                  className="mt-2 h-1.5 w-40 overflow-hidden rounded-full bg-paper-200"
                >
                  <div className="h-full rounded-full bg-neel-600" style={{ width: `${Math.max(pct, 2)}%` }} />
                </div>
              </>
            ) : (
              <p className="text-body-sm text-fg-subtle">{p.projects.noTasks}</p>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-caption font-semibold text-fg-subtle">{portal.portal.nextMilestone}</p>
            <p className="truncate text-body font-semibold text-fg">{nextMilestone ? nextMilestone.name : "—"}</p>
            {nextMilestone?.dueDate ? <p className="num text-caption text-fg-subtle">{formatIndianDate(`${nextMilestone.dueDate}T12:00:00Z`, shell.locale)}</p> : null}
          </div>
          <div className="flex min-w-0 items-center gap-4 sm:col-span-2 lg:col-span-1">
            <div className="min-w-0 flex-1">
              <p className="text-caption font-semibold text-fg-subtle">{portal.business.customer}</p>
              {view.contact ? (
                <Link href={`/crm/${view.contact.id}`} className="block truncate text-body font-semibold text-neel-700 hover:underline">{view.contact.name}</Link>
              ) : (
                <p className="text-body text-fg-subtle">—</p>
              )}
            </div>
            <ul aria-label={p.projects.members} className="flex shrink-0 -space-x-2">
              {project.members.slice(0, 5).map((member) => (
                <li key={member.userId} title={member.name}>
                  <Avatar name={member.name} size={30} className="ring-2 ring-paper-50" />
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* What on this project needs someone, in words, each a way there. */}
        {lateCount || view.unreadMessages || openDecisions ? (
          <ul className="mt-4 flex flex-col gap-1">
            {lateCount ? (
              <li className="relative pl-4">
                <span aria-hidden="true" className="absolute top-1 bottom-1 left-0 w-[3px] rounded-full bg-laal-600" />
                <a href="#work" className="num inline-flex min-h-9 items-center text-body-sm font-semibold text-laal-700 hover:underline">
                  {lateCount} {t.chips.late}
                </a>
              </li>
            ) : null}
            {view.unreadMessages ? (
              <li className="relative pl-4">
                <span aria-hidden="true" className="absolute top-1 bottom-1 left-0 w-[3px] rounded-full bg-neel-600" />
                <a href="#customer" className="num inline-flex min-h-9 items-center text-body-sm font-semibold text-neel-700 underline decoration-[1.5px] underline-offset-4">
                  {getPlatform(shell.locale).today.customerMessages(view.unreadMessages)}
                </a>
              </li>
            ) : null}
            {openDecisions ? (
              <li className="relative pl-4">
                <span aria-hidden="true" className="absolute top-1 bottom-1 left-0 w-[3px] rounded-full bg-amber-600" />
                <a href="#decisions" className="num inline-flex min-h-9 items-center text-body-sm font-semibold text-amber-700 hover:underline">
                  {getPlatform(shell.locale).today.decisionsOpen(openDecisions)} · {portal.business.waiting}
                </a>
              </li>
            ) : null}
          </ul>
        ) : null}

        {manages ? (
          // Changing a project is occasional; reading it is daily. The
          // controls wait behind one line.
          <details className="group mt-3">
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

        <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-12">
          <div className="flex min-w-0 flex-col gap-10">
            <section id="work" aria-labelledby="work-h" className="scroll-mt-6">
              <h2 id="work-h" className="mb-2 text-body font-bold text-fg">
                {p.projects.tasks} <span className="num font-normal text-fg-subtle">{openTasks.length}</span>
              </h2>
              {project.tasks.length === 0 ? (
                <p className="border-y border-line py-3 text-body-sm text-fg-subtle">{p.projects.noTasks}</p>
              ) : (
                <>
                  {openTasks.length > 0 ? <ul className="border-y border-line">{openTasks.map(taskItem)}</ul> : null}
                  {closedTasks.length > 0 ? (
                    <details className="group/closed mt-2" open={openTasks.length === 0 || undefined}>
                      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-body-sm font-semibold text-fg-muted">
                        {d.v3.finished}
                        <span className="num font-normal text-fg-subtle">{closedTasks.length}</span>
                        <ChevronDown className="size-4 text-fg-subtle transition-transform duration-150 group-open/closed:rotate-180" aria-hidden="true" />
                      </summary>
                      <ul className="border-y border-line">{closedTasks.map(taskItem)}</ul>
                    </details>
                  ) : null}
                </>
              )}
            </section>

            <ProjectMilestones locale={shell.locale} orgId={viewer.org.id} projectId={project.id} manages={manages} />

            <section aria-labelledby="docs-h">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h2 id="docs-h" className="text-body font-bold text-fg">
                  {p.projects.documents} <span className="num font-normal text-fg-subtle">{documents.length}</span>
                </h2>
                <div className="flex min-w-0 flex-wrap items-center gap-1">
                  <Link href={`/documents/templates?project=${project.id}`} className={buttonVariants({ size: "sm", variant: "verb", className: "h-tap" })}>
                    <FilePlus2 className="size-4" aria-hidden="true" />
                    {ux.templates.createFromTemplate}
                  </Link>
                  <DocumentUploader locale={shell.locale} projectId={project.id} compact />
                </div>
              </div>
              {documents.length === 0 ? (
                <p className="border-y border-line py-3 text-body-sm text-fg-subtle">{p.projects.noDocuments}</p>
              ) : (
                <DocumentList locale={shell.locale} documents={documents} viewerId={viewer.userId} manages={manages} showLinks={false} />
              )}
            </section>
          </div>

          <div className="flex min-w-0 flex-col gap-10">
            <CustomerPanel
              locale={shell.locale}
              orgId={viewer.org.id}
              projectId={project.id}
              manages={manages}
              contacts={panelContacts}
              openTasks={openTasks.map((task) => ({ id: task.id, title: task.title }))}
              records={panelRecords}
              portalOn={viewer.modules.has("customer_experience")}
            />
            {viewer.modules.has("vendors") ? <VendorSection locale={shell.locale} orgId={viewer.org.id} projectId={project.id} manages={manages} /> : null}

            <RevealGroup as="section" id="project-activity" className="group/activity">
              <h2 className="text-body font-bold text-fg">{p.projects.activity}</h2>
              {project.activity.length === 0 ? (
                <p className="mt-2 text-body-sm text-fg-subtle">—</p>
              ) : (
                <>
                  <ChangeLine
                    className="mt-2"
                    label={p.projects.activity}
                    items={project.activity.slice(0, 3).map((entry) => ({
                      id: entry.id,
                      mark: MARK(entry),
                      text: (
                        <>
                          <span className="font-semibold">{entry.actor}</span>
                          {entry.kind === "task" && entry.toState ? ` · ${stateWord(entry.toState, shell.locale)}` : ""}
                          <span className="block text-fg-muted">{entry.subject}</span>
                        </>
                      ),
                      meta: `${formatIndianDate(entry.at, shell.locale)} · ${formatTime(entry.at)}`,
                    }))}
                  />
                  {project.activity.length > 3 ? (
                    <div className="hidden group-data-[open=true]/activity:block">
                      <ChangeLine
                        label={p.projects.activity}
                        items={project.activity.slice(3).map((entry) => ({
                          id: entry.id,
                          mark: MARK(entry),
                          text: (
                            <>
                              <span className="font-semibold">{entry.actor}</span>
                              {entry.kind === "task" && entry.toState ? ` · ${stateWord(entry.toState, shell.locale)}` : ""}
                              <span className="block text-fg-muted">{entry.subject}</span>
                            </>
                          ),
                          meta: `${formatIndianDate(entry.at, shell.locale)} · ${formatTime(entry.at)}`,
                        }))}
                      />
                    </div>
                  ) : null}
                </>
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
