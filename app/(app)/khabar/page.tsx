import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  CalendarCheck,
  CheckCheck,
  Clock,
  Eye,
  EyeOff,
  FileText,
  ListPlus,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Undo2,
  X,
  type LucideIcon,
} from "lucide-react";

import { requireViewer, canManage } from "@/lib/auth/session";
import { getInbox, type InboxItem } from "@/lib/notify/inbox";
import { getDictionary, toLocale, type Locale } from "@/lib/i18n";
import { getDesign } from "@/lib/i18n/design";
import { getLocale } from "@/lib/i18n/server";
import { AppShell } from "@/components/waakya/app-shell";
import { EmptyState, PageHeader } from "@/components/waakya/page";
import { dayKey, formatTime } from "@/lib/tasks/time";
import { formatIndianDate } from "@/lib/tasks/format-date";
import { cn } from "@/lib/utils";
import { InboxActions } from "./inbox-actions";

export const metadata: Metadata = { title: "Khabar" };

type Tone = "neel" | "amber" | "laal" | "hara" | "quiet";

/**
 * What kind of thing happened, drawn once so a glance separates "work came
 * in" from "something is late" from "a person wrote". Colour only where the
 * kind carries meaning (late, missed, verified); the words always say it too.
 */
const KINDS: Record<string, { icon: LucideIcon; tone: Tone }> = {
  task_assigned: { icon: ListPlus, tone: "neel" },
  task_seen: { icon: Eye, tone: "quiet" },
  task_done: { icon: CheckCheck, tone: "neel" },
  task_verified: { icon: BadgeCheck, tone: "hara" },
  ack_reminder: { icon: Bell, tone: "amber" },
  completion_reminder: { icon: Bell, tone: "amber" },
  not_seen: { icon: EyeOff, tone: "amber" },
  overdue: { icon: Clock, tone: "laal" },
  escalated: { icon: AlertTriangle, tone: "laal" },
  reassigned: { icon: RefreshCw, tone: "quiet" },
  cancelled: { icon: X, tone: "quiet" },
  sent_back: { icon: Undo2, tone: "neel" },
  message: { icon: MessageSquare, tone: "quiet" },
  approval_requested: { icon: ShieldCheck, tone: "neel" },
  approval_decided: { icon: ShieldCheck, tone: "quiet" },
  approved: { icon: ShieldCheck, tone: "quiet" },
  leave_requested: { icon: CalendarCheck, tone: "neel" },
  leave_approved: { icon: CalendarCheck, tone: "quiet" },
  leave_rejected: { icon: CalendarCheck, tone: "quiet" },
  document_added: { icon: FileText, tone: "quiet" },
};

/** Kinds that ask something of the reader, as opposed to telling them. */
const ASKS = new Set([
  "task_assigned",
  "sent_back",
  "approval_requested",
  "leave_requested",
  "ack_reminder",
  "completion_reminder",
  "not_seen",
  "overdue",
  "escalated",
]);

/**
 * Chats already carry every message, so a run of message notices from the
 * same conversation reads as one line with a count (V3: fewer duplicates).
 * Only neighbours merge, so the order of what happened is kept.
 */
function collapseMessages(items: InboxItem[]): { item: InboxItem; more: number }[] {
  const out: { item: InboxItem; more: number }[] = [];
  for (const item of items) {
    const last = out[out.length - 1];
    if (last && item.event === "message" && last.item.event === "message" && item.href && item.href === last.item.href) {
      last.more += 1;
    } else {
      out.push({ item, more: 0 });
    }
  }
  return out;
}

const TILE: Record<Tone, string> = {
  neel: "bg-neel-50 text-neel-700",
  amber: "bg-amber-100 text-amber-700",
  laal: "bg-laal-100 text-laal-700",
  hara: "bg-hara-100 text-hara-700",
  quiet: "bg-surface-muted text-fg-muted",
};

/**
 * The in-app inbox. Every line is a fact with a timestamp, and tapping one
 * goes to the thing it is about — nothing here is a thing you can reply to.
 * New ones first, then the rest by day.
 */
