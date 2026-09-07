"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Calendar,
  Home,
  ListChecks,
  Settings,
  Users,
} from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Wordmark } from "@/components/waakya/wordmark";
import { getDictionary, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * The desktop sidebar (screens/DashboardDesktop.png): Neel 900, the wordmark,
 * the business, the destinations, and the person at the bottom.
 *
 * It replaces the bottom nav from `lg` up. Below that it is not rendered at
 * all — a phone screen has no room for it, and the design is explicit that
 * staff screens stay quiet (D-09).
 */
export function SideNav({
  locale,
  variant,
  orgName,
  personName,
  roleLabel,
  unread,
}: {
  locale: Locale;
  variant: "owner" | "staff";
  orgName: string;
  personName: string;
  roleLabel: string;
  unread: number;
}) {
  const t = getDictionary(locale);
  const pathname = usePathname();

  const items =
    variant === "owner"
      ? [
          { href: "/aaj", label: t.nav.aaj, icon: Home },
          { href: "/hafta", label: t.nav.hafta, icon: Calendar },
          { href: "/staff", label: t.nav.staff, icon: Users },
          { href: "/checklists", label: t.nav.checklists, icon: ListChecks },
          { href: "/khabar", label: t.nav.khabar, icon: Bell, badge: unread },
          { href: "/settings", label: t.nav.settings, icon: Settings },
        ]
      : [
          { href: "/aaj", label: t.nav.aaj, icon: Home },
          { href: "/pehle", label: t.nav.pehle, icon: Calendar },
          { href: "/khabar", label: t.nav.khabar, icon: Bell, badge: unread },
          { href: "/settings", label: t.nav.settings, icon: Settings },
        ];

  return (
    <nav
      aria-label={t.nav.aaj}
      // Sticky and viewport-tall: the destinations should not scroll away with
      // the day's work. The Neel ground is on the wrapper in AppShell, so the
      // column stays coloured however long the page gets.
      className="sticky top-0 flex h-dvh flex-col overflow-y-auto p-4 text-white"
    >
      <Link href="/aaj" className="flex items-center gap-2 px-2 py-3">
        <Wordmark size={24} onNeel />
      </Link>

      <p className="mt-4 px-3 text-[11px] font-semibold tracking-widest text-white/50 uppercase">
        {t.nav.businessLabel}
      </p>
      <p className="mb-4 px-3 text-[17px] leading-tight font-bold">{orgName}</p>

      <ul className="flex flex-1 flex-col gap-1">
        {items.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-tap items-center gap-3 rounded-button px-3 text-[15px] font-semibold transition-colors",
                  active
                    ? "bg-white/15 text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white",
                )}
              >
                <Icon className="size-5 shrink-0" aria-hidden="true" />
                <span className="flex-1">{label}</span>
                {badge ? (
                  <span className="num rounded-chip bg-white px-2 text-[12px] font-bold text-neel-700">
                    {badge > 9 ? "9+" : badge}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex items-center gap-3 rounded-card bg-white/10 p-3">
        <Avatar name={personName} size={36} className="bg-white text-neel-700" />
        <div className="min-w-0">
          <p className="truncate text-[15px] leading-tight font-bold">
            {personName}
          </p>
          <p className="text-[13px] text-white/60">{roleLabel}</p>
        </div>
      </div>
    </nav>
  );
}
