import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Privacy" };

// Slice 9 writes the full DPDP notice; the login screen links here from day one
// so consent is never a checkbox pointing at nothing.
export default async function PrivacyPage() {
  const locale = await getLocale();
  const t = getDictionary(locale);

  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="text-[24px] leading-[30px] font-bold">
        {t.auth.privacyPolicy}
      </h1>
      <p className="mt-3 text-[15px] leading-[22px] text-ink-700">
        Vaakya sirf wahi data rakhta hai jo kaam chalane ke liye chahiye: aapka
        naam, email, aur aapke kaam ka record.
      </p>
    </main>
  );
}
