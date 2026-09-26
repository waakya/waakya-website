"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, MessageSquare, SquareCheckBig } from "lucide-react";

import { type Locale } from "@/lib/i18n";
import { getPhase1 } from "@/lib/i18n/phase1";
import { getUx } from "@/lib/i18n/ux";
import { cn } from "@/lib/utils";

/**
 * The phone bar: the four things people open all day, and More for the rest.
 * A fixed 4rem tall, so a screen with its own bottom bar can sit above it.
 */
export function BottomNav({
  locale,
  variant = "staff",
}: {
  locale: Locale;
  variant?: "owner" | "staff";
  /** Accepted for parity with the sidebar; the phone bar shows only daily places. */
  modules?: string[];
}) {
  const n = getPhase1(locale).nav;
  const ux = getUx(locale);
  const pathname = usePathname();

  // A task or a conversation brings its own bottom bar (actions, composer) and
  // a back arrow. Stacking the tab bar under it covered the proof and the
  // messages on a phone, so detail screens go without it.
  if (/^\/(kaam|baat)\/[^/]+/.test(pathname)) return null;

  // V3: only the places used most days. Attendance is a line on Today; the
  // rest is one tap away under More.
  const items = [
    { href: "/aaj", label: n.today, icon: Home, also: [] as string[] },
    { href: "/baat", label: n.conversations, icon: MessageSquare, also: [] as string[] },
    ...(variant === "owner"
      ? [{ href: "/work", label: n.work, icon: SquareCheckBig, also: ["/kaam", "/naya", "/hafta", "/pehle"] }]
      : []),
    {
      href: "/more",
      label: n.more,
      icon: LayoutGrid,
      also: [
        "/projects", "/documents", "/approvals", "/staff", "/search", "/khabar", "/settings", "/checklists", "/hazri",
        "/crm", "/records", "/vendors", "/campaigns", "/automations",
        ...(variant === "staff" ? ["/work", "/kaam", "/hafta", "/pehle"] : []),
      ],
    },
  ];

  return (
    <nav
      aria-label={ux.nav.main}
      className="sticky bottom-0 z-30 border-t border-paper-200 bg-paper-0 pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="mx-auto flex h-16 max-w-md md:max-w-2xl">
        {items.map(({ href, label, icon: Icon, also }) => {
          const active = [href, ...also].some((path) => pathname === path || pathname.startsWith(`${path}/`));
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                // "More" alone does not say what is behind it; the name still
                // starts with the word on screen.
                aria-label={href === "/more" ? `${label} — ${n.projects}, ${n.documents}, ${n.attendance}, ${n.settings}` : undefined}
                className={cn(
                  "flex h-full min-h-tap flex-col items-center justify-center gap-1 py-2",
                  active ? "text-neel-700" : "text-ink-500",
                )}
              >
                <Icon className="size-[22px]" aria-hidden="true" />
                <span className="max-w-full truncate px-1 text-micro leading-none font-semibold">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
