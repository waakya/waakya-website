"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Bell, Check, Clock, Eye, EyeOff, Phone, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { getDictionary, type Locale } from "@/lib/i18n";
import { moveTaskAction, remindAction } from "@/lib/actions/task-actions";
import type { NeedsYouReason } from "@/lib/tasks/counters";

/**
 * An "Aapke liye" card (screens/Dashboard.png): what happened, in the owner's
 * own words, with the two or three things they can do about it right there.
 * The whole point is that the owner acts from the list rather than navigating
 * into a task to find a button.
 */
export function NeedsYouCard({
  locale,
  taskId,
  reason,
  headline,
  meta,
  phone,
}: {
  locale: Locale;
  taskId: string;
  reason: NeedsYouReason;
  headline: string;
  meta: string;
  phone: string | null;
}) {
  const t = getDictionary(locale);
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const tile = {
    late: { icon: <Clock />, className: "bg-laal-100 text-laal-700" },
    unseen: { icon: <EyeOff />, className: "bg-amber-100 text-amber-700" },
    escalated: { icon: <AlertTriangle />, className: "bg-amber-100 text-amber-700" },
    verify: { icon: <Eye />, className: "bg-neel-100 text-neel-700" },
  }[reason];

  return (
    <Card className="relative p-3.5">
      <div className="flex gap-3">
        <span
          className={`flex size-11 shrink-0 items-center justify-center rounded-tile [&_svg]:size-6 ${tile.className}`}
        >
          {tile.icon}
        </span>
        <div className="min-w-0">
          <p className="text-[17px] leading-[24px] font-bold text-ink-900">
            <Link href={`/kaam/${taskId}`} className="after:absolute after:inset-0">
              {headline}
            </Link>
          </p>
          <p className="num mt-0.5 text-[13px] text-ink-500">{meta}</p>
        </div>
      </div>

      {/* Above the card-wide link, so these are the buttons they look like. */}
      <div className="relative z-10 mt-3 flex flex-wrap gap-2">
        {reason === "verify" ? (
          <>
            <Button
              size="sm"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await moveTaskAction({ taskId, to: "verified" });
                  if (!result.ok) toast(result.message);
                  router.refresh();
                })
              }
            >
              <Check strokeWidth={3} />
              {t.actions.verify}
            </Button>
            <Button
              size="sm"
              variant="outline"
              render={<Link href={`/kaam/${taskId}`} />}
              nativeButton={false}
            >
              <Eye />
              {t.actions.dekhein}
            </Button>
          </>
        ) : (
          <>
            {phone ? (
              <Button
                size="sm"
                render={<a href={`tel:${phone}`} />}
                nativeButton={false}
              >
                <Phone />
                {t.actions.call}
              </Button>
            ) : null}
            {reason !== "escalated" ? (
              <Button
                size="sm"
                variant="secondary"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const result = await remindAction(taskId);
                    toast(result.ok ? t.detail.reminderSent : result.message);
                  })
                }
              >
                <Bell />
                {t.actions.yaadDilao}
              </Button>
            ) : null}
            {/* Somebody who said "cannot do" needs a replacement, not a reminder. */}
            <Button
              size="sm"
              variant={reason === "escalated" ? "primary" : "outline"}
              render={<Link href={`/kaam/${taskId}`} />}
              nativeButton={false}
            >
              <RefreshCw />
              {t.actions.kisiAurKo}
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}
