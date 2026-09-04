"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * हिंदी · Hinglish · English, always in that order (§5.2). The choice is
 * written server-side so the next render picks the right script and font.
 */
export function LanguageSwitch({
  value,
  onChange,
  className,
}: {
  value: Locale;
  /** Persists the choice. The caller decides where it is stored. */
  onChange: (locale: Locale) => Promise<void>;
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div
      role="radiogroup"
      aria-label={LOCALE_LABELS.en}
      className={cn(
        "inline-flex items-center gap-1 rounded-chip border border-paper-200 bg-paper-0 p-1",
        className,
      )}
    >
      {LOCALES.map((locale) => {
        const selected = locale === value;
        return (
          <button
            key={locale}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={pending}
            lang={locale}
            onClick={() =>
              startTransition(async () => {
                await onChange(locale);
                router.refresh();
              })
            }
            className={cn(
              "min-h-tap rounded-chip px-4 text-[15px] font-semibold transition-colors",
              selected
                ? "bg-neel-100 text-neel-700"
                : "text-ink-700 hover:bg-paper-100",
            )}
          >
            {LOCALE_LABELS[locale]}
          </button>
        );
      })}
    </div>
  );
}
