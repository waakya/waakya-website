import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ListChecks } from "lucide-react";

import { requireOrg, canManage } from "@/lib/auth/session";
import { getChecklists } from "@/lib/checklists/queries";
import { getOrgMembers } from "@/lib/org/members";
import { getDictionary } from "@/lib/i18n";
import { BottomNav } from "@/components/vaakya/bottom-nav";
import { ChecklistEditor } from "./checklist-editor";

export const metadata: Metadata = { title: "Roz ka kaam" };

/**
 * The owner's routines. Set up once, and the morning list sends itself — which
 * is the retention hook: the app becomes part of opening the shop rather than
 * something to remember to use.
 */
export default async function ChecklistsPage() {
  const viewer = await requireOrg();
  if (!canManage(viewer.role)) redirect("/aaj");

  const locale = viewer.org.language;
  const t = getDictionary(locale);
  const [checklists, members] = await Promise.all([
    getChecklists(viewer.org.id),
    getOrgMembers(viewer.org.id),
  ]);

  return (
    <div className="flex min-h-dvh flex-col">
      <main className="flex-1 p-4 pb-6">
        <h1 className="text-[24px] leading-[30px] font-bold text-ink-900">
          {t.checklists.title}
        </h1>
        <p className="mt-0.5 text-[15px] leading-[20px] text-ink-500">
          {t.checklists.subtitle}
        </p>

        {checklists.length === 0 ? (
          <div className="mt-6 flex flex-col items-center gap-2 rounded-card border border-dashed border-paper-300 p-6 text-center">
            <ListChecks className="size-7 text-ink-400" aria-hidden="true" />
            <p className="text-[17px] font-bold text-ink-900">
              {t.checklists.empty}
            </p>
            <p className="text-[15px] leading-[20px] text-ink-500">
              {t.checklists.emptyHelp}
            </p>
          </div>
        ) : null}

        <ChecklistEditor
          locale={locale}
          checklists={checklists}
          members={members.map((m) => ({ id: m.userId, name: m.name }))}
        />
      </main>

      <BottomNav locale={locale} variant="owner" />
    </div>
  );
}
