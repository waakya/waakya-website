"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getPortal } from "@/lib/i18n/portal";
import type { Locale } from "@/lib/i18n";
import { decide } from "@/lib/portal/actions";
import { cn } from "@/lib/utils";

/**
 * The laminate demo, honest: every option is a real button with its own
 * pressed state; confirming records exactly the one that was pressed; the
 * server answers with what it stored, which is what is shown.
 */
export function DecideForm({ locale, decision }: { locale: Locale; decision: { id: string; options: { key: string; label: string; detail?: string }[] } }) {
  const t = getPortal(locale).portal;
  const router = useRouter();
  const [picked, setPicked] = React.useState<string | null>(null);
  const [note, setNote] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const [done, setDone] = React.useState<string | null>(null);

  if (done) {
    return <p className="mt-3 text-body font-semibold text-hara-700">{t.decided(decision.options.find((o) => o.key === done)?.label ?? done)}</p>;
  }

  return (
    <form
      className="mt-3 flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!picked) return;
        startTransition(async () => {
          const result = await decide({ decisionId: decision.id, optionKey: picked, note });
          if (!result.ok) {
            toast.error(result.message);
            router.refresh();
            return;
          }
          setDone(result.data.optionKey);
          router.refresh();
        });
      }}
    >
      <div role="group" aria-label={t.choose} className="flex flex-wrap gap-2">
        {decision.options.map((o) => (
          <button
            key={o.key}
            type="button"
            aria-pressed={picked === o.key}
            onClick={() => setPicked(o.key)}
            className={cn(
              "min-h-tap-staff rounded-button border-2 px-4 text-body-lg font-semibold transition-colors duration-150",
              picked === o.key ? "border-neel-600 bg-neel-600 text-white" : "border-paper-200 bg-paper-0 text-ink-900 hover:border-neel-300",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
      <input aria-label={t.noteOptional} placeholder={t.noteOptional} value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} className="h-tap w-full rounded-button border-2 border-paper-200 bg-paper-0 px-4 text-body outline-none focus:border-neel-600" />
      <Button type="submit" size="staffPrimary" disabled={pending || !picked}>
        {picked ? `${t.confirm}: ${decision.options.find((o) => o.key === picked)?.label}` : t.choose}
      </Button>
    </form>
  );
}
