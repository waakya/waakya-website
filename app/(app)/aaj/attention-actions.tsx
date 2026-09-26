"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Check, RefreshCw } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { getDictionary, type Locale } from "@/lib/i18n";
import { getPhase1 } from "@/lib/i18n/phase1";
import { moveTaskAction, remindAction } from "@/lib/actions/task-actions";
import { decideApproval } from "@/lib/actions/approvals";
import { decideLeave } from "@/lib/actions/attendance";
import { attempt } from "@/lib/actions/attempt";

/**
 * The one action a "Needs you" row offers. Everything else about the task —
 * call, reassign, change time — is one tap away inside it.
 */
export function TaskAction({
  locale,
  taskId,
  kind,
}: {
  locale: Locale;
  taskId: string;
  kind: "verify" | "remind" | "reassign";
}) {
  const t = getDictionary(locale);
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  if (kind === "reassign") {
    return (
      <Button size="sm" className="h-tap" variant="outline" render={<Link href={`/kaam/${taskId}`} />} nativeButton={false}>
        <RefreshCw />
        {t.actions.kisiAurKo}
      </Button>
    );
  }

  if (kind === "verify") {
    return (
      <Button
        size="sm"
        className="h-tap"
        variant="secondary"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await attempt(() => moveTaskAction({ taskId, to: "verified" }), t.common.noConnection);
            // Say it happened: the row is about to leave the list.
            toast(result.ok ? t.ticks.verified : (result.message ?? t.common.somethingWentWrong));
            router.refresh();
          })
        }
      >
        <Check strokeWidth={3} />
        {t.actions.verify}
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      className="h-tap"
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await attempt(() => remindAction(taskId), t.common.noConnection);
          toast(result.ok ? t.detail.reminderSent : (result.message ?? t.common.somethingWentWrong));
        })
      }
    >
      <Bell />
      {t.actions.yaadDilao}
    </Button>
  );
}

/**
 * Approve in place; reject where the whole request and a note are (V3 review:
 * a one-tap reject beside Approve was too easy to hit, and a rejection
 * deserves a reason). The server decides who may either way.
 */
export function DecideAction({
  locale,
  kind,
  id,
  rejectHref,
}: {
  locale: Locale;
  kind: "approval" | "leave";
  id: string;
  rejectHref: string;
}) {
  const t = getDictionary(locale);
  const p = getPhase1(locale);
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function approve() {
    startTransition(async () => {
      const result = await attempt(
        () => (kind === "approval" ? decideApproval({ id, approve: true }) : decideLeave({ requestId: id, approve: true })),
        t.common.noConnection,
      );
      if (!result.ok) toast(result.message ?? t.common.somethingWentWrong);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1">
      <Button size="sm" className="h-tap" variant="secondary" disabled={pending} onClick={approve}>
        <Check strokeWidth={3} />
        {p.approvals.approve}
      </Button>
      <Link href={rejectHref} className={buttonVariants({ size: "sm", variant: "ghost", className: "h-tap" })}>
        {p.approvals.reject}
      </Link>
    </div>
  );
}
