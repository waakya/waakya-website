"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { getDictionary, type Locale } from "@/lib/i18n";
import { markInboxRead } from "@/lib/actions/inbox";

/**
 * "Check now" runs one SLA tick for this owner's business. The job normally
 * runs on a schedule; this exists so an owner never has to wonder whether it
 * is working, and because the tick is idempotent it is safe to tap twice.
 */
export function InboxActions({
  locale,
  hasUnread,
  canCheck,
}: {
  locale: Locale;
  hasUnread: boolean;
  canCheck: boolean;
}) {
  const t = getDictionary(locale);
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  return (
    <div className="flex items-center gap-1">
      {canCheck ? (
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          aria-label={t.inbox.checkNow}
          onClick={() =>
            startTransition(async () => {
              await fetch("/api/cron/sla", { method: "POST" });
              toast(t.inbox.checked);
              router.refresh();
            })
          }
        >
          <RefreshCw />
        </Button>
      ) : null}
      {hasUnread ? (
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await markInboxRead();
              router.refresh();
            })
          }
        >
          <CheckCheck />
          {t.inbox.markAllRead}
        </Button>
      ) : null}
    </div>
  );
}
