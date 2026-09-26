import Link from "next/link";
import { MessageSquare, UserPlus } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { getDictionary, type Locale } from "@/lib/i18n";
import { getDesign } from "@/lib/i18n/design";
import { getUx } from "@/lib/i18n/ux";
import type { ConversationSummary } from "@/lib/conversations/queries";
import { dayKey, formatTime } from "@/lib/tasks/time";
import { formatIndianDate } from "@/lib/tasks/format-date";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/waakya/page";

/**
 * Every conversation this person is in, newest first. The same list is the
 * whole screen on a phone and the left pane beside a thread on a desk.
 *
 * Unread reads three ways at once — bold name, the preview in full ink, and a
 * count — so it never rests on colour.
 */
export function ConversationList({
  conversations,
  locale,
  activeId,
  hasTeam,
  manages,
}: {
  conversations: ConversationSummary[];
  locale: Locale;
  activeId?: string;
  /** Anyone else in the business to talk to. */
  hasTeam: boolean;
  manages: boolean;
}) {
  const t = getDictionary(locale);
  const d = getDesign(locale);
  const ux = getUx(locale);
  const now = new Date();

  if (conversations.length === 0) {
    return hasTeam ? (
      <EmptyState icon={<MessageSquare />} title={t.baat.empty} body={t.baat.emptyHelp} className="mt-2" />
    ) : (
      // Nobody to talk to yet: say why, and lead to the one step that fixes it.
      <EmptyState
        icon={<UserPlus />}
        title={ux.team.noTeamYet}
        body={ux.team.noTeamHelp}
        className="mt-2"
        action={
          manages ? (
            <Link
              href="/staff"
              className="inline-flex min-h-11 items-center gap-2 rounded-button bg-neel-600 px-4 text-body font-semibold text-white transition-colors duration-150 hover:bg-neel-700"
            >
              <UserPlus className="size-4" aria-hidden="true" />
              {ux.team.invite}
            </Link>
          ) : null
        }
      />
    );
  }

  const when = (iso: string) => {
    const key = dayKey(iso);
    if (key === dayKey(now)) return formatTime(iso);
    if (key === dayKey(new Date(now.getTime() - 86_400_000))) return d.thread.yesterday;
    return formatIndianDate(iso, locale);
  };

  return (
    <ul
      aria-label={d.thread.listLabel}
      className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface shadow-card"
    >
      {conversations.map((conversation) => {
        const active = conversation.id === activeId;
        const unread = conversation.unread > 0;
        return (
          <li key={conversation.id}>
            <Link
              href={`/baat/${conversation.id}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-16 items-center gap-3 px-3.5 py-3 transition-colors duration-150",
                active ? "bg-neel-50" : "hover:bg-paper-50",
              )}
            >
              <Avatar name={conversation.title} size={38} />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-2">
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate text-body",
                      unread ? "font-bold text-fg" : "font-semibold text-fg",
                    )}
                  >
                    {conversation.title}
                  </span>
                  <span className={cn("num shrink-0 text-caption", unread ? "font-semibold text-neel-700" : "text-fg-subtle")}>
                    {when(conversation.lastMessageAt)}
                  </span>
                </span>
                <span className="mt-0.5 flex items-center gap-2">
                  <span className={cn("min-w-0 flex-1 truncate text-label", unread ? "text-fg" : "text-fg-subtle")}>
                    {conversation.preview ?? "—"}
                  </span>
                  {unread ? (
                    <span className="num grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-neel-600 px-1.5 text-micro font-bold text-white">
                      {conversation.unread}
                    </span>
                  ) : null}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
