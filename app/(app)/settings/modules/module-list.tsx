"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Switch } from "@/components/ui/switch";
import { setModule } from "@/lib/modules/actions";
import { getPlatform } from "@/lib/i18n/platform";
import type { Locale } from "@/lib/i18n";
import type { ModuleKey } from "@/lib/modules/catalog";

interface Item {
  key: ModuleKey;
  core: boolean;
  enabled: boolean;
  requires: ModuleKey[];
}

/** Each row says what the capability is, what it needs, and whether it is on — in words, never colour alone. */
export function ModuleList({ locale, manages, items }: { locale: Locale; manages: boolean; items: Item[] }) {
  const t = getPlatform(locale).modules;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<ModuleKey | null>(null);

  const toggle = (key: ModuleKey, enabled: boolean) => {
    setBusy(key);
    startTransition(async () => {
      const result = await setModule({ key, enabled });
      setBusy(null);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      router.refresh();
    });
  };

  return (
    <ul className="overflow-hidden rounded-card border border-paper-200 bg-paper-0">
      {items.map((item) => {
        const id = `module-${item.key}`;
        return (
          <li key={item.key} className="flex min-h-tap items-center gap-3 border-b border-paper-100 px-4 py-3 last:border-b-0">
            <div className="min-w-0 flex-1">
              <label htmlFor={id} className="block text-[15px] font-semibold text-ink-900">
                {t.names[item.key]}
              </label>
              <p className="text-[13px] leading-[18px] text-ink-500">{t.descriptions[item.key]}</p>
              {item.requires.length ? (
                <p className="mt-0.5 text-[12px] text-ink-400">{t.needs(item.requires.map((r) => t.names[r]).join(", "))}</p>
              ) : null}
            </div>
            {item.core ? (
              <span className="text-[13px] font-semibold text-ink-500">{t.alwaysOn}</span>
            ) : (
              <span className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-ink-700">{item.enabled ? t.on : t.off}</span>
                {manages ? (
                  <Switch
                    id={id}
                    checked={item.enabled}
                    disabled={pending && busy === item.key}
                    onCheckedChange={(checked) => toggle(item.key, checked)}
                    aria-label={t.names[item.key]}
                  />
                ) : null}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
