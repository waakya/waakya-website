import type { Metadata } from "next";
import Link from "next/link";
import { Bell } from "lucide-react";

import { requireViewer, canManage } from "@/lib/auth/session";
import { getInbox } from "@/lib/notify/inbox";
import { getDictionary, toLocale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { Card } from "@/components/ui/card";
import { AppShell } from "@/components/waakya/app-shell";
import { formatTime } from "@/lib/tasks/time";
import { formatIndianDate } from "@/lib/tasks/format-date";
import { InboxActions } from "./inbox-actions";

export const metadata: Metadata = { title: "Khabar" };

/**
 * The in-app inbox. Every line is a fact with a timestamp, and tapping one
 * goes to the task it is about — nothing here is a thing you can reply to.
 */
export default async function InboxPage() {
  const viewer = await requireViewer();
  const locale = toLocale(await getLocale(), viewer.org?.language ?? "hi");
  const t = getDictionary(locale);
  const items = await getInbox();
  const unread = items.filter((item) => !item.readAt).length;

  return (
    <AppShell
      locale={locale}
      variant={canManage(viewer.role) ? "owner" : "staff"}
      orgName={viewer.org?.name ?? ""}
      personName={viewer.fullName ?? "—"}
      roleLabel={viewer.role ? getDictionary(locale).org.roles[viewer.role] : ""}
      unread={unread}
    >
      <main className="flex-1 p-4">
        <header className="flex items-start gap-3">
          <div className="flex-1">
            <h1 className="text-[24px] leading-[30px] font-bold text-ink-900">
              {t.inbox.title}
            </h1>
            {unread > 0 ? (
              <p className="num mt-0.5 text-[15px] text-neel-700">
                {t.inbox.unread(unread)}
              </p>
            ) : null}
          </div>
          <InboxActions
            locale={locale}
            hasUnread={unread > 0}
            canCheck={canManage(viewer.role)}
          />
        </header>

        {items.length === 0 ? (
          <div className="mt-10 flex flex-col items-center gap-2 text-center">
            <Bell className="size-7 text-ink-400" aria-hidden="true" />
            <p className="text-[17px] font-bold text-ink-900">{t.inbox.empty}</p>
            <p className="text-[15px] leading-[20px] text-ink-500">
              {t.inbox.emptyHelp}
            </p>
          </div>
        ) : (
          <ul aria-label={t.inbox.title} className="mt-5 flex flex-col gap-2">
            {items.map((item) => (
              <li key={item.id}>
                <Card
                  className={
                    item.readAt
                      ? "relative p-3.5 shadow-none"
                      : "relative border-neel-200 bg-neel-50 p-3.5 shadow-none"
                  }
                >
                  <p className="text-[15px] leading-[20px] text-ink-900">
                    {item.taskId ? (
                      <Link
                        href={`/kaam/${item.taskId}`}
                        className="after:absolute after:inset-0"
                      >
                        {item.body}
                      </Link>
                    ) : (
                      item.body
                    )}
                  </p>
                  <p className="num mt-0.5 text-[13px] text-ink-500">
                    {formatIndianDate(item.at, locale)} · {formatTime(item.at)}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </main>

    </AppShell>
  );
}
