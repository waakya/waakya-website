import type { Metadata } from "next";
import Link from "next/link";

import { getLocale } from "@/lib/i18n/server";
import { getUx } from "@/lib/i18n/ux";
import { buttonVariants } from "@/components/ui/button";
import { Wordmark } from "@/components/waakya/wordmark";
import { Illustration } from "@/components/waakya/illustrations";

export const metadata: Metadata = { title: "Page not found" };

/** A wrong or old link still lands somewhere that looks like Waakya, with a way on. */
export default async function NotFound() {
  const ux = getUx(await getLocale());
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-4 py-10 text-center">
      <Wordmark size={26} />
      <Illustration name="review" className="mt-8 h-32 w-auto" />
      <h1 className="mt-6 font-display text-[28px] leading-[1.1] font-extrabold text-ink-900">{ux.notFound.title}</h1>
      <p className="mt-2 text-[16px] text-ink-500">{ux.notFound.body}</p>
      <div className="mt-6 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
        <Link href="/" className={buttonVariants({ size: "owner" })}>
          {ux.notFound.home}
        </Link>
        <Link href="/login" className={buttonVariants({ variant: "outline", size: "owner" })}>
          {ux.notFound.signIn}
        </Link>
      </div>
    </main>
  );
}
