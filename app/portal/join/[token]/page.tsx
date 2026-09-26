import type { Metadata } from "next";
import Link from "next/link";

import { getLocale } from "@/lib/i18n/server";
import { getPortal } from "@/lib/i18n/portal";
import { getViewer } from "@/lib/auth/session";
import { Wordmark } from "@/components/waakya/wordmark";
import { buttonVariants } from "@/components/ui/button";
import { AcceptInvite } from "./accept-invite";

export const metadata: Metadata = { title: "Your project page", robots: { index: false, follow: false } };

/** The link the business sent: sign in with that address, then the project opens. */
export default async function PortalJoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const locale = await getLocale();
  const t = getPortal(locale).portal.invite;
  const viewer = await getViewer();
  const safeToken = /^[0-9a-f]{32}$/.test(token) ? token : null;
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 p-6">
      <Wordmark size={28} />
      <div>
        <h1 className="text-title font-bold text-fg">{t.title}</h1>
        <p className="mt-1 text-body text-fg-subtle">{t.help}</p>
      </div>
      {!safeToken ? (
        <p role="alert" className="text-body text-laal-700">{t.notFound}</p>
      ) : viewer ? (
        <AcceptInvite locale={locale} token={safeToken} />
      ) : (
        <Link href={`/login?next=${encodeURIComponent(`/portal/join/${safeToken}`)}`} className={buttonVariants({ size: "block" })}>
          {t.signInFirst}
        </Link>
      )}
    </main>
  );
}
