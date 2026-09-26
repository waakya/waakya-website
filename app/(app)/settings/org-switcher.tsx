"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { switchOrg } from "@/lib/actions/switch-org";
import { getPlatform } from "@/lib/i18n/platform";
import type { Locale } from "@/lib/i18n";

/** A person in several businesses picks which one this session works in. */
export function OrgSwitcher({
  locale,
  current,
  memberships,
}: {
  locale: Locale;
  current: string | null;
  memberships: { orgId: string; orgName: string; role: string }[];
}) {
  const t = getPlatform(locale).switchOrg;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  if (memberships.length < 2) return null;

  return (
    <section className="mt-6">
      <h2 className="mb-2 text-[13px] leading-[18px] font-semibold text-ink-700">{t.title}</h2>
      <p className="mb-2 text-[13px] text-ink-500">{t.help}</p>
      <ul className="overflow-hidden rounded-card border border-paper-200 bg-paper-0">
        {memberships.map((m) => (
          <li key={m.orgId} className="border-b border-paper-100 last:border-b-0">
            <button
              type="button"
              disabled={pending || m.orgId === current}
              onClick={() =>
                startTransition(async () => {
                  const result = await switchOrg(m.orgId);
                  if (!result.ok) toast.error(result.message);
                  else router.push("/aaj");
                })
              }
              className="flex min-h-tap w-full items-center gap-3 px-4 py-3 text-left disabled:opacity-100"
              aria-current={m.orgId === current ? "true" : undefined}
            >
              <span className="flex-1 text-[15px] font-semibold text-ink-900">{m.orgName}</span>
              <span className="text-[13px] text-ink-500">{m.orgId === current ? t.current : m.role}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
