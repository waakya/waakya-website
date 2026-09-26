import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLocale } from "@/lib/i18n/server";
import { getViewer } from "@/lib/auth/session";
import { getCustomerPrincipal } from "@/lib/portal/principal";
import { guestLoginEnabled } from "@/lib/auth/guest";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Login" };

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const { next, oauth } = await searchParams;
  // Only same-site paths: an open redirect here would let an invite link be
  // rewritten to point at somebody else's site.
  const safeNext =
    typeof next === "string" && /^\/[^/\\]/.test(next) ? next : null;

  const viewer = await getViewer();
  if (viewer) {
    const principal = await getCustomerPrincipal();
    // A signed-in person is sent on to `next` only where they can enter it:
    // the portal needs customer access, the workspace needs a business. A
    // revoked customer bouncing between /login and /portal was the bug.
    if (safeNext && (!safeNext.startsWith("/portal") || safeNext.startsWith("/portal/join") || principal)) redirect(safeNext);
    if (viewer.org) redirect("/aaj");
    redirect(principal ? "/portal" : "/setup");
  }

  const locale = await getLocale();
  return (
    <LoginForm
      locale={locale}
      next={safeNext}
      guest={guestLoginEnabled()}
      oauthFailed={oauth === "failed"}
    />
  );
}
