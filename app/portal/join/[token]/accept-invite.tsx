"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getPortal } from "@/lib/i18n/portal";
import type { Locale } from "@/lib/i18n";
import { acceptCustomerInvite } from "@/lib/portal/actions";

export function AcceptInvite({ locale, token }: { locale: Locale; token: string }) {
  const t = getPortal(locale).portal.invite;
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  return (
    <div className="flex flex-col gap-3">
      {error ? <p role="alert" className="text-body text-laal-700">{error}</p> : null}
      <Button
        size="block"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await acceptCustomerInvite(token);
            if (!result.ok) {
              setError(result.message);
              return;
            }
            router.replace(result.data.projectId ? `/portal/projects/${result.data.projectId}` : "/portal");
          })
        }
      >
        {t.accept}
      </Button>
    </div>
  );
}
