import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, ChevronRight, Search } from "lucide-react";

import { requireOrg } from "@/lib/auth/session";
import { shellFor } from "@/lib/auth/shell";
import { getDictionary } from "@/lib/i18n";
import { getUx } from "@/lib/i18n/ux";
import { AppShell } from "@/components/waakya/app-shell";
import { moreNav } from "@/components/waakya/nav-items";

export const metadata: Metadata = { title: "More" };

/** Everything the phone bar has no room for, in the same order as the sidebar. */
export default async function MorePage() {
  const viewer = await requireOrg();
  const shell = await shellFor(viewer);
  const t = getDictionary(shell.locale);
  const ux = getUx(shell.locale);

  // Everything that is not a daily place, in the sidebar's order. Leave and
  // holidays live inside Attendance, so they get their own row too — nobody
  // should have to know which page hides them.
  const more = moreNav(shell.locale, shell.variant, shell.unread, t.nav.checklists, shell.modules);
  // Leave and holidays live inside Attendance, so they get their own row —
  // nobody should have to know which page hides them.
  const groups = more.groups.map((group) => {
    const items = [...group.items];
    const at = items.findIndex((item) => item.href === "/hazri");
    if (at >= 0) items.splice(at + 1, 0, { href: "/hazri#leave", label: ux.nav.leaveHolidays, icon: CalendarDays });
    return { key: group.key, label: group.label, items };
  });
  const search = more.tools.find((item) => item.href === "/search");
  const updates = more.tools.filter((item) => item.href === "/khabar");
  return (
    <AppShell {...shell}>
      <main className="flex-1 p-4 pb-8">
        <h1 className="text-title font-bold text-fg">{viewer.org.name}</h1>
        {search ? (
          // Search first: on a phone it is the fastest way to anything here.
          <Link
            href="/search"
            className="mt-5 flex min-h-12 items-center gap-3 rounded-button border border-line-strong bg-surface px-4 text-body text-fg-subtle"
          >
            <Search className="size-5 text-fg-subtle" aria-hidden="true" />
            {search.label}
          </Link>
        ) : null}
        {[...groups, { key: "tools", label: "", items: updates }].filter((g) => g.items.length).map((group) => (
          <section key={group.key} className="mt-6">
            {group.label ? <h2 className="mb-1 text-caption font-bold tracking-[0.08em] text-fg-subtle uppercase">{group.label}</h2> : null}
            <ul className="border-y border-line">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.href} className="border-b border-line last:border-b-0">
                    <Link href={item.href} className="flex min-h-tap items-center gap-3 py-2 hover:bg-paper-100/60">
                      <Icon className="size-5 text-fg-subtle" aria-hidden="true" />
                      <span className="flex-1 text-body-lg font-semibold text-fg">{item.label}</span>
                      {item.badge ? (
                        <span className="num rounded-chip bg-neel-600 px-2 text-caption font-bold text-white">
                          {item.badge > 9 ? "9+" : item.badge}
                        </span>
                      ) : null}
                      <ChevronRight className="size-4 text-ink-400" aria-hidden="true" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </main>
    </AppShell>
  );
}
