import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth/session";
import { getDictionary, toLocale, type Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { Mark } from "@/components/waakya/mark";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { getUx } from "@/lib/i18n/ux";
import { JoinForm } from "./join-form";

export const metadata: Metadata = { title: "Join" };

/**
 * The invitee's first screen. It shows the business name and the name they
 * were invited under, and nothing else about the org — `invite_preview()`
 * returns no ids and no phone numbers.
 */
export default async function JoinPage({ params }: PageProps<"/join/[token]">) {
  const { token } = await params;
  const supabase = await createClient();
  const { data } = await supabase.rpc("invite_preview", { p_token: token });
  const invite = data?.[0];

  // The invitee is joining a specific business, so this screen speaks that
  // business's language rather than the app default — which is also the
  // language they will inherit when they join.
  const locale = invite
    ? toLocale(invite.org_language, await getLocale())
    : await getLocale();
  const t = getDictionary(locale);

  const viewer = await getViewer();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4">
      <div className="flex flex-1 flex-col pt-[10vh]">
        <Mark size={40} className="mx-auto" />

        {!invite ? (
          <>
            <p className="mt-8 rounded-card bg-laal-100 px-4 py-3 text-[17px] leading-[24px] text-laal-700">
              {t.org.joinNotFound}
            </p>
            <BackToApp viewer={viewer} label={t.time.aaj} locale={locale} />
          </>
        ) : invite.already_accepted ? (
          <>
            <p className="mt-8 rounded-card bg-amber-100 px-4 py-3 text-[17px] leading-[24px] text-amber-700">
              {t.org.joinUsed}
            </p>
            <BackToApp viewer={viewer} label={t.time.aaj} locale={locale} />
          </>
        ) : (
          <>
            <h1 className="mt-8 text-[24px] leading-[32px] font-bold text-ink-900">
              {t.org.joinTitle(invite.org_name)}
            </h1>
            <p className="mt-1 text-[15px] leading-[20px] text-ink-500">
              {t.org.joinSubtitle(invite.full_name)}
            </p>
            <JoinForm
              locale={locale}
              token={token}
              signedIn={Boolean(viewer)}
            />
          </>
        )}
      </div>
    </main>
  );
}

/** Someone already in a business should not be left on a dead end. */
function BackToApp({
  viewer,
  label,
  locale,
}: {
  viewer: Awaited<ReturnType<typeof getViewer>>;
  label: string;
  locale: Locale;
}) {
  if (!viewer?.org) {
    // A stranded invitee may already have an account, or just needs a way out.
    const ux = getUx(locale);
    return (
      <div className="mt-6 flex flex-col gap-2">
        <Link href="/login" className={buttonVariants({ size: "staff" })}>
          {ux.join.signIn}
        </Link>
        <Link href="/" className={buttonVariants({ variant: "outline", size: "staff" })}>
          {ux.join.home}
        </Link>
      </div>
    );
  }
  // A plain link, styled as a button: it navigates, so it should read as a
  // link to a screen reader rather than as a button.
  return (
    <Link
      href="/aaj"
      className={buttonVariants({ variant: "ghost", className: "mt-4 self-start" })}
    >
      {label}
    </Link>
  );
}
