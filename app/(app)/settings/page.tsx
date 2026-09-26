import type { Metadata } from "next";
import { Globe, History, Link2, ListChecks, LogOut, SlidersHorizontal } from "lucide-react";
import Link from "next/link";

import { requireViewer, canManage } from "@/lib/auth/session";
import { getDictionary, toLocale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { Card } from "@/components/ui/card";
import { AppShell } from "@/components/waakya/app-shell";
import { PageHeader } from "@/components/waakya/page";
import { getUnreadCount } from "@/lib/notify/inbox";
import { SettingsLanguage } from "./settings-language";
import { SettingsName } from "./settings-name";
import { BusinessProfileForm } from "@/components/waakya/business-profile-form";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./sign-out-button";
import { OrgSwitcher } from "./org-switcher";
import { getPlatform } from "@/lib/i18n/platform";
import { viewerCan } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Settings" };

/** One setting per row: its name, then its control — side by side on a desk. */
const ROW =
  "mt-6 border-t border-line pt-6 first-of-type:mt-6 lg:grid lg:grid-cols-[12rem_minmax(0,1fr)] lg:items-start lg:gap-8";

export default async function SettingsPage() {
  const viewer = await requireViewer();
  // Their own choice if they have made one; otherwise the org's language.
  const locale = toLocale(await getLocale(), viewer.org?.language ?? "hi");
  const t = getDictionary(locale);

  return (
    <AppShell
      locale={locale}
      variant={canManage(viewer.role) ? "owner" : "staff"}
      orgName={viewer.org?.name ?? ""}
      personName={viewer.fullName ?? "—"}
      roleLabel={viewer.role ? getDictionary(locale).org.roles[viewer.role] : ""}
      unread={await getUnreadCount()}
    >
      <main className="flex-1 p-4 pb-10 lg:px-0">
        <PageHeader title={t.settings.title} />

        <section className={ROW}>
          <h2 className="mb-2 text-body font-bold text-fg lg:mb-0 lg:pt-2.5">
            {t.settings.language}
          </h2>
          <div className="min-w-0"><SettingsLanguage locale={locale} /></div>
        </section>

        <section className={ROW}>
          <h2 className="mb-2 text-body font-bold text-fg lg:mb-0 lg:pt-2.5">
            {t.settings.yourName}
          </h2>
          <div className="min-w-0"><SettingsName locale={locale} initialName={viewer.fullName ?? ""} /></div>
        </section>

        {viewer.org && (viewer.role === "owner" || viewer.role === "admin") ? (
          <section className={ROW}>
            <h2 className="mb-2 text-body font-bold text-fg lg:mb-0 lg:pt-2.5">
              {t.settings.business}
            </h2>
            <Card className="min-w-0 p-4">
              <BusinessProfileForm locale={locale} initial={await businessProfile(viewer.org.id, viewer.org.name)} />
            </Card>
          </section>
        ) : null}

        {viewer.org && !(viewer.role === "owner" || viewer.role === "admin") ? (
          <section className={ROW}>
            <h2 className="mb-2 text-body font-bold text-fg lg:mb-0 lg:pt-2.5">
              {t.settings.business}
            </h2>
            <Card className="p-4">
              <p className="text-body-lg font-bold text-ink-900">
                {viewer.org.name}
              </p>
              <p className="mt-0.5 text-label text-ink-500">
                {viewer.role ? t.org.roles[viewer.role] : null}
              </p>
            </Card>
          </section>
        ) : null}

        <OrgSwitcher locale={locale} current={viewer.org?.id ?? null} memberships={viewer.memberships} />

        {viewer.org && (viewerCan(viewer, "modules.manage") || viewerCan(viewer, "audit.read")) ? (
          <section className={ROW}>
            <h2 className="mb-2 text-body font-bold text-fg lg:mb-0 lg:pt-2.5">
              {getPlatform(locale).modules.title}
            </h2>
            <ul className="min-w-0 overflow-hidden rounded-card border border-line bg-surface shadow-card">
              {viewerCan(viewer, "modules.manage") ? (
                <li className="border-b border-line/70">
                  <Link href="/settings/modules" className="flex min-h-tap items-center gap-3 p-4 transition-colors duration-150 hover:bg-paper-50">
                    <SlidersHorizontal className="size-5 text-neel-700" aria-hidden="true" />
                    <span className="flex-1 text-body font-semibold text-ink-900">{getPlatform(locale).modules.title}</span>
                  </Link>
                </li>
              ) : null}
              {viewerCan(viewer, "integrations.manage") && viewer.modules.has("website_integration") ? (
                <li className="border-b border-line/70">
                  <Link href="/settings/integrations" className="flex min-h-tap items-center gap-3 p-4 transition-colors duration-150 hover:bg-paper-50">
                    <Globe className="size-5 text-neel-700" aria-hidden="true" />
                    <span className="flex-1 text-body font-semibold text-ink-900">{getPlatform(locale).modules.names.website_integration}</span>
                  </Link>
                </li>
              ) : null}
              {viewerCan(viewer, "domains.manage") && viewer.modules.has("custom_domains") ? (
                <li className="border-b border-line/70">
                  <Link href="/settings/domains" className="flex min-h-tap items-center gap-3 p-4 transition-colors duration-150 hover:bg-paper-50">
                    <Link2 className="size-5 text-neel-700" aria-hidden="true" />
                    <span className="flex-1 text-body font-semibold text-ink-900">{getPlatform(locale).modules.names.custom_domains}</span>
                  </Link>
                </li>
              ) : null}
              {viewerCan(viewer, "audit.read") ? (
                <li>
                  <Link href="/settings/history" className="flex min-h-tap items-center gap-3 p-4 transition-colors duration-150 hover:bg-paper-50">
                    <History className="size-5 text-neel-700" aria-hidden="true" />
                    <span className="flex-1 text-body font-semibold text-ink-900">{getPlatform(locale).audit.title}</span>
                  </Link>
                </li>
              ) : null}
            </ul>
          </section>
        ) : null}

        {canManage(viewer.role) && viewer.modules.has("checklists") ? (
          <section className={ROW}>
            <h2 className="mb-2 text-body font-bold text-fg lg:mb-0 lg:pt-2.5">
              {t.checklists.title}
            </h2>
            <Link
              href="/checklists"
              className="flex min-h-tap items-center gap-3 rounded-card border border-line bg-surface p-4 shadow-card transition-colors duration-150 hover:border-neel-300"
            >
              <ListChecks className="size-5 text-neel-700" aria-hidden="true" />
              <span className="flex-1 text-body font-semibold text-ink-900">
                {t.checklists.title}
              </span>
            </Link>
          </section>
        ) : null}

        <section className={ROW}>
          <h2 className="mb-2 text-body font-bold text-fg lg:mb-0 lg:pt-2.5">
            {t.settings.account}
          </h2>
          <div className="min-w-0">
            {viewer.email ? (
              <Card className="p-4">
                <p className="text-body break-all text-fg-muted">{viewer.email}</p>
              </Card>
            ) : null}
            <SignOutButton label={t.auth.signOut} icon={<LogOut />} />
          </div>
        </section>
      </main>

    </AppShell>
  );
}

async function businessProfile(orgId: string, fallbackName: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orgs")
    .select("name, address, gstin, phone, email")
    .eq("id", orgId)
    .single();
  return {
    name: data?.name ?? fallbackName,
    address: data?.address ?? "",
    gstin: data?.gstin ?? "",
    phone: data?.phone ?? "",
    email: data?.email ?? "",
  };
}
