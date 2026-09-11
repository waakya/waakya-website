"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button, buttonVariants } from "@/components/ui/button";
import { getDictionary, type Locale } from "@/lib/i18n";
import { acceptInvite } from "@/lib/actions/org";

export function JoinForm({
  locale,
  token,
  signedIn,
}: {
  locale: Locale;
  token: string;
  signedIn: boolean;
}) {
  const t = getDictionary(locale);
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  if (!signedIn) {
    return (
      <div className="mt-8">
        <p className="text-[15px] leading-[20px] text-ink-700">
          {t.org.joinSignIn}
        </p>
        {/* A plain link styled as the primary button: it navigates, so it
            should read as a link, not as a button. */}
        <Link
          href={`/login?next=/join/${token}`}
          className={buttonVariants({ size: "block", className: "mt-3" })}
        >
          {t.auth.title}
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8">
      {error ? (
        <p
          role="alert"
          className="mb-3 rounded-card bg-laal-100 px-3 py-2 text-[15px] leading-[20px] text-laal-700"
        >
          {error}
        </p>
      ) : null}
      <Button
        size="staffPrimary"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await acceptInvite(token);
            if (!result.ok) setError(result.message);
            else router.replace("/aaj");
          })
        }
      >
        {pending ? t.common.loading : t.org.joinAccept}
      </Button>
    </div>
  );
}
