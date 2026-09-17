import { Check } from "lucide-react";

import type { Locale } from "@/lib/i18n";
import { getUx } from "@/lib/i18n/ux";
import { cn } from "@/lib/utils";
import { Wordmark } from "@/components/waakya/wordmark";
import { Illustration, type IllustrationName } from "@/components/waakya/illustrations";

/**
 * The frame every setup step shares. On a phone it is one centred column; on a
 * wide screen the form keeps a readable width beside a quiet panel that says
 * where this step sits and what comes next, instead of stretching the field
 * across the whole window.
 */
export function OnboardingFrame({
  locale,
  step,
  illustration,
  children,
}: {
  locale: Locale;
  step: 1 | 2 | 3;
  illustration: IllustrationName;
  children: React.ReactNode;
}) {
  const ux = getUx(locale);
  const steps = ux.setup.asideSteps;

  return (
    <div className="min-h-dvh bg-paper-50">
      <div className="mx-auto grid min-h-dvh w-full max-w-5xl grid-cols-1 gap-10 px-4 py-8 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)] lg:items-center lg:gap-16 lg:px-10">
        <main className="w-full">
          <Wordmark size={26} />
          <p className="num mt-8 text-[13px] font-semibold text-neel-700">{ux.setup.step(step, steps.length)}</p>
          <Illustration name={illustration} className="mt-4 h-24 w-auto lg:hidden" />
          <div className="mt-3">{children}</div>
        </main>

        <aside className="hidden rounded-[20px] border border-paper-200 bg-paper-0 p-10 lg:block" aria-label={ux.setup.asideTitle}>
          <Illustration name={illustration} className="h-44 w-auto" />
          <p className="mt-8 text-[13px] font-semibold tracking-[0.08em] text-ink-500 uppercase">{ux.setup.asideTitle}</p>
          <ol className="mt-4 flex flex-col gap-4">
            {steps.map((label, index) => {
              const number = index + 1;
              const done = number < step;
              const current = number === step;
              return (
                <li key={label} className="flex items-center gap-3">
                  <span
                    className={cn(
                      "num grid size-8 shrink-0 place-items-center rounded-full text-[14px] font-bold",
                      done && "bg-hara-600 text-white",
                      current && "bg-neel-600 text-white",
                      !done && !current && "border border-paper-300 text-ink-500",
                    )}
                  >
                    {done ? <Check className="size-4" strokeWidth={3} aria-hidden="true" /> : number}
                  </span>
                  <span className={cn("text-[16px]", current ? "font-bold text-ink-900" : "text-ink-700")}>{label}</span>
                </li>
              );
            })}
          </ol>
        </aside>
      </div>
    </div>
  );
}
