import Link from "next/link";
import { CalendarCheck, FolderKanban, MessageSquare, ShieldCheck } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/lib/i18n";
import { getPhase1 } from "@/lib/i18n/phase1";
import { listApprovals, waitingOn } from "@/lib/approvals/queries";
import { listConversations } from "@/lib/conversations/queries";
import { getMyToday } from "@/lib/attendance/queries";
import { formatPunchTime } from "@/lib/attendance/time";

/**
 * Everything beyond tasks that is waiting on this person: approvals, leave to
 * decide, unread conversations, and whether they are marked in today. Each
 * item is a link to the one place it can be dealt with.
 */
export async function AttentionStrip({
  locale,
  orgId,
  userId,
  manages,
}: {
  locale: Locale;
  orgId: string;
  userId: string;
  manages: boolean;
}) {
  const p = getPhase1(locale);
  const supabase = await createClient();

  const [approvals, conversations, today, leave, projects] = await Promise.all([
    listApprovals(orgId),
    listConversations(orgId, userId),
    getMyToday(orgId, userId),
    manages
      ? supabase.from("leave_requests").select("id", { count: "exact", head: true }).eq("org_id", orgId).eq("status", "pending")
      : Promise.resolve({ count: 0 }),
    supabase.from("projects").select("id, name").eq("org_id", orgId).eq("status", "active").order("updated_at", { ascending: false }).limit(3),
  ]);

  const approvalsWaiting = waitingOn(approvals, userId, manages).length;
  const unread = conversations.filter((conversation) => conversation.unread > 0).length;
  const leaveWaiting = leave.count ?? 0;

  const items = [
    approvalsWaiting > 0 && { href: "/approvals", icon: ShieldCheck, text: p.today.approvalsWaiting(approvalsWaiting), urgent: true },
    leaveWaiting > 0 && { href: "/hazri", icon: CalendarCheck, text: p.today.leaveWaiting(leaveWaiting), urgent: true },
    unread > 0 && { href: "/baat", icon: MessageSquare, text: p.today.unreadConversations(unread), urgent: false },
    {
      href: "/hazri",
      icon: CalendarCheck,
      text: today?.punchInAt ? p.today.punchedIn(formatPunchTime(today.punchInAt)) : p.today.notPunchedIn,
      urgent: !today?.punchInAt,
    },
  ].filter(Boolean) as { href: string; icon: typeof ShieldCheck; text: string; urgent: boolean }[];

  return (
    <section aria-label={p.today.alsoNeedsYou} className="mb-5" data-testid="attention-strip">
      <ul className="flex flex-wrap gap-2">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <li key={`${item.href}-${index}`}>
              <Link
                href={item.href}
                className={
                  item.urgent
                    ? "flex items-center gap-2 rounded-chip border border-neel-200 bg-neel-50 px-3.5 py-2 text-[14px] font-semibold text-neel-800"
                    : "flex items-center gap-2 rounded-chip border border-paper-200 bg-paper-0 px-3.5 py-2 text-[14px] font-semibold text-ink-700"
                }
              >
                <Icon className="size-4" aria-hidden="true" />
                {item.text}
              </Link>
            </li>
          );
        })}
      </ul>
      {projects.data?.length ? (
        <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13.5px]">
          <span className="font-semibold text-ink-500">{p.today.activeProjects}</span>
          {projects.data.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`} className="inline-flex items-center gap-1 text-neel-700 hover:underline">
              <FolderKanban className="size-3.5" aria-hidden="true" />
              {project.name}
            </Link>
          ))}
        </p>
      ) : null}
    </section>
  );
}
