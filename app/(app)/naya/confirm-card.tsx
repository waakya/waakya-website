"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Camera, ChevronRight, Clock, Send, X, Zap } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "@/components/ui/sonner";
import { getDictionary, type Locale } from "@/lib/i18n";
import type { DeadlinePreset } from "@/lib/tasks/deadlines";
import { createTask } from "@/lib/actions/tasks";
import { cn } from "@/lib/utils";

type Member = { id: string; name: string };
type Priority = "normal" | "urgent";

/**
 * One card, six rows, three glances: who, what, by when (Design Direction §6).
 * Every row is a 44px-plus tap target; the ones that need typing open a bottom
 * sheet, the ones that are a choice show their choices inline.
 *
 * `Bhejo` is the only primary on the screen.
 *
 * The voice row from Confirm.png ("Aapki awaaz · 0:07") is deliberately absent:
 * there is no voice in v1, and a player for audio that does not exist would be
 * a lie. It returns with voice capture, in the same slot.
 */
export function ConfirmCard({
  locale,
  members,
  presetTimes,
  ackMinutes,
}: {
  locale: Locale;
  members: Member[];
  /** Server-resolved: the evening chip's whole label, and the times of the others. */
  presetTimes: Record<DeadlinePreset, string>;
  ackMinutes: number;
}) {
  const t = getDictionary(locale);
  const router = useRouter();

  const [assignee, setAssignee] = React.useState<Member | null>(
    members.length === 1 ? members[0] : null,
  );
  const [title, setTitle] = React.useState("");
  const [note, setNote] = React.useState("");
  const [preset, setPreset] = React.useState<DeadlinePreset[]>(["today_evening"]);
  const [priority, setPriority] = React.useState<Priority[]>(["normal"]);
  const [proof, setProof] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const [openSheet, setOpenSheet] = React.useState<"who" | "what" | "note" | null>(
    null,
  );
  // The sheet edits a draft that is seeded when it opens, so there is no
  // effect syncing state from a prop.
  const [draft, setDraft] = React.useState("");

  function openText(which: "what" | "note") {
    setDraft(which === "what" ? title : note);
    setOpenSheet(which);
  }

  const ready = Boolean(assignee) && title.trim().length >= 2;

  function send() {
    setError(null);
    startTransition(async () => {
      const result = await createTask({
        assigneeId: assignee!.id,
        title: title.trim(),
        details: note.trim(),
        priority: priority[0] === "urgent" ? "urgent" : "normal",
        proofRequired: proof,
        deadline: { kind: "preset", preset: preset[0] ?? "today_evening" },
      });

      if (!result.ok) {
        setError(result.message);
        return;
      }
      toast(t.create.sent(assignee!.name));
      router.replace("/aaj");
      router.refresh();
    });
  }

  return (
    // A focused flow: a comfortable card on a wide screen rather than a
    // form stretched across it.
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col p-4 lg:py-10">
      <header className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          aria-label={t.actions.close}
          className="rounded-full"
          onClick={() => router.back()}
        >
          <X />
        </Button>
        <h1 className="flex-1 text-center text-[17px] font-bold text-ink-900">
          {t.create.confirmTitle}
        </h1>
        <span className="size-tap" aria-hidden="true" />
      </header>

      <Card className="mt-4 divide-y divide-paper-200 p-0">
        <Row label={t.create.kisko} onOpen={() => setOpenSheet("who")}>
          {assignee ? (
            <span className="inline-flex items-center gap-2 rounded-chip bg-neel-100 py-1 pr-3 pl-1">
              <Avatar name={assignee.name} size={28} />
              <span className="text-[17px] font-bold text-neel-800">
                {assignee.name}
              </span>
            </span>
          ) : (
            <span className="text-[17px] text-ink-400">{t.create.notChosen}</span>
          )}
        </Row>

        <Row label={t.create.kya} onOpen={() => openText("what")}>
          <span
            className={cn(
              "text-[20px] leading-[26px] font-bold",
              title ? "text-ink-900" : "font-normal text-ink-400",
            )}
          >
            {title || t.create.titlePlaceholder}
          </span>
        </Row>

        <StaticRow label={t.create.kabTak}>
          <ToggleGroup
            value={preset}
            onValueChange={(next) =>
              setPreset(next.length ? (next as DeadlinePreset[]) : preset)
            }
            aria-label={t.create.chooseTime}
          >
            <ToggleGroupItem value="today_evening">
              <Clock />
              {presetTimes.today_evening}
            </ToggleGroupItem>
            <ToggleGroupItem value="one_hour">{t.create.oneHour}</ToggleGroupItem>
            <ToggleGroupItem value="tomorrow_morning">
              {t.create.tomorrowMorning} {presetTimes.tomorrow_morning}
            </ToggleGroupItem>
          </ToggleGroup>
        </StaticRow>

        <StaticRow label={t.create.priorityLabel}>
          <ToggleGroup
            value={priority}
            onValueChange={(next) =>
              setPriority(next.length ? (next as Priority[]) : priority)
            }
            aria-label={t.create.priorityLabel}
          >
            {/* Urgent is the one place Laal is allowed on a control (§3.3). */}
            <ToggleGroupItem
              value="urgent"
              className="data-[pressed]:border-laal-600 data-[pressed]:bg-laal-600"
            >
              <Zap />
              {t.priority.urgent}
            </ToggleGroupItem>
            <ToggleGroupItem value="normal">{t.priority.normal}</ToggleGroupItem>
          </ToggleGroup>
        </StaticRow>

        <label className="flex min-h-tap items-center gap-4 p-4">
          <span className="w-24 shrink-0 text-[13px] font-semibold text-ink-500">
            {t.create.proof}
          </span>
          <span className="flex flex-1 items-center gap-2 text-[17px] font-bold text-ink-900">
            <Camera className="size-5" aria-hidden="true" />
            {proof ? t.create.proofOn : t.create.proofOff}
          </span>
          <Switch checked={proof} onCheckedChange={setProof} />
        </label>

        <Row label={t.create.note} onOpen={() => openText("note")}>
          <span
            className={cn(
              "text-[17px]",
              note ? "text-ink-900" : "text-ink-400",
            )}
          >
            {note || t.create.notePlaceholder}
          </span>
        </Row>
      </Card>

      <p className="mt-3 px-1 text-[13px] leading-[18px] text-ink-500">
        {t.create.ackHelp.replace("{n}", String(ackMinutes))}
      </p>

      {error ? (
        <p
          role="alert"
          className="mt-3 rounded-card bg-laal-100 px-3 py-2 text-[15px] leading-[20px] text-laal-700"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-auto pt-6">
        <Button size="block" disabled={!ready || pending} onClick={send}>
          <Send />
          {pending ? t.common.loading : t.actions.bhejo}
        </Button>
      </div>

      <Sheet
        open={openSheet === "who"}
        onOpenChange={(open) => setOpenSheet(open ? "who" : null)}
      >
        <SheetContent>
          <SheetTitle>{t.create.choosePerson}</SheetTitle>
          <ul className="mt-4 flex flex-col gap-2">
            {members.map((member) => (
              <li key={member.id}>
                <Button
                  variant={assignee?.id === member.id ? "secondary" : "outline"}
                  size="staff"
                  className="w-full justify-start"
                  onClick={() => {
                    setAssignee(member);
                    setOpenSheet(null);
                  }}
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

      <TextSheet
        open={openSheet === "what"}
        onClose={() => setOpenSheet(null)}
        title={t.create.kya}
        placeholder={t.create.titlePlaceholder}
        draft={draft}
        onDraftChange={setDraft}
        onSave={() => setTitle(draft.trim())}
        saveLabel={t.actions.save}
        multiline={false}
      />

      <TextSheet
        open={openSheet === "note"}
        onClose={() => setOpenSheet(null)}
        title={t.create.note}
        placeholder={t.create.detailsPlaceholder}
        draft={draft}
        onDraftChange={setDraft}
        onSave={() => setNote(draft.trim())}
        saveLabel={t.actions.save}
        multiline
      />
    </div>
  );
}

/** A tappable row that opens an editor. */
function Row({
  label,
  children,
  onOpen,
}: {
  label: string;
  children: React.ReactNode;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex min-h-tap w-full items-center gap-4 p-4 text-left"
    >
      <span className="w-24 shrink-0 text-[13px] font-semibold text-ink-500">
        {label}
      </span>
      <span className="min-w-0 flex-1">{children}</span>
      <ChevronRight className="size-5 shrink-0 text-ink-400" aria-hidden="true" />
    </button>
  );
}

/** A row whose choices are already on screen. */
function StaticRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-tap items-start gap-4 p-4">
      <span className="w-24 shrink-0 pt-2 text-[13px] font-semibold text-ink-500">
        {label}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function TextSheet({
  open,
  onClose,
  title,
  placeholder,
  draft,
  onDraftChange,
  onSave,
  saveLabel,
  multiline,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  placeholder: string;
  draft: string;
  onDraftChange: (value: string) => void;
  onSave: () => void;
  saveLabel: string;
  multiline: boolean;
}) {
  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent>
        <SheetTitle>{title}</SheetTitle>
        <div className="mt-4">
          {multiline ? (
            <textarea
              autoFocus
              rows={4}
              value={draft}
              onChange={(event) => onDraftChange(event.target.value)}
              placeholder={placeholder}
              aria-label={title}
              maxLength={1000}
              className="w-full rounded-button border-2 border-paper-200 bg-paper-0 p-3 text-[17px] text-ink-900 outline-none placeholder:text-ink-400 focus:border-neel-600"
            />
          ) : (
            <Input
              autoFocus
              value={draft}
              onChange={(event) => onDraftChange(event.target.value)}
              placeholder={placeholder}
              aria-label={title}
              // The same limit the server enforces, so nothing typed is silently lost.
              maxLength={140}
              className="h-tap-staff"
            />
          )}
        </div>
        <SheetClose
          render={
            <Button size="block" className="mt-4" onClick={onSave}>
              {saveLabel}
            </Button>
          }
        />
      </SheetContent>
    </Sheet>
  );
}
