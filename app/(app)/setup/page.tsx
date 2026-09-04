import type { Metadata } from "next";
import { requireViewer } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Setup" };

// Slice 2 builds org creation here.
export default async function SetupPage() {
  const viewer = await requireViewer();
  if (viewer.org) redirect("/aaj");

  return (
    <main className="p-4">
      <h1 className="text-[24px] leading-[30px] font-bold">Business banayein</h1>
    </main>
  );
}
