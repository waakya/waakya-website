import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireViewer } from "@/lib/auth/session";
import { getLocale } from "@/lib/i18n/server";
import { SetupForm } from "./setup-form";

export const metadata: Metadata = { title: "Setup" };

export default async function SetupPage() {
  const viewer = await requireViewer();
  if (viewer.org) redirect("/aaj");

  return <SetupForm locale={await getLocale()} />;
}
