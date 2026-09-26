import type { Metadata } from "next";

import { getLocale } from "@/lib/i18n/server";
import { getPortal } from "@/lib/i18n/portal";
import { requireCustomer } from "@/lib/portal/principal";
import { Wordmark } from "@/components/waakya/wordmark";
import { SignOutButton } from "@/app/(app)/settings/sign-out-button";
import { getDictionary } from "@/lib/i18n";
import { LogOut } from "lucide-react";

export const metadata: Metadata = { title: { default: "Your project", template: "%s · Waakya" }, robots: { index: false, follow: false } };

/**
 * The customer's frame: no business navigation, no counters, no team. Their
 * business's name at the top, the project below, one way out. Every page
 * under here requires the customer principal; a member with no customer
 * access is sent to sign in, never to their workspace by mistake.
 */
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const principal = await requireCustomer();
  const locale = await getLocale();
  const t = getPortal(locale).portal;
  const d = getDictionary(locale);
  const business = principal.businesses[0];
  return (
    <div className="min-h-dvh bg-paper-50">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <span className="min-w-0 flex-1">
            <span className="block truncate text-body font-bold text-fg">{business?.orgName}</span>
            <span className="block truncate text-caption text-fg-subtle">{business?.contactName}</span>
          </span>
          <Wordmark size={20} />
        </div>
      </header>
      <div className="mx-auto max-w-3xl">{children}</div>
      <footer className="mx-auto max-w-3xl px-4 py-8">
        <SignOutButton label={t.signOut || d.auth.signOut} icon={<LogOut />} />
      </footer>
    </div>
  );
}
