import type { Metadata } from "next";
import { requireOrg, canManage } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n";
import { BottomNav } from "@/components/vaakya/bottom-nav";

export const metadata: Metadata = { title: "Hafta" };

// Slice 7 fills this in. It exists now so no nav item points at a 404.
export default async function HaftaPage() {
  const viewer = await requireOrg();
  const t = getDictionary(viewer.org.language);

  return (
    <div className="flex min-h-dvh flex-col">
      <main className="flex-1 p-4">
        <h1 className="text-[24px] leading-[30px] font-bold">{t.nav.hafta}</h1>
      </main>
      <BottomNav
        locale={viewer.org.language}
        variant={canManage(viewer.role) ? "owner" : "staff"}
      />
    </div>
  );
}