export default async function InboxPage() {
  const viewer = await requireViewer();
  const locale = toLocale(await getLocale(), viewer.org?.language ?? "hi");
  const t = getDictionary(locale);
  const d = getDesign(locale);
  const items = await getInbox();
  const unread = items.filter((item) => !item.readAt).length;
  const now = new Date();
  const todayKey = dayKey(now);

  const fresh = items.filter((item) => !item.readAt);
  const byDay = new Map<string, InboxItem[]>();
  for (const item of items.filter((entry) => entry.readAt)) {
    const key = dayKey(item.at);
    byDay.set(key, [...(byDay.get(key) ?? []), item]);
  }
  const dayTitle = (key: string, sample: string) =>
    key === todayKey ? d.updates.today : formatIndianDate(sample, locale);

  return (
    <AppShell
      locale={locale}
      variant={canManage(viewer.role) ? "owner" : "staff"}
      orgName={viewer.org?.name ?? ""}
      personName={viewer.fullName ?? "—"}
      roleLabel={viewer.role ? getDictionary(locale).org.roles[viewer.role] : ""}
      unread={unread}
      width="reading"
    >
      <main className="flex-1 p-4 pb-8 lg:px-0">
        <PageHeader
          title={t.inbox.title}
          description={unread > 0 ? <span className="text-neel-700">{t.inbox.unread(unread)}</span> : null}
          actions={<InboxActions locale={locale} hasUnread={unread > 0} canCheck={canManage(viewer.role)} />}
        />

        {items.length === 0 ? (
          <EmptyState icon={<Bell />} title={d.updates.empty} body={d.updates.emptyHelp} className="mt-6" />
        ) : (
          // One list for the whole inbox (its name is what people and tests
          // reach for); the groups are headed items inside it.
          <ul aria-label={t.inbox.title} className="mt-6 flex flex-col gap-6">
            {fresh.length > 0 ? (
              <Group title={d.updates.unread} count={collapseMessages(fresh).length}>
                {collapseMessages(fresh).map(({ item, more }) => (
                  <Row key={item.id} item={item} more={more} now={now} locale={locale} />
                ))}
              </Group>
            ) : null}
            {[...byDay.entries()].map(([key, group]) => (
              <Group key={key} title={dayTitle(key, group[0].at)} count={collapseMessages(group).length}>
                {collapseMessages(group).map(({ item, more }) => (
                  <Row key={item.id} item={item} more={more} now={now} locale={locale} />
                ))}
              </Group>
            ))}
          </ul>
        )}
      </main>
    </AppShell>
  );
}

function Group({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <li>
      <h2 className="mb-2 text-label font-semibold text-fg-subtle">
        {title} <span className="num font-normal">{count}</span>
      </h2>
      <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface shadow-card">
        {children}
      </ul>
    </li>
  );
}

function Row({ item, more, now, locale }: { item: InboxItem; more: number; now: Date; locale: Locale }) {
  const t = getDictionary(locale);
  const d = getDesign(locale);
  const kind = KINDS[item.event] ?? { icon: Bell, tone: "quiet" as Tone };
  const Icon = kind.icon;
  const unread = !item.readAt;
  const href = item.taskId ? `/kaam/${item.taskId}` : item.href;
  const when =
    dayKey(item.at) === dayKey(now)
      ? formatTime(item.at)
      : `${formatIndianDate(item.at, locale)} · ${formatTime(item.at)}`;

  return (
    <li className="relative flex gap-3 px-4 py-3 transition-colors duration-150 hover:bg-paper-50">
      <span className={cn("mt-0.5 grid size-8 shrink-0 place-items-center rounded-inner", TILE[kind.tone])}>
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn("text-body break-words", unread ? "font-semibold text-fg" : "text-fg-muted")}>
          {href ? (
            <Link href={href} className="after:absolute after:inset-0">
              {item.body}
            </Link>
          ) : (
            item.body
          )}
        </p>
        <p className="num mt-0.5 text-caption text-fg-subtle">
          {/* Asks for something, in words — not only by colour. */}
          {unread && ASKS.has(item.event) ? <span className="font-semibold text-neel-700">{t.lists.aapkeLiye} · </span> : null}
          {when}
          {more > 0 ? <span> · {d.v3.moreOf(more)}</span> : null}
        </p>
      </div>
      {unread ? <span className="mt-2 size-2 shrink-0 rounded-full bg-neel-600" aria-hidden="true" /> : null}
    </li>
  );
}
