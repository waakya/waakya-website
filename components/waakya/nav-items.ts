import {
  Bell,
  CalendarCheck,
  Contact,
  FilePlus2,
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
const ALL_ON: ReadonlySet<ModuleKey> = new Set<ModuleKey>(["attendance", "checklists"]);

function onlyEnabled(items: NavItem[], modules: ReadonlySet<ModuleKey>): NavItem[] {
  return items.filter((item) => !item.module || modules.has(item.module));
}

/**
 * The Design V3 map, in one place so the sidebar, the bottom bar and the More
 * screen can never disagree.
 *
 * A place earns the top level only if that role uses it most days (see
 * docs/design-v3/WAAKYA_V3_INFORMATION_ARCHITECTURE.md): everyone talks and
 * has a Today; people who run work also browse Work. Everything else is one
 * level down, under More, or arrives in context (an approval in Today, a
 * document on a task). Nothing is removed; management actions are still
 * refused by the database for people who may not take them.
 *
 * Module destinations (customers, records, vendors, campaigns, automations)
 * appear only when the business has that capability switched on.
 */
export function mainNav(locale: Locale, variant: "owner" | "staff", modules: ReadonlySet<ModuleKey> = ALL_ON): NavItem[] {
  const n = getPhase1(locale).nav;
  return onlyEnabled(
    [
      { href: "/aaj", label: n.today, icon: Home },
      { href: "/baat", label: n.conversations, icon: MessageSquare },
      ...(variant === "owner"
        ? [{ href: "/work", label: n.work, icon: SquareCheckBig, also: ["/kaam", "/naya", "/hafta", "/pehle"] }]
        : []),
    ],
    modules,
  );
}

/** Everything else, in two groups: the business, then the tools. */
export function moreNav(
  locale: Locale,
  variant: "owner" | "staff",
  unread: number,
  routineLabel: string,
  modules: ReadonlySet<ModuleKey> = ALL_ON,
): { business: NavItem[]; tools: NavItem[] } {
  const n = getPhase1(locale).nav;
  const ux = getUx(locale).nav;
  const m = getPlatform(locale).modules.names;
  return {
    business: onlyEnabled(
      [
        // Staff reach their own full list from here (Today shows the day).
        ...(variant === "staff"
          ? [{ href: "/work", label: n.work, icon: SquareCheckBig, also: ["/kaam", "/hafta", "/pehle"] }]
          : []),
        { href: "/crm", label: m.crm, icon: Contact, module: "crm" },
        { href: "/projects", label: n.projects, icon: FolderKanban },
        { href: "/records", label: m.records, icon: Layers, module: "records" },
        { href: "/vendors", label: m.vendors, icon: Truck, module: "vendors" },
        { href: "/documents", label: n.documents, icon: FileText },
        { href: "/documents/templates", label: ux.templates, icon: FilePlus2 },
        { href: "/hazri", label: ux.attendance, icon: CalendarCheck, module: "attendance" },
        { href: "/approvals", label: n.approvals, icon: ShieldCheck },
        ...(variant === "owner"
          ? [
              { href: "/campaigns", label: m.campaigns, icon: Megaphone, module: "campaigns" as ModuleKey },
              { href: "/automations", label: m.automation, icon: Workflow, module: "automation" as ModuleKey },
              { href: "/staff", label: n.team, icon: Users },
            ]
          : []),
      ],
      modules,
    ),
    tools: onlyEnabled(
      [
        { href: "/search", label: n.search, icon: Search },
        { href: "/khabar", label: n.updates, icon: Bell, badge: unread },
        ...(variant === "owner" ? [{ href: "/checklists", label: routineLabel, icon: ListChecks, module: "checklists" as ModuleKey }] : []),
        { href: "/settings", label: n.settings, icon: Settings },
      ],
      modules,
    ),
  };
}

/** @deprecated V2 name, kept so nothing outside the shell breaks. */
export function primaryNav(locale: Locale, variant: "owner" | "staff", modules: ReadonlySet<ModuleKey> = ALL_ON): NavItem[] {
  const more = moreNav(locale, variant, 0, "", modules);
  return [...mainNav(locale, variant, modules), ...more.business.filter((item) => item.href !== "/documents/templates")];
}

/** @deprecated V2 name. */
export function utilityNav(
  locale: Locale,
  variant: "owner" | "staff",
  unread: number,
  routineLabel: string,
  modules: ReadonlySet<ModuleKey> = ALL_ON,
): NavItem[] {
  return moreNav(locale, variant, unread, routineLabel, modules).tools;
}

export function isActive(pathname: string, item: NavItem): boolean {
  if (item.href === "/documents") {
    // Templates has its own row; Documents is not "active" there.
    return pathname === "/documents" || (pathname.startsWith("/documents/") && !pathname.startsWith("/documents/templates"));
  }
  const paths = [item.href, ...(item.also ?? [])];
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}
