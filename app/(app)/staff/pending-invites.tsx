"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getDictionary, type Locale } from "@/lib/i18n";
import { revokeInvite } from "@/lib/actions/org";

export interface PendingInvite {
  id: string;
  full_name: string;
  phone: string;
  token: string;
}

/** Invites that were made but not yet used, with the link still recoverable. */
export function PendingInvites({
  locale,
  invites,
  canManage,
}: {
  locale: Locale;
  invites: PendingInvite[];
  canManage: boolean;
}) {
  const t = getDictionary(locale);
  const router = useRouter();
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  async function copy(invite: PendingInvite) {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/join/${invite.token}`,
      );
      setCopiedId(invite.id);
    } catch {
      setCopiedId(null);
    }
  }

  return (
    <section className="mt-6">
      <h2 className="mb-2 text-[13px] leading-[18px] font-semibold text-ink-700">
        {t.org.pendingInvites}
      </h2>
      <ul aria-label={t.org.pendingInvites} className="flex flex-col gap-2">
        {invites.map((invite) => (
          <li key={invite.id}>
            <Card className="flex min-h-16 items-center gap-2 p-3.5 shadow-none">
              <div className="min-w-0 flex-1">
                <p className="text-[15px] leading-[20px] font-bold text-ink-900">
                  {invite.full_name}
                </p>
                <p className="num text-[13px] text-ink-500">{invite.phone}</p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => copy(invite)}
                aria-label={t.org.copyLink}
              >
                {copiedId === invite.id ? <Check /> : <Copy />}
                {copiedId === invite.id ? t.org.copied : t.org.copyLink}
              </Button>
              {canManage ? (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={pending}
                  aria-label={t.org.removeInvite}
                  onClick={() =>
                    startTransition(async () => {
                      await revokeInvite(invite.id);
                      router.refresh();
                    })
                  }
                >
                  <X />
                </Button>
              ) : null}
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
