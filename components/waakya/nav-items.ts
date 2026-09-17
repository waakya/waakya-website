import {
  Bell,
  CalendarCheck,
  FileText,
  FolderKanban,
  Home,
  ListChecks,
  MessageSquare,
  Search,
  Settings,
  ShieldCheck,
  SquareCheckBig,
  Users,
  type LucideIcon,
} from "lucide-react";

import { getPhase1 } from "@/lib/i18n/phase1";
import { getUx } from "@/lib/i18n/ux";
import type { Locale } from "@/lib/i18n";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  /** Other paths that count as being inside this destination. */
  also?: string[];
}

/**
 * The Phase-1 navigation, in one place so the sidebar, the bottom bar and the
 * More screen can never disagree.
 *
 * Eight destinations answer "where is the work?"; three utilities sit apart.
 * Staff see the same map minus nothing they could not use anyway — management
 * actions are hidden on the screens themselves and refused by the database.
 */
export function primaryNav(locale: Locale, variant: "owner" | "staff"): NavItem[] {
  const n = getPhase1(locale).nav;
  const ux = getUx(locale).nav;
  return [
    { href: "/aaj", label: n.today, icon: Home },
    { href: "/baat", label: n.conversations, icon: MessageSquare },
    { href: "/work", label: n.work, icon: SquareCheckBig, also: ["/kaam", "/naya", "/hafta", "/pehle"] },
    { href: "/projects", label: n.projects, icon: FolderKanban },
    { href: "/documents", label: n.documents, icon: FileText },
    { href: "/hazri", label: ux.attendance, icon: CalendarCheck },
    { href: "/approvals", label: n.approvals, icon: ShieldCheck },
    ...(variant === "owner" ? [{ href: "/staff", label: n.team, icon: Users }] : []),
  ];
}

export function utilityNav(
  locale: Locale,
  variant: "owner" | "staff",
  unread: number,
  routineLabel: string,
): NavItem[] {
  const n = getPhase1(locale).nav;
  return [
    { href: "/search", label: n.search, icon: Search },
    { href: "/khabar", label: n.updates, icon: Bell, badge: unread },
    ...(variant === "owner" ? [{ href: "/checklists", label: routineLabel, icon: ListChecks }] : []),
    { href: "/settings", label: n.settings, icon: Settings },
  ];
}

export function isActive(pathname: string, item: NavItem): boolean {
  const paths = [item.href, ...(item.also ?? [])];
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}
