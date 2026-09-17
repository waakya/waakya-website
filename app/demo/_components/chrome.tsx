"use client";

import * as React from "react";
import { Bell, Check, Search, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { PEOPLE } from "../_lib/data";

/* ------------------------------------------------------------ typography -- */

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--d-faint)]",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function Title({
  children,
  className,
  size = "lg",
}: {
  children: React.ReactNode;
  className?: string;
  size?: "lg" | "xl" | "md";
}) {
  return (
    <h2
      className={cn(
        "font-display font-extrabold tracking-[-0.02em] text-balance text-[var(--d-text)]",
        size === "xl" && "text-[clamp(40px,5.6vw,72px)] leading-[1.02]",
        size === "lg" && "text-[clamp(30px,3.6vw,48px)] leading-[1.06]",
        size === "md" && "text-[clamp(24px,2.4vw,32px)] leading-[1.12]",
        className,
      )}
    >
      {children}
    </h2>
  );
}

export function Lead({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("max-w-[58ch] text-[17px] leading-[1.6] text-[var(--d-dim)]", className)}>
      {children}
    </p>
  );
}

/** A short line the presenter can read aloud. Used sparingly. */
export function PresenterNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="inline-flex items-center gap-2.5 rounded-full border border-[var(--d-line)] bg-[var(--d-veil)] px-4 py-2 text-[14px] font-medium text-[var(--d-dim)]">
      <span
        aria-hidden="true"
        className="size-1.5 shrink-0 rounded-full bg-[var(--d-accent)]"
      />
      {children}
    </p>
  );
}

/* ----------------------------------------------------------------- stage -- */

/** One presentation section: centred, never wider than a laptop screen. */
export function Stage({
  children,
  className,
  wide = false,
}: {
  children: React.ReactNode;
  className?: string;
  wide?: boolean;
}) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full flex-col justify-center px-6 py-10 lg:px-10",
        wide ? "max-w-[1240px]" : "max-w-[1080px]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------- product surface -- */

/**
 * The product itself: a light application window floating on the dark ground.
 * Everything inside uses the --s-* surface tokens so the app reads as a real
 * screen rather than as slide furniture.
 */
export function AppWindow({
  children,
  title,
  subtitle,
  right,
  className,
  bodyClassName,
}: {
  children: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[18px] border border-[var(--d-line)] bg-[var(--s-bg)] text-[var(--s-text)] shadow-[var(--d-shadow)]",
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b border-[var(--s-line)] bg-[var(--s-sub)] px-4 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-[var(--s-text)]">{title}</p>
          {subtitle ? (
            <p className="truncate text-[11.5px] text-[var(--s-faint)]">{subtitle}</p>
          ) : null}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {right}
          <span className="hidden items-center gap-1.5 rounded-md border border-[var(--s-line)] bg-[var(--s-bg)] px-2 py-1 text-[11.5px] text-[var(--s-faint)] sm:inline-flex">
            <Search className="size-3.5" aria-hidden="true" />
            Search
          </span>
          <Bell className="size-4 text-[var(--s-faint)]" aria-hidden="true" />
        </div>
      </div>
      <div className={cn("wk-scroll", bodyClassName)}>{children}</div>
    </div>
  );
}

