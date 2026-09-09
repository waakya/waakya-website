import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLocale } from "@/lib/i18n/server";
import { getViewer } from "@/lib/auth/session";
import { guestLoginEnabled } from "@/lib/auth/guest";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Login" };

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const { next } = await searchParams;
  // Only same-site paths: an open redirect here would let an invite link be
  // rewritten to point at somebody else's site.
  const safeNext =
    typeof next === "string" && /^\/[^/\\]/.test(next) ? next : null;

  const viewer = await getViewer();
  if (viewer) redirect(safeNext ?? (viewer.org ? "/aaj" : "/setup"));

  const locale = await getLocale();
  return (
    <LoginForm locale={locale} next={safeNext} guest={guestLoginEnabled()} />
  );
}
