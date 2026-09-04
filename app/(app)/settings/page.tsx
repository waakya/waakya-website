import type { Metadata } from "next";
import { ListChecks, LogOut } from "lucide-react";
import Link from "next/link";

import { requireViewer, canManage } from "@/lib/auth/session";
import { getDictionary, toLocale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { Card } from "@/components/ui/card";
import { BottomNav } from "@/components/vaakya/bottom-nav";
import { SettingsLanguage } from "./settings-language";
import { SignOutButton } from "./sign-out-button";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const viewer = await requireViewer();
  // Their own choice if they have made one; otherwise the org's language.
  const locale = toLocale(await getLocale(), viewer.org?.language ?? "hi");
  const t = getDictionary(locale);

  return (
    <div className="flex min-h-dvh flex-col">
      <main className="flex-1 p-4">
        <h1 className="text-[24px] leading-[30px] font-bold text-ink-900">
          {t.settings.title}
        </h1>

        <section className="mt-5">
          <h2 className="mb-2 text-[13px] leading-[18px] font-semibold text-ink-700">
            {t.settings.language}
          </h2>
          <SettingsLanguage locale={locale} />
        </section>

        {viewer.org ? (
          <section className="mt-6">
            <h2 className="mb-2 text-[13px] leading-[18px] font-semibold text-ink-700">
              {t.settings.business}
            </h2>
            <Card className="p-4">
              <p className="text-[17px] font-bold text-ink-900">
                {viewer.org.name}
              </p>
              <p className="mt-0.5 text-[13px] text-ink-500">
                {viewer.role ? t.org.roles[viewer.role] : null}
              </p>
            </Card>
          </section>
        ) : null}

        {canManage(viewer.role) ? (
          <section className="mt-6">
            <h2 className="mb-2 text-[13px] leading-[18px] font-semibold text-ink-700">
              {t.checklists.title}
            </h2>
            <Link
              href="/checklists"
              className="flex min-h-tap items-center gap-3 rounded-card border border-paper-200 bg-paper-0 p-4 shadow-card"
            >
              <ListChecks className="size-5 text-neel-700" aria-hidden="true" />
              <span className="flex-1 text-[15px] font-semibold text-ink-900">
                {t.checklists.title}
              </span>
            </Link>
          </section>
        ) : null}

        <section className="mt-6">
          <h2 className="mb-2 text-[13px] leading-[18px] font-semibold text-ink-700">
            {t.settings.account}
          </h2>
          <Card className="p-4">
            <p className="text-[15px] break-all text-ink-700">{viewer.email}</p>
          </Card>
          <SignOutButton label={t.auth.signOut} icon={<LogOut />} />
        </section>
      </main>

      <BottomNav
        locale={locale}
        variant={canManage(viewer.role) ? "owner" : "staff"}
      />
    </div>
  );
}
