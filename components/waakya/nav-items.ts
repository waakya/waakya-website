import {
  Bell,
  CalendarCheck,
  Contact,
  FileText,
  FolderKanban,
  Home,
  Layers,
  ListChecks,
  Megaphone,
  MessageSquare,
  Search,
  Settings,
  ShieldCheck,
  SquareCheckBig,
  Truck,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";

import { getPhase1 } from "@/lib/i18n/phase1";
import { getUx } from "@/lib/i18n/ux";
import { getPlatform } from "@/lib/i18n/platform";
import type { Locale } from "@/lib/i18n";
import type { ModuleKey } from "@/lib/modules/catalog";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  /** Other paths that count as being inside this destination. */
  also?: string[];
  /** The capability this destination belongs to; hidden when it is off. */
  module?: ModuleKey;
}

/** Everything on when nobody says otherwise: the Phase-1 product. */
const ALL_ON = new Set<ModuleKey>(["attendance", "checklists"]);

/**
 * The navigation, in one place so the sidebar, the bottom bar and the More
 * screen can never disagree.
 *
 * Core destinations answer "where is the work?"; module destinations appear
 * only when the business has the capability on. Staff see the same map minus
 * management screens — management actions are hidden on the screens
 * themselves and refused by the database.
 */
export function primaryNav(
  locale: Locale,
  variant: "owner" | "staff",
  modules: ReadonlySet<ModuleKey> = ALL_ON,
): NavItem[] {
  const n = getPhase1(locale).nav;
  const ux = getUx(locale).nav;
  const m = getPlatform(locale).modules.names;
  const items: NavItem[] = [
    { href: "/aaj", label: n.today, icon: Home },
    { href: "/baat", label: n.conversations, icon: MessageSquare },
    { href: "/work", label: n.work, icon: SquareCheckBig, also: ["/kaam", "/naya", "/hafta", "/pehle"] },
    { href: "/crm", label: m.crm, icon: Contact, module: "crm" },
    { href: "/projects", label: n.projects, icon: FolderKanban },
    { href: "/records", label: m.records, icon: Layers, module: "records" },
    { href: "/vendors", label: m.vendors, icon: Truck, module: "vendors" },
    { href: "/documents", label: n.documents, icon: FileText },
    { href: "/hazri", label: ux.attendance, icon: CalendarCheck, module: "attendance" },
    { href: "/approvals", label: n.approvals, icon: ShieldCheck },
    ...(variant === "owner"
      ? [
          { href: "/campaigns", label: m.campaigns, icon: Megaphone, module: "campaigns" as ModuleKey },
          { href: "/automations", label: m.automation, icon: Workflow, module: "automation" as ModuleKey },
          { href: "/staff", label: n.team, icon: Users },
        ]
      : []),
  ];
  return items.filter((item) => !item.module || modules.has(item.module));
}

export function utilityNav(
  locale: Locale,
  variant: "owner" | "staff",
  unread: number,
  routineLabel: string,
  modules: ReadonlySet<ModuleKey> = ALL_ON,
): NavItem[] {
  const n = getPhase1(locale).nav;
  const items: NavItem[] = [
    { href: "/search", label: n.search, icon: Search },
    { href: "/khabar", label: n.updates, icon: Bell, badge: unread },
    ...(variant === "owner" ? [{ href: "/checklists", label: routineLabel, icon: ListChecks, module: "checklists" as ModuleKey }] : []),
    { href: "/settings", label: n.settings, icon: Settings },
  ];
  return items.filter((item) => !item.module || modules.has(item.module));
}

export function isActive(pathname: string, item: NavItem): boolean {
  const paths = [item.href, ...(item.also ?? [])];
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}
