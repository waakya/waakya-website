import Link from "next/link";
import { AlertTriangle, ArrowRight, CalendarClock, Clock, Contact, Eye, EyeOff, MessageSquare, Phone, ShieldCheck, UserX } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

import { getDictionary, type Locale } from "@/lib/i18n";
import { getDesign } from "@/lib/i18n/design";
import { getPhase1 } from "@/lib/i18n/phase1";
import { listApprovals, waitingOn } from "@/lib/approvals/queries";
import { getPendingLeave } from "@/lib/attendance/queries";
import { listConversations } from "@/lib/conversations/queries";
import { getOrgMembers } from "@/lib/org/members";
import { formatDuration } from "@/lib/tasks/sla";
import { formatIndianDate } from "@/lib/tasks/format-date";
import type { NeedsYou } from "@/lib/tasks/counters";
import { foldGroups } from "@/lib/tasks/fold";
import { getEnabledModules } from "@/lib/modules/queries";
import { crmAttention } from "@/lib/crm/queries";
import { customerAttention } from "@/lib/projects/customer";
import { getPlatform } from "@/lib/i18n/platform";
import { getCrm } from "@/lib/i18n/crm";
import { cn } from "@/lib/utils";
import { DecideAction, TaskAction } from "./attention-actions";

type Tone = "laal" | "amber" | "neel" | "quiet";

const TILE: Record<Tone, string> = {
  laal: "bg-laal-100 text-laal-700",
  amber: "bg-amber-100 text-amber-700",
  neel: "bg-neel-50 text-neel-700",
  quiet: "bg-surface-muted text-fg-muted",
};

type GroupKey = "late" | "escalated" | "unseen" | "verify" | "approvals" | "leave" | "followups" | "leads" | "customers" | "decisions" | "chats";

/**
 * The one answer to "what needs me?" (V3 IA). Decisions and exceptions from
 * across the business in a single list, each row with the one thing to do
 * about it — decided here, gone when done. The screens they come from
 * (Work, Approvals, Attendance) still exist; nobody has to remember to visit
 * them to find out whether they are needed.
 *
 * A busy business must not bury anything (V3 rule: progressive disclosure,
 * never hidden work). So the list is grouped by why each item is here, every
 * group's count is always on screen, and past a handful of items each group
 * shows its first three with a link to exactly the rest — Work filtered by the
 * same rule that put them here, so the two can never disagree.
 */
