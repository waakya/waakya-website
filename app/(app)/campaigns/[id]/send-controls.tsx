"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Send, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getCampaigns } from "@/lib/i18n/campaigns";
import type { Locale } from "@/lib/i18n";
import { cancelCampaign, sendCampaign } from "@/lib/campaigns/actions";

/** Send is a two-step, owner-only word; cancel is one tap while it is still a draft. */
export function SendControls({ locale, id, status, canSend }: { locale: Locale; id: string; status: string; canSend: boolean }) {
  const t = getCampaigns(locale);
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [arm, setArm] = React.useState(false);
  if (!["draft", "scheduled", "partially_failed"].includes(status)) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {canSend ? (
        !arm ? (
          <Button onClick={() => setArm(true)}>
            <Send aria-hidden="true" />
            {t.send}
          </Button>
        ) : (
          <>
            <span className="text-body-sm text-fg-muted">{t.sendConfirm}</span>
            <Button
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await sendCampaign(id);
                  if (!result.ok) toast.error(result.message);
                  setArm(false);
                  router.refresh();
                })
              }
            >
              {pending ? t.sending : t.send}
            </Button>
            <Button variant="ghost" onClick={() => setArm(false)}>{t.cancel}</Button>
          </>
        )
      ) : null}
      {status === "draft" ? (
        <Button variant="ghost" disabled={pending} onClick={() => startTransition(async () => { const r = await cancelCampaign(id); if (!r.ok) toast.error(r.message); router.refresh(); })}>
          <X aria-hidden="true" />
          {t.cancel}
        </Button>
      ) : null}
    </div>
  );
}
