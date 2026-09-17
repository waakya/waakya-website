import type { Metadata } from "next";

import { requireOrg } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "@/lib/i18n/server";
import { BusinessProfileForm } from "@/components/waakya/business-profile-form";

export const metadata: Metadata = { title: "Business profile" };

/** Step two of setup: the details a quotation or invoice is filled from. */
export default async function SetupProfilePage() {
  const viewer = await requireOrg();
  const locale = await getLocale();
  const supabase = await createClient();
  const { data: org } = await supabase
    .from("orgs")
    .select("name, address, gstin, phone, email")
    .eq("id", viewer.org.id)
    .single();

  return (
    <BusinessProfileForm
      locale={locale}
      onboarding
      initial={{
        name: org?.name ?? viewer.org.name,
        address: org?.address ?? "",
        gstin: org?.gstin ?? "",
        phone: org?.phone ?? "",
        email: org?.email ?? "",
      }}
    />
  );
}
