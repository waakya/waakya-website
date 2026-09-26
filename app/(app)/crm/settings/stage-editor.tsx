"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StateChip } from "@/components/ui/state-chip";
import { ListSurface } from "@/components/waakya/page";
import { getCrm } from "@/lib/i18n/crm";
import type { Locale } from "@/lib/i18n";
import type { Stage } from "@/lib/crm/queries";
import { addStage, deleteStage, renameStage, reorderStages } from "@/lib/crm/actions";

const SELECT = "h-tap rounded-button border-2 border-paper-200 bg-paper-0 px-3 text-body outline-none focus:border-neel-600";

export function StageEditor({ locale, stages }: { locale: Locale; stages: Stage[] }) {
  const t = getCrm(locale);
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [name, setName] = React.useState("");
  const [kind, setKind] = React.useState<"open" | "won" | "lost">("open");

  const run = (fn: () => Promise<{ ok: boolean; message?: string }>) =>
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) toast.error(result.message ?? "");
      router.refresh();
    });

  const move = (index: number, delta: number) => {
    const ids = stages.map((s) => s.id);
    const target = index + delta;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    run(() => reorderStages({ ids }));
  };

  return (
    <div className="flex flex-col gap-4">
      <ListSurface label={t.pipeline.title}>
        {stages.map((stage, index) => (
          <li key={stage.id} className="flex items-center gap-2 px-3 py-2">
            <Input
              aria-label={t.pipeline.stageName}
              defaultValue={stage.name}
              maxLength={40}
              className="h-10 min-w-0 flex-1 text-body"
              onBlur={(e) => {
                const value = e.target.value.trim();
                if (value && value !== stage.name) run(() => renameStage({ id: stage.id, name: value }));
              }}
            />
            <StateChip tone={stage.kind === "won" ? "hara" : stage.kind === "lost" ? "muted" : "outline"}>{t.pipeline.kinds[stage.kind]}</StateChip>
            <Button variant="ghost" size="icon" aria-label={`${stage.name} ↑`} disabled={pending || index === 0} onClick={() => move(index, -1)}><ArrowUp aria-hidden="true" /></Button>
            <Button variant="ghost" size="icon" aria-label={`${stage.name} ↓`} disabled={pending || index === stages.length - 1} onClick={() => move(index, 1)}><ArrowDown aria-hidden="true" /></Button>
            <Button variant="ghost" size="icon" aria-label={`${t.actions.archive} ${stage.name}`} disabled={pending} onClick={() => run(() => deleteStage(stage.id))}><Trash2 aria-hidden="true" /></Button>
          </li>
        ))}
      </ListSurface>
      <form
        className="flex flex-wrap items-end gap-2 rounded-card border border-line bg-surface p-3"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => addStage({ name, kind }));
          setName("");
        }}
      >
        <div className="min-w-40 flex-1">
          <Label htmlFor="stage-name">{t.pipeline.stageName}</Label>
          <Input id="stage-name" className="mt-1" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} required />
        </div>
        <select aria-label={t.fields.stage} className={SELECT} value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
          <option value="open">{t.pipeline.kinds.open}</option>
          <option value="won">{t.pipeline.kinds.won}</option>
          <option value="lost">{t.pipeline.kinds.lost}</option>
        </select>
        <Button type="submit" disabled={pending || name.trim().length === 0}>
          <Plus aria-hidden="true" />
          {t.pipeline.addStage}
        </Button>
      </form>
    </div>
  );
}
