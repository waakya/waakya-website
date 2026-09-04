import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLocale } from "@/lib/i18n/server";
import { getViewer } from "@/lib/auth/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Login" };

export default async function LoginPage() {
  const viewer = await getViewer();
  if (viewer) redirect(viewer.org ? "/aaj" : "/setup");

  const locale = await getLocale();
  return <LoginForm locale={locale} />;
}