export async function AttentionList({
  locale,
  orgId,
  userId,
  manages,
  attention,
  nowIso,
  hideWhenEmpty = false,
}: {
  locale: Locale;
  orgId: string;
  userId: string;
  manages: boolean;
  attention: NeedsYou[];
  nowIso: string;
  /** Staff Today shows this list only when something is actually waiting. */
  hideWhenEmpty?: boolean;
}) {
  const t = getDictionary(locale);
  const d = getDesign(locale);
  const p = getPhase1(locale);
  const now = new Date(nowIso);

  const modules = await getEnabledModules(orgId);
  const [approvals, leave, conversations, members, crm, customers] = await Promise.all([
    listApprovals(orgId),
    manages ? getPendingLeave(orgId) : Promise.resolve([]),
    listConversations(orgId, userId),
    getOrgMembers(orgId),
    modules.has("crm") ? crmAttention(orgId, userId, manages, now) : Promise.resolve(null),
    modules.has("customer_experience") && manages ? customerAttention(orgId) : Promise.resolve(null),
  ]);
  const c = getCrm(locale);
  const pl = getPlatform(locale).today;
  const nameOf = new Map(members.map((m) => [m.userId, m.name]));
  const phoneOf = new Map(members.map((m) => [m.userId, m.phone]));
  const decisions = waitingOn(approvals, userId, manages);
  // Nobody decides their own leave (the database refuses it), so a manager's
  // own request is not offered to them here.
  const leaveToDecide = leave.filter((request) => request.userId !== userId);

  // Calling the person is the owner's quickest escalation; it sits beside
  // Remind wherever someone is late or has not looked.
  const withCall = (action: React.ReactNode, personId: string | null, who: string) => {
    const phone = personId ? phoneOf.get(personId) : null;
    if (!phone) return action;
    return (
      <span className="flex items-center gap-1">
        {action}
        <a href={`tel:${phone}`} aria-label={`${t.actions.call} ${who}`} title={t.actions.call} className={buttonVariants({ size: "sm", variant: "ghost", className: "h-tap w-tap px-0" })}>
          <Phone aria-hidden="true" />
        </a>
      </span>
    );
  };
  const unread = conversations.filter((c) => c.unread > 0);

  type Row = {
    key: string;
    group: GroupKey;
    tone: Tone;
    icon: React.ReactNode;
    href: string;
    title: string;
    meta: string;
    action: React.ReactNode;
  };
  const rows: Row[] = [];

  // Order is the order of urgency: what is already late, then what is
  // slipping, then what waits on this person's decision.
  const rank = { late: 0, escalated: 1, unseen: 2, verify: 3 } as const;
  // Within a kind, the worst first: most overdue, longest unseen, waiting
  // longest for verification — the rows Today shows before "N more".
  const since = (item: NeedsYou) =>
    Date.parse(
      (item.reason === "verify" ? item.task.doneAt : item.reason === "unseen" ? item.task.deliveredAt : item.task.dueAt) ??
        item.task.createdAt,
    );
  for (const { task, reason } of [...attention].sort((a, b) => rank[a.reason] - rank[b.reason] || since(a) - since(b))) {
    const who = task.assigneeName;
    const base = { key: `task-${task.id}`, href: `/kaam/${task.id}`, group: reason };
    if (reason === "late") {
      rows.push({
        ...base,
        tone: "laal",
        icon: <Clock />,
        title: task.title,
        meta: `${task.dueAt ? t.chips.lateBy(formatDuration(now.getTime() - Date.parse(task.dueAt), t.time)) : t.chips.late} · ${who}`,
        action: withCall(<TaskAction locale={locale} taskId={task.id} kind="remind" />, task.assigneeId, who),
      });
    } else if (reason === "escalated") {
      rows.push({
        ...base,
        tone: "amber",
        icon: <AlertTriangle />,
        title: task.title,
        meta: `${t.chips.escalated} · ${who}`,
        action: <TaskAction locale={locale} taskId={task.id} kind="reassign" />,
      });
    } else if (reason === "unseen") {
      rows.push({
        ...base,
        tone: "amber",
        icon: <EyeOff />,
        title: task.title,
        meta: `${t.chips.dekhaNahi} · ${who}`,
        action: withCall(<TaskAction locale={locale} taskId={task.id} kind="remind" />, task.assigneeId, who),
      });
    } else {
      rows.push({
        ...base,
        tone: "neel",
        icon: <Eye />,
        title: task.title,
        // Verification is the owner's control point: the row says if it came
        // in late, and when a photo was required the owner sees it first.
        meta: [
          t.chips.verifyBaaki,
          who,
          task.dueAt && task.doneAt && Date.parse(task.doneAt) > Date.parse(task.dueAt)
            ? d.v3.doneLate(formatDuration(Date.parse(task.doneAt) - Date.parse(task.dueAt), t.time))
            : null,
          task.proofRequired ? t.chips.photoChahiye : null,
        ]
          .filter(Boolean)
          .join(" · "),
        action: task.proofRequired ? (
          <Link href={`/kaam/${task.id}`} className={buttonVariants({ size: "sm", variant: "secondary", className: "h-tap" })}>
            <Eye aria-hidden="true" />
            {d.v3.seeProof}
          </Link>
        ) : (
          <TaskAction locale={locale} taskId={task.id} kind="verify" />
        ),
      });
    }
  }

  for (const approval of decisions) {
    rows.push({
      key: `approval-${approval.id}`,
      group: "approvals",
      tone: "neel",
      icon: <ShieldCheck />,
      href: `/approvals#approval-${approval.id}`,
      title: approval.title,
      // What is being asked, not only who asked: the details and what is
      // attached travel with the row, so Approve is never blind.
      meta: [
        d.v3.approvalAsk(approval.requesterName),
        approval.details,
        approval.documentName,
        approval.taskTitle,
        approval.projectName,
      ]
        .filter(Boolean)
        .join(" · "),
      action: <DecideAction locale={locale} kind="approval" id={approval.id} rejectHref={`/approvals#approval-${approval.id}`} />,
    });
  }

  for (const request of leaveToDecide) {
    const when =
      request.startDate === request.endDate
        ? formatIndianDate(`${request.startDate}T12:00:00Z`, locale)
        : `${formatIndianDate(`${request.startDate}T12:00:00Z`, locale)} – ${formatIndianDate(`${request.endDate}T12:00:00Z`, locale)}`;
    rows.push({
      key: `leave-${request.id}`,
      group: "leave",
      tone: "neel",
      icon: <CalendarClock />,
      href: `/hazri#leave-${request.id}`,
      title: d.v3.leaveAsk(nameOf.get(request.userId) ?? "—", when),
      meta: request.reason ?? "",
      action: <DecideAction locale={locale} kind="leave" id={request.id} rejectHref={`/hazri#leave-${request.id}`} />,
    });
  }

  // Customers: a follow-up that is due is a promise about to be broken; a
  // lead with nobody's name on it is a customer nobody is talking to.
  for (const contact of crm?.followUps ?? []) {
    rows.push({
      key: `followup-${contact.id}`,
      group: "followups",
      tone: contact.followUp === "overdue" ? "laal" : "amber",
      icon: <CalendarClock />,
      href: `/crm/${contact.id}`,
      title: contact.fullName,
      meta: [contact.nextActionNote, contact.followUp === "overdue" ? c.followUp.overdue : c.followUp.due, contact.ownerName].filter(Boolean).join(" · "),
      action: contact.phone ? (
        <a href={`tel:${contact.phone}`} className={buttonVariants({ size: "sm", variant: "secondary", className: "h-tap" })}>
          <Phone aria-hidden="true" />
          {c.today.call}
        </a>
      ) : (
        <Link href={`/crm/${contact.id}`} className={buttonVariants({ size: "sm", variant: "secondary", className: "h-tap" })}>{c.today.open}</Link>
      ),
    });
  }
  for (const contact of crm?.unassigned ?? []) {
    rows.push({
      key: `lead-${contact.id}`,
      group: "leads",
      tone: "amber",
      icon: <UserX />,
      href: `/crm/${contact.id}`,
      title: contact.fullName,
      meta: [c.kind.lead, contact.source ? (c.sources[contact.source as keyof typeof c.sources] ?? contact.source) : null, contact.companyName].filter(Boolean).join(" · "),
      action: <Link href={`/crm/${contact.id}`} className={buttonVariants({ size: "sm", variant: "secondary", className: "h-tap" })}><Contact aria-hidden="true" />{c.actions.assign}</Link>,
    });
  }

  // Customers: a message nobody has answered, and a question they have been
  // sitting on for two days.
  for (const m of customers?.unreadMessages ?? []) {
    rows.push({
      key: `cmsg-${m.projectId}`,
      group: "customers",
      tone: "neel",
      icon: <MessageSquare />,
      href: `/projects/${m.projectId}#customer`,
      title: m.projectName,
      meta: pl.customerMessages(m.count),
      action: <Link href={`/projects/${m.projectId}#customer`} className={buttonVariants({ size: "sm", variant: "secondary", className: "h-tap" })}>{c.today.open}</Link>,
    });
  }
  for (const dec of (customers?.openDecisions ?? []).filter((x) => now.getTime() - Date.parse(x.createdAt) > 48 * 3600 * 1000)) {
    rows.push({
      key: `cdec-${dec.id}`,
      group: "decisions",
      tone: "amber",
      icon: <CalendarClock />,
      href: `/projects/${dec.projectId}#decisions`,
      title: dec.title,
      meta: `${dec.projectName} · ${formatDuration(now.getTime() - Date.parse(dec.createdAt), t.time)}`,
      action: <Link href={`/projects/${dec.projectId}#decisions`} className={buttonVariants({ size: "sm", variant: "secondary", className: "h-tap" })}>{c.today.open}</Link>,
    });
  }

  if (unread.length > 0) {
    rows.push({
      key: "chats",
      group: "chats",
      tone: "quiet",
      icon: <MessageSquare />,
      href: unread.length === 1 ? `/baat/${unread[0].id}` : "/baat",
      title: p.today.unreadConversations(unread.length),
      meta: unread.map((c) => c.title).slice(0, 3).join(", "),
      action: null,
    });
  }

  // Groups keep the urgency order above; each knows its words and where
  // the whole of it lives.
  const GROUPS: Record<GroupKey, { label: string; href: string }> = {
    late: { label: t.chips.late, href: "/work?need=late" },
    escalated: { label: t.chips.escalated, href: "/work?need=escalated" },
    unseen: { label: t.chips.dekhaNahi, href: "/work?need=unseen" },
    verify: { label: t.chips.verifyBaaki, href: "/work?need=verify" },
    approvals: { label: p.nav.approvals, href: "/approvals" },
    leave: { label: d.v3.leaveLabel, href: "/hazri#leave-requests" },
    followups: { label: c.today.followUps, href: "/crm?f=followUp" },
    leads: { label: c.today.unassigned, href: "/crm?f=unassigned" },
    customers: { label: pl.customerMessages(customers?.unreadTotal ?? 0), href: "/projects" },
    decisions: { label: pl.decisionsOpen(customers?.openTotal ?? 0), href: "/projects" },
    chats: { label: p.nav.conversations, href: "/baat" },
  };
  // Short days list everything; busy days fold each group to three with an
  // exact link to the rest (lib/tasks/fold.ts, unit-tested).
  // Customer groups are fetched five at a time with an exact count, so the
  // number shown is the true one, not the size of the sample.
  const groups = foldGroups(rows, (row) => row.group).map((group) => ({
    ...group,
    count:
      group.key === "chats" ? unread.length
      : group.key === "followups" ? Math.max(group.total, crm?.followUpCount ?? 0)
      : group.key === "leads" ? Math.max(group.total, crm?.unassignedCount ?? 0)
      : group.total,
    rest:
      group.key === "followups" ? Math.max(group.rest, (crm?.followUpCount ?? 0) - group.shown.length)
      : group.key === "leads" ? Math.max(group.rest, (crm?.unassignedCount ?? 0) - group.shown.length)
      : group.rest,
  }));
  // The heading counts what the summary counts (a chat row stands for all
  // unread chats), so the two numbers always agree.
  const total = groups.reduce((sum, group) => sum + group.count, 0);

  const heading = (
    <div className="mb-3">
      <h2 className="text-body-lg font-bold text-fg">
        {t.lists.aapkeLiye}
        {total > 0 ? <span className="num ml-1.5 font-normal text-fg-subtle">{total}</span> : null}
      </h2>
      {/* Every kind of thing waiting, with its count, even when rows are
          folded — the owner sees the shape of the day before reading. */}
      {groups.length > 1 ? (
        <p data-testid="attention-summary" className="num mt-1 flex flex-wrap gap-x-3 gap-y-1 text-label text-fg-subtle">
          {groups.map((group) => (
            <Link
              key={group.key}
              href={GROUPS[group.key].href}
              className={cn(
                "inline-flex min-h-7 items-center hover:text-fg hover:underline",
                group.key === "late" && "font-semibold text-laal-700",
                (group.key === "unseen" || group.key === "escalated") && "text-amber-700",
              )}
            >
              {group.count} {GROUPS[group.key].label}
            </Link>
          ))}
        </p>
      ) : null}
    </div>
  );

  if (rows.length === 0) {
    if (hideWhenEmpty) return null;
    return (
      <section>
        {heading}
        <div className="rounded-card border border-dashed border-line-strong px-5 py-8 text-center">
          <p className="text-body-lg font-bold text-fg">{d.v3.allClear}</p>
          <p className="mx-auto mt-1 max-w-sm text-body text-fg-subtle">{d.v3.allClearHelp}</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      {heading}
      <ul
        aria-label={t.lists.aapkeLiye}
        className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface shadow-card"
      >
        {groups.flatMap(({ key, shown, rest }) => {
          const items = shown.map((row) => (
            <li key={row.key} className="flex items-start gap-3 px-4 py-3">
              <span className={cn("mt-0.5 grid size-9 shrink-0 place-items-center rounded-inner [&_svg]:size-[18px]", TILE[row.tone])} aria-hidden="true">
                {row.icon}
              </span>
              <div className="min-w-0 flex-1">
                {/* The title is the way in — its own target, never lying under the
                    row's buttons (WCAG 2.5.8: no overlapping targets). */}
                <Link href={row.href} className="-my-1 flex min-h-11 items-center py-1 text-body font-semibold text-fg hover:text-neel-700 hover:underline">
                  <span className="line-clamp-2">{row.title}</span>
                </Link>
                {/* The why and the one thing to do share a line. */}
                {/* On a phone the actions wrap below, so who and why are never cut. */}
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <p className="num line-clamp-2 min-w-[12rem] flex-1 text-label text-fg-subtle">{row.meta}</p>
                  {row.action ? <div className="-my-1 shrink-0">{row.action}</div> : null}
                </div>
              </div>
            </li>
          ));
          if (rest > 0) {
            items.push(
              <li key={`${key}-more`}>
                <Link
                  href={GROUPS[key].href}
                  className="num flex min-h-11 items-center gap-1.5 px-4 pl-16 text-label font-semibold text-neel-700 transition-colors duration-150 hover:bg-paper-50"
                >
                  {d.v3.moreOf(rest)} · {GROUPS[key].label}
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              </li>,
            );
          }
          return items;
        })}
      </ul>
    </section>
  );
}
