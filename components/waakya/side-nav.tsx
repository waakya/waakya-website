"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Search } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Wordmark } from "@/components/waakya/wordmark";
import { getDictionary, type Locale } from "@/lib/i18n";
import { getDesign } from "@/lib/i18n/design";
import { cn } from "@/lib/utils";
import type { ModuleKey } from "@/lib/modules/catalog";
import { isActive, mainNav, moreNav, type NavItem } from "./nav-items";

/**
 * The desktop sidebar (V3): the business, a way to find anything, the two or
 * three places this person uses every day, and everything else folded under
 * More — open by itself when you are inside one of those places, so you always
 * see where you are. Below `lg` the bottom bar takes over.
 */
export function SideNav({
  locale,
  variant,
  orgName,
  personName,
  roleLabel,
  unread,
  modules,
}: {
  locale: Locale;
  variant: "owner" | "staff";
  orgName: string;
  personName: string;
  roleLabel: string;
  unread: number;
  modules?: ModuleKey[];
}) {
  const on = modules ? new Set<ModuleKey>(modules) : undefined;
  const t = getDictionary(locale);
  const d = getDesign(locale);
  const pathname = usePathname();
  const router = useRouter();
  const main = mainNav(locale, variant, on);
  const more = moreNav(locale, variant, unread, t.nav.checklists, on);
  const insideMore = [...more.business, ...more.tools].some((item) => isActive(pathname, item));

  // ⌘K / Ctrl+K from anywhere: search is how you go somewhere you rarely go.
  React.useEffect(() => {
    function onKey(event: KeyboardEvent) {
      // Never while typing: a half-written message must not be lost.
      const target = event.target as HTMLElement | null;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        router.push("/search");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  const row = (item: NavItem, quiet = false) => {
    const active = isActive(pathname, item);
    const Icon = item.icon;
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          aria-current={active ? "page" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-button px-3 font-semibold transition-colors duration-150",
            quiet ? "min-h-10 text-body-sm" : "min-h-11 text-body",
            active ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white",
          )}
        >
          <Icon className={quiet ? "size-4 shrink-0" : "size-[18px] shrink-0"} aria-hidden="true" />
          <span className="flex-1">{item.label}</span>
          {item.badge ? (
            // A number, as text: a dot said "something" to sighted people only.
            <span className="num rounded-full bg-white px-1.5 text-micro font-bold text-neel-800">{item.badge > 99 ? "99+" : item.badge}</span>
          ) : null}
        </Link>
      </li>
    );
  };

  return (
    <nav aria-label={orgName || "Waakya"} className="sticky top-0 flex h-dvh flex-col overflow-y-auto p-4 text-white">
      <Link href="/aaj" className="flex items-center gap-2 px-2 py-3">
        <Wordmark size={24} onNeel />
      </Link>
      <p className="mt-1 truncate px-3 text-body font-bold" title={orgName}>{orgName}</p>

      <Link
        href="/search"
        className="mt-4 flex min-h-10 items-center gap-2 rounded-button bg-white/10 px-3 text-body-sm text-white/65 transition-colors duration-150 hover:bg-white/15 hover:text-white"
      >
        <Search className="size-4 shrink-0" aria-hidden="true" />
        <span className="flex-1 truncate">{d.v3.searchHint}</span>
        <kbd className="num rounded-[6px] border border-white/20 px-1.5 text-micro text-white/60">⌘K</kbd>
      </Link>

      <ul className="mt-4 flex flex-col gap-0.5">{main.map((item) => row(item))}</ul>

      <details className="group mt-4" open={insideMore || undefined}>
        <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-button px-3 text-body-sm font-semibold text-white/70 hover:text-white">
          {d.v3.moreLabel}
          {unread > 0 ? (
            <span title={`${t.inbox.title} · ${t.inbox.unread(unread)}`} className="num rounded-full bg-white px-1.5 text-micro font-bold text-neel-800 group-open:hidden">
              {unread > 99 ? "99+" : unread}
              <span className="sr-only"> {t.inbox.title}</span>
            </span>
          ) : null}
          <ChevronDown className="ml-auto size-4 transition-transform duration-150 group-open:rotate-180" aria-hidden="true" />
        </summary>
        <ul className="mt-1 flex flex-col gap-0.5">{more.business.map((item) => row(item, true))}</ul>
        <div className="mx-3 my-2 h-px bg-white/10" aria-hidden="true" />
        <ul className="flex flex-col gap-0.5">{more.tools.map((item) => row(item, true))}</ul>
      </details>

      <div className="mt-auto flex items-center gap-3 rounded-card bg-white/10 p-3">
        <Avatar name={personName} size={34} className="bg-white text-neel-700" />
        <div className="min-w-0">
          <p className="truncate text-body-sm leading-tight font-bold">{personName}</p>
          <p className="text-caption text-white/60">{roleLabel}</p>
        </div>
      </div>
    </nav>
  );
}
