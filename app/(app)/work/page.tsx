import type { Metadata } from "next";
import Link from "next/link";
import { Plus, SquareCheckBig, X } from "lucide-react";

import { requireOrg, canManage } from "@/lib/auth/session";
import { shellFor } from "@/lib/auth/shell";
import { getPhase1 } from "@/lib/i18n/phase1";
import { getDesign } from "@/lib/i18n/design";
import { getDictionary } from "@/lib/i18n";
import { getMyTasks, getOrgTasks, type TaskListItem } from "@/lib/tasks/queries";
import { isLate } from "@/lib/tasks/present";
import { needsYou, waitingOnTeam, type NeedsYouReason } from "@/lib/tasks/counters";
import { getOrgMembers } from "@/lib/org/members";
import { AppShell } from "@/components/waakya/app-shell";
import { PageHeader, EmptyState } from "@/components/waakya/page";
import { TaskTable } from "@/components/waakya/task-table";
import { TaskRow } from "@/components/waakya/task-row";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PersonFilter } from "./person-filter";

export const metadata: Metadata = { title: "Work" };

type Status = "open" | "late" | "verify" | "done";
type Scope = "team" | "mine";

const FINISHED = ["verified", "cancelled"];

/**
 * Every commitment, answering two separate questions separately (V3):
 * whose — Team or Mine, for people who run work — and in what state — Open,
 * Late, Done. V2 mixed both into five tabs. A person filter comes from
 * Today's "Your team today". Filters are links, so a view can be shared.
 * Old `?tab=` links still land in the right place.
 *
 * `?need=` is where Today's folded groups lead: exactly the tasks Today put
 * in that group, chosen by the same rule (needsYou), so "12 more · Late" on
 * Today and this list always agree.
 */
