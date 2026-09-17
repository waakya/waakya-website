import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, ChevronRight, FilePlus2 } from "lucide-react";

import { requireOrg } from "@/lib/auth/session";
import { shellFor } from "@/lib/auth/shell";
import { getDictionary } from "@/lib/i18n";
import { getUx } from "@/lib/i18n/ux";
import { AppShell } from "@/components/waakya/app-shell";
import { primaryNav, utilityNav } from "@/components/waakya/nav-items";

export const metadata: Metadata = { title: "More" };

/** Everything the phone bar has no room for, in the same order as the sidebar. */
export default async function MorePage() {
  const viewer = await requireOrg();
  const shell = await shellFor(viewer);
  const t = getDictionary(shell.locale);
  const ux = getUx(shell.locale);

  // The phone bar has five slots. Templates, leave and holidays live inside
  // Documents and Attendance, so they get their own rows here too — nobody
  // should have to know which page hides them.
  const primary = primaryNav(shell.locale, shell.variant).filter(
    (item) => !["/aaj", "/baat", "/work", "/hazri"].includes(item.href),
  );
  const documentsAt = primary.findIndex((item) => item.href === "/documents");
  primary.splice(documentsAt + 1, 0, { href: "/documents/templates", label: ux.nav.templates, icon: FilePlus2 });
  const groups = [
    [...primary.slice(0, primary.length), { href: "/hazri#leave", label: ux.nav.leaveHolidays, icon: CalendarDays }],
    utilityNav(shell.locale, shell.variant, shell.unread, t.nav.checklists),
  ];

  return (
    <AppShell {...shell}>
      <main className="flex-1 p-4 pb-8">
        <h1 className="text-[24px] leading-[30px] font-bold text-ink-900">{viewer.org.name}</h1>
        <p className="mt-1 hidden max-w-xl text-[15px] leading-[22px] text-ink-500 lg:block">{ux.nav.desktopMoreLead}</p>
        {groups.map((items, index) => (
          <ul key={index} className="mt-5 overflow-hidden rounded-card border border-paper-200 bg-paper-0">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href} className="border-b border-paper-100 last:border-b-0">
                  <Link href={item.href} className="flex min-h-tap items-center gap-3 px-4 py-3 hover:bg-paper-50">
                    <Icon className="size-5 text-neel-700" aria-hidden="true" />
                    <span className="flex-1 text-[16px] font-semibold text-ink-900">{item.label}</span>
                    {item.badge ? (
                      <span className="num rounded-chip bg-neel-600 px-2 text-[12px] font-bold text-white">
                        {item.badge > 9 ? "9+" : item.badge}
                      </span>
                    ) : null}
                    <ChevronRight className="size-4 text-ink-400" aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>
        ))}
      </main>
    </AppShell>
  );
}