/** A plain light panel, for pieces shown outside a full window. */
export function Panel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[14px] border border-[var(--s-line)] bg-[var(--s-bg)] text-[var(--s-text)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ atoms -- */

type Tone = "neutral" | "accent" | "good" | "warn" | "bad";

const TONE_LIGHT: Record<Tone, string> = {
  neutral: "bg-[var(--s-sub)] text-[var(--s-dim)] border-[var(--s-line)]",
  accent: "bg-[#eef0fe] text-[#3541c4] border-[#dcdffb]",
  good: "bg-[#e6f6ee] text-[#14623a] border-[#cfeddf]",
  warn: "bg-[#fdf2de] text-[#8a5a12] border-[#f6e4c2]",
  bad: "bg-[#fdeaea] text-[#a61f1f] border-[#f7d5d5]",
};

const TONE_DARK: Record<Tone, string> = {
  neutral: "bg-[var(--d-veil)] text-[var(--d-dim)] border-[var(--d-line)]",
  accent: "bg-[var(--d-accent-wash)] text-[var(--d-accent-bright)] border-[var(--d-line)]",
  good: "bg-[var(--d-good-wash)] text-[var(--d-good)] border-[rgba(78,201,139,0.3)]",
  warn: "bg-[var(--d-warn-wash)] text-[var(--d-warn)] border-[rgba(232,178,95,0.3)]",
  bad: "bg-[var(--d-bad-wash)] text-[var(--d-bad)] border-[rgba(240,127,127,0.3)]",
};

/** Status always reads as an icon plus a word, never colour alone. */
export function Chip({
  children,
  tone = "neutral",
  icon,
  onDark = false,
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  icon?: React.ReactNode;
  onDark?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-[11.5px] font-semibold whitespace-nowrap",
        "[&_svg]:size-3.5 [&_svg]:shrink-0",
        onDark ? TONE_DARK[tone] : TONE_LIGHT[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

const AVATAR_TINT: Record<string, string> = {
  urbannest: "bg-[#3541c4]",
  greenwood: "bg-[#1f6f52]",
};

/** Initials avatar. Two tints only: our business, and the other business. */
export function PersonAvatar({
  personId,
  size = 32,
  className,
}: {
  personId: string;
  size?: number;
  className?: string;
}) {
  const person = PEOPLE[personId];
  const initials = person
    ? person.name
        .split(" ")
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
    : "?";
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
        AVATAR_TINT[person?.org ?? "urbannest"],
        className,
      )}
    >
      {initials}
    </span>
  );
}

export function PersonName({ personId, className }: { personId: string; className?: string }) {
  const person = PEOPLE[personId];
  return <span className={className}>{person?.name ?? "Someone"}</span>;
}

/* -------------------------------------------------------------- timeline -- */

export interface TimelineStep {
  id: string;
  label: string;
  at: string;
  by?: string;
}

/** The accountability spine: what happened, when, and who did it. */
export function Timeline({
  steps,
  reachedUpTo,
  className,
}: {
  steps: readonly TimelineStep[];
  /** Index of the last step that has happened. -1 shows none. */
  reachedUpTo: number;
  className?: string;
}) {
  return (
    <ol className={cn("flex flex-col", className)}>
      {steps.map((step, index) => {
        const done = index <= reachedUpTo;
        const isLast = index === steps.length - 1;
        return (
          <li key={step.id} className="grid grid-cols-[18px_1fr] gap-x-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "mt-[5px] grid size-[18px] place-items-center rounded-full border transition-colors duration-300",
                  done
                    ? "border-transparent bg-[#3541c4] text-white"
                    : "border-[var(--s-line)] bg-[var(--s-bg)] text-transparent",
                )}
              >
                <Check className="size-3" aria-hidden="true" />
              </span>
              {!isLast ? (
                <span
                  className={cn(
                    "w-px flex-1 transition-colors duration-300",
                    done ? "bg-[#c9cdf6]" : "bg-[var(--s-line)]",
                  )}
                />
              ) : null}
            </div>
            <div className={cn("pb-3", isLast && "pb-0")}>
              <p
                className={cn(
                  "text-[13px] font-semibold",
                  done ? "text-[var(--s-text)]" : "text-[var(--s-faint)]",
                )}
              >
                {step.label}
              </p>
              <p className="wk-tabnum text-[12px] text-[var(--s-faint)]">
                {done ? step.at : "Pending"}
                {done && step.by ? ` · ${step.by}` : ""}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ---------------------------------------------------------------- drawer -- */

/** Right-hand detail panel. Escape is handled by the deck. */
export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  // Escape closes whichever drawer is open, wherever its state lives. The deck
  // checks for an open dialog before acting on Escape itself, so the two never
  // fight over the same keypress.
  React.useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="absolute inset-0 z-30 flex justify-end">
      <button
        type="button"
        aria-label="Close panel"
        onClick={onClose}
        className="wk-fade absolute inset-0 cursor-default bg-[rgba(7,8,24,0.5)]"
      />
      <aside
        className="wk-pop relative flex h-full w-full max-w-[440px] flex-col border-l border-[var(--s-line)] bg-[var(--s-bg)] text-[var(--s-text)] shadow-[var(--d-shadow)]"
        role="dialog"
        aria-modal="true"
      >
        <header className="flex items-start gap-3 border-b border-[var(--s-line)] px-5 py-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-[16px] leading-snug font-semibold">{title}</h3>
            {subtitle ? (
              <p className="mt-0.5 text-[12.5px] text-[var(--s-faint)]">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-8 shrink-0 place-items-center rounded-lg border border-[var(--s-line)] text-[var(--s-dim)] transition-colors hover:bg-[var(--s-sub)]"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </header>
        <div className="wk-scroll flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <footer className="border-t border-[var(--s-line)] bg-[var(--s-sub)] px-5 py-3">
            {footer}
          </footer>
        ) : null}
      </aside>
    </div>
  );
}

/* --------------------------------------------------------------- buttons -- */

export function DemoButton({
  children,
  onClick,
  variant = "primary",
  size = "md",
  className,
  disabled,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "soft" | "quiet" | "good";
  size?: "sm" | "md";
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold whitespace-nowrap",
        "transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-45",
        "[&_svg]:size-4 [&_svg]:shrink-0",
        size === "sm" ? "h-8 px-3 text-[12.5px]" : "h-10 px-4 text-[14px]",
        variant === "primary" &&
          "bg-[#3541c4] text-white shadow-[0_1px_2px_rgba(53,65,196,0.4)] hover:bg-[#2c35a5]",
        variant === "soft" &&
          "border border-[var(--s-line)] bg-[var(--s-bg)] text-[var(--s-text)] hover:bg-[var(--s-sub)]",
        variant === "quiet" && "text-[var(--s-dim)] hover:bg-[var(--s-sub)]",
        variant === "good" && "bg-[#14623a] text-white hover:bg-[#0f4e2e]",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Dark-ground button, for the presentation sections themselves. */
export function StageButton({
  children,
  onClick,
  variant = "primary",
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost";
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-[15px] font-semibold",
        "transition-all duration-200 [&_svg]:size-4 [&_svg]:shrink-0",
        variant === "primary" &&
          "bg-[#3541c4] text-white hover:bg-[#2c35a5]",
        variant === "ghost" &&
          "border border-[var(--d-line)] text-[var(--d-dim)] hover:border-[var(--d-accent)] hover:text-[var(--d-text)]",
        className,
      )}
    >
      {children}
    </button>
  );
}
