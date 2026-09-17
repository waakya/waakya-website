"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Avatar } from "@/components/ui/avatar";
import { Wordmark } from "@/components/waakya/wordmark";
import { getDictionary, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { isActive, primaryNav, utilityNav, type NavItem } from "./nav-items";

/**
 * The desktop sidebar: the wordmark, the business, eight destinations, the
 * utilities, and the person at the bottom. Below `lg` the bottom bar takes over.
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
  const primary = primaryNav(locale, variant);
  const utilities = utilityNav(locale, variant, unread, t.nav.checklists);

  const row = (item: NavItem) => {
    const active = isActive(pathname, item);
    const Icon = item.icon;
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          aria-current={active ? "page" : undefined}
          className={cn(
            "flex min-h-[42px] items-center gap-3 rounded-button px-3 text-[14.5px] font-semibold transition-colors",
            active ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white",
          )}
        >
          <Icon className="size-[18px] shrink-0" aria-hidden="true" />
          <span className="flex-1">{item.label}</span>
          {item.badge ? (
            <span className="num rounded-chip bg-white px-2 text-[12px] font-bold text-neel-700">
              {item.badge > 9 ? "9+" : item.badge}
            </span>
          ) : null}
        </Link>
      </li>
    );
  };

  return (
    <nav
      aria-label={orgName || "Waakya"}
      className="sticky top-0 flex h-dvh flex-col overflow-y-auto p-4 text-white"
    >
      <Link href="/aaj" className="flex items-center gap-2 px-2 py-3">
        <Wordmark size={24} onNeel />
      </Link>

      <p className="mt-3 px-3 text-[11px] font-semibold tracking-widest text-white/50 uppercase">
        {t.nav.businessLabel}
      </p>
      <p className="mb-3 px-3 text-[16px] leading-tight font-bold">{orgName}</p>

      <ul className="flex flex-col gap-0.5">{primary.map(row)}</ul>
      <div className="mx-3 my-3 h-px bg-white/10" aria-hidden="true" />
      <ul className="flex flex-1 flex-col gap-0.5">{utilities.map(row)}</ul>

      <div className="mt-4 flex items-center gap-3 rounded-card bg-white/10 p-3">
        <Avatar name={personName} size={34} className="bg-white text-neel-700" />
        <div className="min-w-0">
          <p className="truncate text-[14.5px] leading-tight font-bold">{personName}</p>
          <p className="text-[12.5px] text-white/60">{roleLabel}</p>
        </div>
      </div>
    </nav>
  );
}
