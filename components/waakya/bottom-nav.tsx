"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Home, Settings, Users } from "lucide-react";

import { getDictionary, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Four items for owners, three for staff (§5.2). Staff screens stay quieter:
 * fewer places to go, one thing to do.
 */
export function BottomNav({
  locale,
  variant,
}: {
  locale: Locale;
  variant: "owner" | "staff";
}) {
  const t = getDictionary(locale);
  const pathname = usePathname();

  const items =
    variant === "owner"
      ? [
          { href: "/aaj", label: t.nav.aaj, icon: Home },
          { href: "/hafta", label: t.nav.hafta, icon: Calendar },
          { href: "/staff", label: t.nav.staff, icon: Users },
          { href: "/settings", label: t.nav.settings, icon: Settings },
        ]
      : [
          { href: "/aaj", label: t.nav.aaj, icon: Home },
          { href: "/pehle", label: t.nav.pehle, icon: Calendar },
          { href: "/settings", label: t.nav.settings, icon: Settings },
        ];

  return (
    <nav
      aria-label={t.nav.aaj}
      className="sticky bottom-0 z-30 border-t border-paper-200 bg-paper-0 pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {/* A fixed 4rem tall, so a screen with its own bottom bar (task actions)
          can pin that bar exactly above this one. */}
      <ul className="mx-auto flex h-16 max-w-md">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-tap flex-col items-center justify-center gap-1 py-2",
                  active ? "text-neel-700" : "text-ink-500",
                )}
              >
                <Icon className="size-6" aria-hidden="true" />
                <span className="text-[12px] leading-none font-semibold">
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
