import type { Metadata } from "next";
import { requireOrg } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n";

export const metadata: Metadata = { title: "Aaj" };

// Slice 3 fills in the task list; Slice 7 finishes the dashboard.
export default async function AajPage() {
  const viewer = await requireOrg();
  const t = getDictionary(viewer.org.language);

  return (
    <main className="p-4">
      <h1 className="text-[24px] leading-[30px] font-bold">{t.time.aaj}</h1>
      <p className="mt-1 text-[15px] text-ink-500">{viewer.org.name}</p>
    </main>
  );
}