export default async function WorkPage({ searchParams }: PageProps<"/work">) {
  const viewer = await requireOrg();
  const shell = await shellFor(viewer);
  const p = getPhase1(shell.locale);
  const d = getDesign(shell.locale);
  const t = getDictionary(shell.locale);
  const manages = canManage(viewer.role);
  const now = new Date();

  const params = await searchParams;
  const legacy = typeof params.tab === "string" ? params.tab : null;
  const statusParam = typeof params.status === "string" ? params.status : legacy;
  const status: Status =
    statusParam === "late" || statusParam === "done" || (manages && statusParam === "verify") ? statusParam : "open";
  const scopeParam = typeof params.scope === "string" ? params.scope : legacy;
  const scope: Scope = manages ? (scopeParam === "mine" ? "mine" : "team") : "mine";
  const person = manages && typeof params.person === "string" ? params.person : null;
  type Need = NeedsYouReason | "waiting";
  const NEEDS: Need[] = ["late", "escalated", "unseen", "verify", "waiting"];
  const need = manages && NEEDS.includes(params.need as Need) ? (params.need as Need) : null;

  const [all, members] = await Promise.all([
    manages
      ? getOrgTasks(viewer.org.id, viewer.org.ackMinutes)
      : getMyTasks(viewer.org.id, viewer.userId, viewer.org.ackMinutes),
    manages ? getOrgMembers(viewer.org.id) : Promise.resolve([]),
  ]);
  const personName = person ? (members.find((m) => m.userId === person)?.name ?? null) : null;

  const inScope = all.filter((task) => {
    if (person) return task.assigneeId === person;
    if (scope === "mine") return task.assigneeId === viewer.userId || task.createdById === viewer.userId;
    return true;
  });
  const matches = (task: TaskListItem, which: Status) => {
    switch (which) {
      case "late":
        return isLate(task, now);
      case "verify":
        return task.state === "done";
      case "done":
        return ["done", "verified"].includes(task.state);
      default:
        return !FINISHED.includes(task.state) && task.state !== "done";
    }
  };
  const needed = !need
    ? null
    : need === "waiting"
      ? new Set(waitingOnTeam(all, now).map((task) => task.id))
      : new Set(needsYou(all, now).filter((item) => item.reason === need).map((item) => item.task.id));
  const needLabel: Record<Need, string> = {
    waiting: d.v3.waiting,
    late: p.work.late,
    escalated: t.chips.escalated,
    unseen: t.chips.dekhaNahi,
    verify: t.chips.verifyBaaki,
  };
  const shown = (needed ? all.filter((task) => needed.has(task.id)) : inScope.filter((task) => matches(task, status)))
    .sort((a, b) => {
      const at = a.dueAt ? Date.parse(a.dueAt) : Infinity;
      const bt = b.dueAt ? Date.parse(b.dueAt) : Infinity;
      if (status === "done") return bt - at;
      // Late first, then by deadline.
      return Number(isLate(b, now)) - Number(isLate(a, now)) || at - bt;
    });

  const phones = Object.fromEntries(members.map((m) => [m.userId, m.phone]));
  const label: Record<Status, string> = { open: p.work.pending, late: p.work.late, verify: t.chips.verifyBaaki, done: p.work.done };
  const href = (next: Partial<{ status: Status; scope: Scope }>) => {
    const q = new URLSearchParams();
    const s = next.status ?? status;
    const sc = next.scope ?? scope;
    if (s !== "open") q.set("status", s);
    if (manages && sc !== "team") q.set("scope", sc);
    if (person && !next.scope) q.set("person", person);
    const text = q.toString();
    return text ? `/work?${text}` : "/work";
  };

  return (
    <AppShell {...shell} width="list">
      <main className="flex-1 p-4 pb-8 lg:px-0">
        <PageHeader
          title={p.work.title}
          actions={
            manages ? (
              <Link href="/naya" className={buttonVariants({ size: "owner" })}>
                <Plus aria-hidden="true" />
                {p.work.newTask}
              </Link>
            ) : null
          }
        />

        <div className="mt-5 flex flex-wrap items-end justify-between gap-3 border-b border-line">
          {/* In what state: three tabs, each with how many it holds. */}
          <nav aria-label={p.work.title} className="-mb-px overflow-x-auto">
            <ul className="flex gap-1">
              {(manages ? (["open", "late", "verify", "done"] as const) : (["open", "late", "done"] as const)).map((value) => {
                const count = inScope.filter((task) => matches(task, value)).length;
                const current = !need && value === status;
                return (
                  <li key={value} className="shrink-0">
                    <Link
                      href={href({ status: value })}
                      aria-current={current ? "page" : undefined}
                      className={cn(
                        "flex min-h-11 items-center gap-1.5 border-b-2 px-3 text-body-sm font-semibold transition-colors duration-150",
                        current ? "border-neel-600 text-neel-700" : "border-transparent text-fg-subtle hover:text-fg",
                        value === "late" && count > 0 && !current && "text-laal-700",
                      )}
                    >
                      {label[value]}
                      <span className="num text-caption">{count}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {manages ? (
            <PersonFilter
              people={members.map((m) => ({ id: m.userId, name: m.name, phone: m.phone }))}
              current={person}
              label={p.team.title}
              anyone={d.v3.choosePerson}
              keep={status === "open" ? null : status}
            />
          ) : null}

          {/* Whose: a quiet switch, only for people who run work. */}
          {manages && !person ? (
            <div role="group" aria-label={`${d.v3.scopeTeam} / ${d.v3.scopeMine}`} className="mb-2 flex rounded-button bg-surface-muted p-0.5 text-label font-semibold">
              {(["team", "mine"] as const).map((value) => (
                <Link
                  key={value}
                  href={href({ scope: value })}
                  aria-current={value === scope ? "true" : undefined}
                  className={cn(
                    "flex min-h-11 items-center rounded-[11px] px-4 transition-colors duration-150",
                    value === scope ? "bg-surface text-fg shadow-card" : "text-fg-subtle hover:text-fg",
                  )}
                >
                  {value === "team" ? d.v3.scopeTeam : d.v3.scopeMine}
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        {need ? (
          <p className="mt-4 inline-flex items-center gap-2 rounded-chip bg-neel-50 py-0.5 pr-0.5 pl-3 text-label font-semibold text-neel-800">
            <span className="sr-only">{d.v3.showingOnly}: </span>
            {needLabel[need]} · <span className="num">{shown.length}</span>
            <Link href="/work" aria-label={d.v3.clearFilter} className="-my-1 grid size-10 place-items-center rounded-full hover:bg-neel-100">
              <X className="size-3.5" aria-hidden="true" />
            </Link>
          </p>
        ) : null}

        {personName ? (
          <p className="mt-4 inline-flex items-center gap-2 rounded-chip bg-neel-50 py-0.5 pr-0.5 pl-3 text-label font-semibold text-neel-800">
            {personName}
            <Link href={href({ scope: "team" })} aria-label={d.v3.scopeTeam} className="-my-1 grid size-10 place-items-center rounded-full hover:bg-neel-100">
              <X className="size-3.5" aria-hidden="true" />
            </Link>
          </p>
        ) : null}

        {shown.length === 0 ? (
          <EmptyState icon={<SquareCheckBig />} title={p.work.empty} className="mt-6" />
        ) : (
          <>
            <div className="mt-5 hidden lg:block">
              <TaskTable tasks={shown} locale={shell.locale} now={now} phones={phones} />
            </div>
            <ul data-testid="work-list" aria-label={need ? needLabel[need] : label[status]} className="mt-4 flex flex-col gap-2 lg:hidden">
              {shown.map((task) => (
                <li key={task.id}>
                  <TaskRow task={task} locale={shell.locale} viewer={manages ? "owner" : "staff"} now={now} showAssignee={manages} />
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </AppShell>
  );
}
