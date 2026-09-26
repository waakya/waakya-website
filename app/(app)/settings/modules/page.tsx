import type { Metadata } from "next";

import { requireOrg, viewerCan } from "@/lib/auth/session";
import { shellFor } from "@/lib/auth/shell";
import { getPlatform } from "@/lib/i18n/platform";
import { getModuleStatuses } from "@/lib/modules/queries";
import { AppShell } from "@/components/waakya/app-shell";
import { ModuleList } from "./module-list";
import { PresetPicker } from "./preset-picker";

export const metadata: Metadata = { title: "Capabilities" };

/**
 * What the business uses. Core capabilities are listed so the picture is
 * complete; only optional ones carry a switch. Turning one off hides it and
 * refuses new writes; nothing is deleted.
 */
export default async function ModulesPage() {
  const viewer = await requireOrg();
  const shell = await shellFor(viewer);
  const t = getPlatform(shell.locale).modules;
  const manages = viewerCan(viewer, "modules.manage");
  const statuses = await getModuleStatuses(viewer.org.id);

  const areas = ["core", "operations", "customers", "growth", "platform"] as const;

  return (
    <AppShell {...shell}>
      <main className="flex-1 p-4 pb-8">
        <h1 className="text-[24px] leading-[30px] font-bold text-ink-900">{t.title}</h1>
        <p className="mt-0.5 text-[15px] leading-[20px] text-ink-500">{t.subtitle}</p>

        {manages ? <PresetPicker locale={shell.locale} /> : null}

        {areas.map((area) => (
          <section key={area} className="mt-6">
            <h2 className="mb-2 text-[13px] leading-[18px] font-semibold text-ink-700">{t.areas[area]}</h2>
            <ModuleList
              locale={shell.locale}
              manages={manages}
              items={statuses
                .filter((s) => s.area === area)
                .map((s) => ({
                  key: s.key,
                  core: s.core,
                  enabled: s.enabled,
                  requires: s.requires,
                }))}
            />
          </section>
        ))}
      </main>
    </AppShell>
  );
}
