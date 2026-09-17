import "server-only";

import { canManage, type Viewer } from "@/lib/auth/session";
import { getDictionary, type Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { getUnreadCount } from "@/lib/notify/inbox";

/**
 * Everything the app shell needs, resolved once. Every signed-in screen passes
 * the same six things, so they are built in one place.
 */
export async function shellFor(viewer: Viewer): Promise<{
  locale: Locale;
  variant: "owner" | "staff";
  orgName: string;
  personName: string;
  roleLabel: string;
  unread: number;
}> {
  const [locale, unread] = await Promise.all([getLocale(), getUnreadCount()]);
  const t = getDictionary(locale);
  return {
    locale,
    variant: canManage(viewer.role) ? "owner" : "staff",
    orgName: viewer.org?.name ?? "",
    personName: viewer.fullName ?? "—",
    roleLabel: viewer.role ? t.org.roles[viewer.role] : "",
    unread,
  };
}
