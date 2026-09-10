"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  Clock,
  Phone,
  RefreshCw,
  Undo2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar } from "@/components/ui/avatar";
import { toast } from "@/components/ui/sonner";
import { getDictionary, type Locale } from "@/lib/i18n";
import {
  moveTaskAction,
  reassignTaskAction,
  changeDeadlineAction,
  remindAction,
} from "@/lib/actions/task-actions";
import type { TaskState } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type SheetKind = "reassign" | "deadline" | "cancel" | null;

/**
 * Five equal actions along the bottom, Call primary (screens/TaskOwner.png),
 * plus Verify when the work is waiting on the owner — which is the one moment
 * the owner is the bottleneck, so it gets the biggest button.
 */
export function OwnerActions({
  locale,
  taskId,
  state,
  allowed,
  members,
  assigneePhone,
}: {
  locale: Locale;
  taskId: string;
  state: TaskState;
  allowed: TaskState[];
  members: { id: string; name: string }[];
  assigneePhone: string | null;
}) {
  const t = getDictionary(locale);
  const router = useRouter();
  const [sheet, setSheet] = React.useState<SheetKind>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function run(work: () => Promise<{ ok: boolean; message?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await work();
      if (!result.ok) setError(result.message ?? t.common.somethingWentWrong);
      else {
        setSheet(null);
        router.refresh();
      }
    });
  }

  const canVerify = allowed.includes("verified");
  const canSendBack = state === "done" && allowed.includes("in_progress");

  return (
    <>
      <footer className="fixed inset-x-0 bottom-[calc(4rem_+_env(safe-area-inset-bottom))] z-30 mx-auto w-full max-w-md border-t border-paper-200 bg-paper-50 p-4 lg:static lg:mt-6 lg:max-w-none lg:rounded-card lg:border lg:border-paper-200 lg:p-5">
        {error ? (
          <p
            role="alert"
            className="mb-3 rounded-card bg-laal-100 px-3 py-2 text-[15px] leading-[20px] text-laal-700"
          >
            {error}
          </p>
        ) : null}

        {canVerify ? (
          <div className="mb-3 flex gap-2">
            <Button
              size="staff"
              className="flex-1"
              disabled={pending}
              onClick={() => run(() => moveTaskAction({ taskId, to: "verified" }))}
            >
              <Check strokeWidth={3} />
              {t.detail.verifyDone}
            </Button>
            {canSendBack ? (
              <Button
                variant="outline"
                size="staff"
                disabled={pending}
                onClick={() =>
                  run(() => moveTaskAction({ taskId, to: "in_progress" }))
                }
              >
                <Undo2 />
                {t.detail.sendBack}
              </Button>
            ) : null}
          </div>
        ) : null}

        <ul className="grid grid-cols-5 gap-2">
          <ActionTile
            primary
            label={t.actions.call}
            icon={<Phone />}
            href={assigneePhone ? `tel:${assigneePhone}` : undefined}
            onClick={
              assigneePhone ? undefined : () => toast(t.detail.callNoNumber)
            }
          />
          <ActionTile
            label={t.actions.yaadDilao}
            icon={<Bell />}
            disabled={pending || ["done", "verified", "cancelled"].includes(state)}
            onClick={() =>
              startTransition(async () => {
                const result = await remindAction(taskId);
                if (result.ok) toast(t.detail.reminderSent);
                else setError(result.message);
              })
            }
          />
          <ActionTile
            label={t.actions.kisiAurKo}
            icon={<RefreshCw />}
            disabled={pending || !allowed.includes("reassigned")}
            onClick={() => setSheet("reassign")}
          />
          <ActionTile
            label={t.actions.samayBadlo}
            icon={<Clock />}
            disabled={pending}
            onClick={() => setSheet("deadline")}
          />
          <ActionTile
            label={t.actions.cancel}
            icon={<X />}
            disabled={pending || !allowed.includes("cancelled")}
            onClick={() => setSheet("cancel")}
          />
        </ul>
      </footer>

      <Sheet
        open={sheet === "reassign"}
        onOpenChange={(open) => setSheet(open ? "reassign" : null)}
      >
        <SheetContent>
          <SheetTitle>{t.detail.reassignTitle}</SheetTitle>
          <ul className="mt-4 flex flex-col gap-2">
            {members.map((member) => (
              <li key={member.id}>
                <Button
                  variant="outline"
                  size="staff"
                  className="w-full justify-start"
                  disabled={pending}
                  onClick={() =>
                    run(() =>
                      reassignTaskAction({ taskId, toUserId: member.id }),
                    )
                  }
                >
                  <Avatar name={member.name} size={32} />
                  {member.name}
                </Button>
              </li>
            ))}
          </ul>
          {members.length === 0 ? (
            <p className="mt-4 text-[15px] text-ink-500">{t.org.noStaffHelp}</p>
          ) : null}
        </SheetContent>
      </Sheet>

      <Sheet
        open={sheet === "deadline"}
        onOpenChange={(open) => setSheet(open ? "deadline" : null)}
      >
        <SheetContent>
          <SheetTitle>{t.detail.deadlineTitle}</SheetTitle>
          <ul className="mt-4 flex flex-col gap-2">
            {[
              { hours: 1, label: t.create.oneHour },
              { hours: 4, label: `4 ${t.time.hourShort}` },
              { hours: 24, label: t.create.tomorrowMorning },
            ].map(({ hours, label }) => (
              <li key={hours}>
                <Button
                  variant="outline"
                  size="staff"
                  className="w-full justify-start"
                  disabled={pending}
                  onClick={() =>
                    run(() =>
                      changeDeadlineAction({
                        taskId,
                        dueAt: new Date(
                          Date.now() + hours * 60 * 60_000,
                        ).toISOString(),
                      }),
                    )
                  }
                >
                  <Clock />
                  {label}
                </Button>
              </li>
            ))}
          </ul>
        </SheetContent>
      </Sheet>

      <Sheet
        open={sheet === "cancel"}
        onOpenChange={(open) => setSheet(open ? "cancel" : null)}
      >
        <SheetContent>
          <SheetTitle>{t.detail.cancelTitle}</SheetTitle>
          <SheetDescription>{t.detail.cancelHelp}</SheetDescription>
          <Button
            size="block"
            variant="dangerSolid"
            className="mt-4"
            disabled={pending}
            onClick={() => run(() => moveTaskAction({ taskId, to: "cancelled" }))}
          >
            <X />
            {t.detail.cancelConfirm}
          </Button>
          <Button
            variant="ghost"
            className="mt-2 w-full"
            onClick={() => setSheet(null)}
          >
            {t.actions.close}
          </Button>
        </SheetContent>
      </Sheet>
    </>
  );
}

function ActionTile({
  label,
  icon,
  primary,
  href,
  onClick,
  disabled,
}: {
  label: string;
  icon: React.ReactNode;
  primary?: boolean;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const body = (
    <>
      <span
        className={cn(
          "flex size-tap items-center justify-center rounded-tile",
          primary ? "bg-neel-600 text-white" : "bg-neel-50 text-neel-700",
          disabled && "bg-paper-100 text-ink-400",
        )}
      >
        {icon}
      </span>
      <span className="text-center text-[11px] leading-tight font-semibold text-ink-700">
        {label}
      </span>
    </>
  );

  return (
    <li className="flex">
      {href ? (
        <a
          href={href}
          className="flex flex-1 flex-col items-center gap-1 [&_svg]:size-6"
        >
          {body}
        </a>
      ) : (
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          className="flex flex-1 flex-col items-center gap-1 disabled:cursor-not-allowed [&_svg]:size-6"
        >
          {body}
        </button>
      )}
    </li>
  );
}
