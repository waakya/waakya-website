"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { applyPreset } from "@/lib/modules/actions";
import { getPlatform } from "@/lib/i18n/platform";
import type { Locale } from "@/lib/i18n";
import type { PresetKey } from "@/lib/modules/presets";

/** One tap turns on everything a kind of business uses; each module can still be switched off afterwards. */
export function PresetPicker({ locale }: { locale: Locale }) {
  const t = getPlatform(locale).modules.presets;
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const apply = (preset: PresetKey) =>
    startTransition(async () => {
      const result = await applyPreset({ preset });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      router.refresh();
    });

  const presets: PresetKey[] = ["real_estate_sales", "interior_projects", "minimal"];
  return (
    <section className="mt-5 rounded-card border border-paper-200 bg-paper-0 p-4">
      <h2 className="text-[15px] font-semibold text-ink-900">{t.title}</h2>
      <p className="mt-0.5 text-[13px] leading-[18px] text-ink-500">{t.help}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {presets.map((preset) => (
          <Button key={preset} variant="outline" size="owner" disabled={pending} onClick={() => apply(preset)}>
            {t[preset]}
          </Button>
        ))}
      </div>
    </section>
  );
}
