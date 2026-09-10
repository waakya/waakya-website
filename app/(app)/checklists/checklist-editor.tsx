"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Camera, Pause, Play, Plus, Trash2, X } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StateChip } from "@/components/ui/state-chip";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "@/components/ui/sonner";
import { getDictionary, type Locale } from "@/lib/i18n";
import type { ChecklistWithItems } from "@/lib/checklists/queries";
import {
  deleteChecklist,
  saveChecklist,
  setChecklistActive,
} from "@/lib/actions/checklists";

type Draft = {
  id?: string;
  name: string;
  assignedTo: string | null;
  runAt: string;
  windowMinutes: number;
  items: { title: string; proofRequired: boolean }[];
};

const BLANK: Draft = {
  name: "",
  assignedTo: null,
  runAt: "09:00",
  windowMinutes: 120,
  items: [{ title: "", proofRequired: false }],
};

export function ChecklistEditor({
  locale,
  checklists,
  members,
  empty,
}: {
  locale: Locale;
  checklists: ChecklistWithItems[];
  members: { id: string; name: string }[];
  /** Shown when there is nothing to list — owned here so a just-saved row can replace it at once. */
  empty?: React.ReactNode;
}) {
  const t = getDictionary(locale);
  const router = useRouter();
  const [draft, setDraft] = React.useState<Draft | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  /*
   * What was just saved, shown until the server's list catches up. The save
   * itself is quick, but the refreshed page can take a few seconds to arrive,
   * and an owner who watches "No checklists yet" for that long saves twice.
   * Fresh props replace it.
   */
  const [justSaved, setJustSaved] = React.useState<ChecklistWithItems[]>([]);
  React.useEffect(() => {
    setJustSaved([]);
  }, [checklists]);
  const visible = [
    ...checklists.map((c) => justSaved.find((j) => j.id === c.id) ?? c),
    ...justSaved.filter((j) => !checklists.some((c) => c.id === j.id)),
  ];

  const nameOf = (id: string | null) =>
    members.find((m) => m.id === id)?.name ?? t.create.notChosen;

  function save() {
    if (!draft) return;
    setError(null);
    startTransition(async () => {
      const result = await saveChecklist({
        ...draft,
        items: draft.items.filter((item) => item.title.trim().length > 0),
      });
      if (!result.ok) setError(result.message);
      else {
        const saved = draft;
        const before = checklists.find((c) => c.id === result.data.id);
        setJustSaved((rows) => [
          ...rows.filter((row) => row.id !== result.data.id),
          {
            id: result.data.id,
            name: saved.name,
            assignedTo: saved.assignedTo,
            runAt: saved.runAt,
            windowMinutes: saved.windowMinutes,
            active: before?.active ?? true,
            items: saved.items
              .filter((item) => item.title.trim().length > 0)
              .map((item, index) => ({ id: `${result.data.id}-${index}`, ...item })),
          },
        ]);
        setDraft(null);
        toast(t.checklists.saved);
        router.refresh();
      }
    });
  }

  return (
    <>
      {visible.length === 0 ? empty : null}

      <ul className="mt-5 flex flex-col gap-2">
        {visible.map((checklist) => (
          <li key={checklist.id}>
            <Card className="p-3.5">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[17px] leading-[22px] font-bold text-ink-900">
                    {checklist.name}
                  </p>
                  <p className="num mt-0.5 text-[13px] text-ink-500">
                    {checklist.runAt.slice(0, 5)} · {nameOf(checklist.assignedTo)} ·{" "}
                    {checklist.items.length} {t.checklists.items}
                  </p>
                </div>
                {!checklist.active ? (
                  <StateChip tone="muted" icon={<Pause />}>
                    {t.checklists.paused}
                  </StateChip>
                ) : null}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setDraft({
                      id: checklist.id,
                      name: checklist.name,
                      assignedTo: checklist.assignedTo,
                      runAt: checklist.runAt.slice(0, 5),
                      windowMinutes: checklist.windowMinutes,
                      items: checklist.items.map((item) => ({
                        title: item.title,
                        proofRequired: item.proofRequired,
                      })),
                    })
                  }
                >
                  {t.actions.save}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await setChecklistActive({
                        id: checklist.id,
                        active: !checklist.active,
                      });
                      router.refresh();
                    })
                  }
                >
                  {checklist.active ? <Pause /> : <Play />}
                  {checklist.active ? t.checklists.pause : t.checklists.resume}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      const result = await deleteChecklist(checklist.id);
                      if (!result.ok) toast(result.message);
                      router.refresh();
                    })
                  }
                >
                  <Trash2 />
                  {t.checklists.remove}
                </Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <Button size="block" className="mt-5" onClick={() => setDraft({ ...BLANK })}>
        <Plus />
        {t.checklists.add}
      </Button>

      <Sheet open={draft !== null} onOpenChange={(open) => !open && setDraft(null)}>
        <SheetContent>
          <SheetTitle>{t.checklists.add}</SheetTitle>
          <SheetDescription>{t.checklists.subtitle}</SheetDescription>

          {draft ? (
            <div className="mt-4 flex flex-col gap-4">
              <div>
                <Label htmlFor="cl-name">{t.checklists.name}</Label>
                <Input
                  id="cl-name"
                  value={draft.name}
                  onChange={(event) =>
                    setDraft({ ...draft, name: event.target.value })
                  }
                  placeholder={t.checklists.namePlaceholder}
                  className="mt-1.5"
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <Label htmlFor="cl-time">{t.checklists.runAt}</Label>
                  <Input
                    id="cl-time"
                    type="time"
                    value={draft.runAt}
                    onChange={(event) =>
                      setDraft({ ...draft, runAt: event.target.value })
                    }
                    className="num mt-1.5"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="cl-window">{t.checklists.windowLabel}</Label>
                  <Input
                    id="cl-window"
                    type="number"
                    min={15}
                    max={1440}
                    value={draft.windowMinutes}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        windowMinutes: Number(event.target.value) || 120,
                      })
                    }
                    className="num mt-1.5"
                  />
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-[13px] font-semibold text-ink-700">
                  {t.checklists.who}
                </p>
                <ul className="flex flex-wrap gap-2">
                  {members.map((member) => (
                    <li key={member.id}>
                      <Button
                        size="sm"
                        variant={
                          draft.assignedTo === member.id ? "primary" : "outline"
                        }
                        onClick={() =>
                          setDraft({ ...draft, assignedTo: member.id })
                        }
                      >
                        <Avatar name={member.name} size={22} />
                        {member.name}
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="mb-1.5 text-[13px] font-semibold text-ink-700">
                  {t.checklists.items}
                </p>
                <ul className="flex flex-col gap-2">
                  {draft.items.map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Input
                        value={item.title}
                        aria-label={`${t.checklists.items} ${index + 1}`}
                        placeholder={t.checklists.itemPlaceholder}
                        onChange={(event) => {
                          const items = [...draft.items];
                          items[index] = {
                            ...item,
                            title: event.target.value,
                          };
                          setDraft({ ...draft, items });
                        }}
                        className="flex-1 text-[15px] font-normal"
                      />
                      <label
                        className="flex size-tap shrink-0 items-center justify-center"
                        aria-label={t.chips.photoChahiye}
                      >
                        <Camera
                          className={
                            item.proofRequired
                              ? "size-5 text-neel-600"
                              : "size-5 text-ink-400"
                          }
                          aria-hidden="true"
                        />
                        <input
                          type="checkbox"
                          checked={item.proofRequired}
                          className="sr-only"
                          onChange={(event) => {
                            const items = [...draft.items];
                            items[index] = {
                              ...item,
                              proofRequired: event.target.checked,
                            };
                            setDraft({ ...draft, items });
                          }}
                        />
                      </label>
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={t.checklists.remove}
                        onClick={() =>
                          setDraft({
                            ...draft,
                            items: draft.items.filter((_, i) => i !== index),
                          })
                        }
                      >
                        <X />
                      </Button>
                    </li>
                  ))}
                </ul>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      items: [...draft.items, { title: "", proofRequired: false }],
                    })
                  }
                >
                  <Plus />
                  {t.checklists.addItem}
                </Button>
              </div>

              {error ? (
                <p
                  role="alert"
                  className="rounded-card bg-laal-100 px-3 py-2 text-[15px] leading-[20px] text-laal-700"
                >
                  {error}
                </p>
              ) : null}

              <Button size="block" disabled={pending} onClick={save}>
                {pending ? t.common.loading : t.checklists.save}
              </Button>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}
