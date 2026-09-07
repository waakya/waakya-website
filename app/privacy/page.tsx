import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { brandName, getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { Mark } from "@/components/waakya/mark";
import { BrandText } from "@/components/waakya/brand-text";

export const metadata: Metadata = { title: "Privacy" };

/**
 * The DPDP notice. It is linked from the consent line on the login screen, so
 * it has to be readable before anyone has an account — hence no auth, and the
 * reader's own language.
 */
export default async function PrivacyPage() {
  const locale = await getLocale();
  const t = getDictionary(locale);

  return (
    <main className="mx-auto min-h-dvh w-full max-w-md p-4">
      <header className="flex items-center gap-2">
        <Link
          href="/login"
          aria-label={t.actions.back}
          className="flex size-tap items-center justify-center rounded-full text-ink-900"
        >
          <ArrowLeft className="size-6" />
        </Link>
        <Mark size={24} />
        <h1 className="flex-1 text-[20px] leading-[26px] font-bold text-ink-900">
          {t.privacy.title}
        </h1>
      </header>

      <p className="num mt-4 text-[13px] text-ink-400">{t.privacy.updated}</p>
      <p className="mt-2 text-[17px] leading-[26px] text-ink-900">
        <BrandText text={t.privacy.intro(brandName(locale))} brand={brandName(locale)} />
      </p>

      <Section title={t.privacy.whatHeading} items={t.privacy.what} />
      <Section title={t.privacy.whyHeading} items={t.privacy.why} />

      <h2 className="mt-6 text-[17px] leading-[24px] font-bold text-ink-900">
        {t.privacy.keepHeading}
      </h2>
      <p className="mt-1 text-[15px] leading-[24px] text-ink-700">
        <BrandText text={t.privacy.keep(brandName(locale))} brand={brandName(locale)} />
      </p>

      <h2 className="mt-6 text-[17px] leading-[24px] font-bold text-ink-900">
        {t.privacy.shareHeading}
      </h2>
      <p className="mt-1 text-[15px] leading-[24px] text-ink-700">
        {t.privacy.share}
      </p>

      <Section title={t.privacy.rightsHeading} items={t.privacy.rights} />

      <h2 className="mt-6 text-[17px] leading-[24px] font-bold text-ink-900">
        {t.privacy.contactHeading}
      </h2>
      <p className="mt-1 pb-10 text-[15px] leading-[24px] text-ink-700">
        {t.privacy.contact}
      </p>
    </main>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <>
      <h2 className="mt-6 text-[17px] leading-[24px] font-bold text-ink-900">
        {title}
      </h2>
      <ul className="mt-1 flex list-disc flex-col gap-1.5 pl-5">
        {items.map((item) => (
          <li key={item} className="text-[15px] leading-[24px] text-ink-700">
            {item}
          </li>
        ))}
      </ul>
    </>
  );
}
