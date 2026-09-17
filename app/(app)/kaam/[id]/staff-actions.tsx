"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Clock, Play, Send, Shield, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "@/components/ui/sonner";
import { getDictionary, type Locale } from "@/lib/i18n";
import {
  acknowledgeAndAcceptAction,
  moveTaskAction,
} from "@/lib/actions/task-actions";
import type { TaskState } from "@/lib/supabase/types";
import { ProofSheet } from "./proof-sheet";
import { attempt } from "@/lib/actions/attempt";

/**
 * One big button, and two quieter ones beneath it (screens/TaskStaff.png).
 *
 * Which button it is depends on where the task is — a new task asks to be
 * acknowledged, an accepted one asks to be started or finished — but there is
 * only ever one primary, at 60px, in the bottom third.
 */
export function StaffActions({
  locale,
  taskId,
  state,
  allowed,
  proofRequired,
  ownerName,
}: {
  locale: Locale;
  taskId: string;
  state: TaskState;
  allowed: TaskState[];
  proofRequired: boolean;
  ownerName: string;
}) {
  const t = getDictionary(locale);
  const router = useRouter();
  const [declining, setDeclining] = React.useState(false);
  const [provingDone, setProvingDone] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function move(to: TaskState, note?: string) {
    setError(null);
    startTransition(async () => {
      const result = await attempt(
        () => (to === "acknowledged" ? acknowledgeAndAcceptAction(taskId) : moveTaskAction({ taskId, to, note })),
        t.common.noConnection,
      );
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setDeclining(false);
      setReason("");
      router.refresh();
    });
  }

  const primary = choosePrimary(state, allowed);
  const canDecline = allowed.includes("escalated");
  // Starting is worth signalling, but it is never the thing being asked for:
  // the one big button is always the next real step.
  const canStart = state === "accepted" && allowed.includes("in_progress");

  if (!primary && !canDecline) {
    // Nothing left to do: the line sits in the page, not in a fixed bar that
    // would cover the proof above it.
    return (
      <footer className="mx-auto mt-2 w-full max-w-md border-t border-paper-200 px-4 py-4 lg:mt-6 lg:max-w-none lg:rounded-card lg:border lg:border-paper-200 lg:p-5">
        <p className="flex items-center justify-center gap-2 text-center text-[13px] text-ink-400">
          <Shield className="size-4" aria-hidden="true" />
          {t.detail.recordLine}
        </p>
      </footer>
    );
  }

  return (
    <>
      <footer className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md border-t border-paper-200 bg-paper-50 p-4 pb-[calc(1rem_+_env(safe-area-inset-bottom))] lg:static lg:mt-6 lg:max-w-none lg:rounded-card lg:border lg:border-paper-200 lg:p-5">
        {error ? (
          <p
            role="alert"
            className="mb-3 rounded-card bg-laal-100 px-3 py-2 text-[15px] leading-[20px] text-laal-700"
          >
            {error}
          </p>
        ) : null}

        {primary ? (
          <Button
            size="staffPrimary"
            disabled={pending}
            onClick={() => {
              // Finishing asks for the proof first: a task marked done with
              // the photo still to come is exactly the gap the product exists
              // to close.
              if (primary.to === "done") setProvingDone(true);
              else move(primary.to);
            }}
          >
            {primary.icon}
            {t.actions[primary.labelKey]}
          </Button>
        ) : null}

        <div className="mt-2 flex gap-2">
          {canStart ? (
            <Button
              variant="outline"
              size="staff"
              className="flex-1"
              disabled={pending}
              onClick={() => move("in_progress")}
            >
              <Play />
              {t.actions.shuruKiya}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="staff"
              className="flex-1"
              onClick={() => {
                toast(t.detail.laterHelp);
                router.push("/aaj");
              }}
            >
              <Clock />
              {t.actions.baadMein}
            </Button>
          )}
          {canDecline ? (
            <Button
              variant="outline"
              size="staff"
              className="flex-1"
              onClick={() => setDeclining(true)}
            >
              <X />
              {t.actions.nahiHoPayega}
            </Button>
          ) : null}
        </div>

        <p className="mt-3 flex items-center justify-center gap-2 text-center text-[13px] text-ink-400">
          <Shield className="size-4" aria-hidden="true" />
          {t.detail.recordLine}
        </p>
      </footer>

      <ProofSheet
        open={provingDone}
        onOpenChange={setProvingDone}
        locale={locale}
        taskId={taskId}
        ownerName={ownerName}
        required={proofRequired}
        onDone={() => {
          setProvingDone(false);
          move("done");
        }}
      />

      <Sheet open={declining} onOpenChange={setDeclining}>
        <SheetContent>
          <SheetTitle>{t.detail.declineTitle}</SheetTitle>
          <SheetDescription>{t.detail.declineHelp}</SheetDescription>
          <Input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={t.detail.declineReason}
            aria-label={t.detail.declineReason}
            className="mt-4 text-[15px] font-normal"
          />
          <Button
            size="block"
            variant="danger"
            className="mt-4"
            disabled={pending}
            onClick={() => move("escalated", reason)}
          >
            <Send />
            {t.actions.nahiHoPayega}
          </Button>
        </SheetContent>
      </Sheet>
    </>
  );
}

type Primary = {
  to: TaskState;
  labelKey: "dekhLiyaHoJayega" | "shuruKiya" | "hoGaya";
  icon: React.ReactNode;
};

/**
 * The one thing this screen is asking for, right now.
 *
 * Seeing and committing are one tap, because that is what the button says and
 * what screens/TaskOwner.png shows — Dekha and Maana at the same timestamp.
 * After that the only question is whether it is done.
 */
function choosePrimary(state: TaskState, allowed: TaskState[]): Primary | null {
  if (allowed.includes("acknowledged")) {
    return {
      to: "acknowledged",
      labelKey: "dekhLiyaHoJayega",
      icon: <Check strokeWidth={3} />,
    };
  }
  if (allowed.includes("done")) {
    return { to: "done", labelKey: "hoGaya", icon: <Check strokeWidth={3} /> };
  }
  if (allowed.includes("accepted")) {
    return {
      to: "accepted",
      labelKey: "dekhLiyaHoJayega",
      icon: <Check strokeWidth={3} />,
    };
  }
  return null;
}
