/**
 * Product views for the website, drawn as real interface rather than
 * screenshots so they stay sharp and never drift from the product. Everything
 * here is sample business data and says so.
 */
import { Check, FileText, Paperclip, Send, SquareCheckBig } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * A product surface. The window chrome is kept for the one hero view; every
 * other mock is a plain bordered surface so the page never reads as a stack
 * of fake windows.
 */
export function Frame({
  children,
  className,
  title,
  chrome = false,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  chrome?: boolean;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[14px] border border-[#dfe2ef] bg-white shadow-[0_18px_50px_-28px_rgba(27,32,96,0.35)]",
        className,
      )}
    >
      {chrome ? (
        <div className="flex items-center gap-1.5 border-b border-[#eceef6] bg-[#fafbfe] px-3.5 py-2">
          <span className="size-2 rounded-full bg-[#e2e4ee]" />
          <span className="size-2 rounded-full bg-[#e2e4ee]" />
          <span className="size-2 rounded-full bg-[#e2e4ee]" />
          {title ? <span className="ml-2 truncate text-[12px] font-semibold text-ink-500">{title}</span> : null}
        </div>
      ) : title ? (
        <div className="border-b border-[#eceef6] px-4 py-2.5 text-[12px] font-semibold tracking-[0.06em] text-ink-500 uppercase">
          {title}
        </div>
      ) : null}
      {children}
    </div>
  );
}

export function Face({ initials, tone = "navy" }: { initials: string; tone?: "navy" | "blue" | "soft" }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-full text-[11px] font-bold",
        tone === "navy" && "bg-neel-900 text-white",
        tone === "blue" && "bg-neel-600 text-white",
        tone === "soft" && "bg-neel-100 text-neel-800",
      )}
    >
      {initials}
    </span>
  );
}

export function Bubble({
  name,
  time,
  text,
  initials,
  highlight = false,
  children,
}: {
  name: string;
  time: string;
  text: string;
  initials: string;
  highlight?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Face initials={initials} tone={highlight ? "blue" : "navy"} />
      <div className="min-w-0">
        <div
          className={cn(
            "rounded-[10px] px-3 py-2",
            highlight ? "border border-neel-200 bg-neel-50" : "bg-[#f5f6fa]",
          )}
        >
          <p className="text-[12px] font-semibold text-ink-900">
            {name} <span className="font-normal text-ink-500">{time}</span>
          </p>
          <p className="text-[13px] leading-[18px] text-ink-700">{text}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Composer() {
  return (
    <div className="flex items-center gap-2 rounded-[10px] border border-[#e6e8f1] px-3 py-2" aria-hidden="true">
      <Paperclip className="size-3.5 text-ink-500" />
      <span className="flex-1 text-[12px] text-ink-500">Write a message</span>
      <span className="grid size-6 place-items-center rounded-[7px] bg-neel-600 text-white">
        <Send className="size-3" />
      </span>
    </div>
  );
}

export function TaskCard({
  title,
  who,
  due,
  state,
  tone = "neel",
}: {
  title: string;
  who: string;
  due: string;
  state?: string;
  tone?: "neel" | "hara" | "amber";
}) {
  return (
    <div className="rounded-[10px] border border-[#e6e8f1] bg-white p-3">
      <div className="flex items-start gap-2">
        <SquareCheckBig className="mt-0.5 size-4 shrink-0 text-neel-600" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] leading-[17px] font-semibold text-ink-900">{title}</p>
          <p className="text-[12px] text-ink-500">
            {who} · {due}
          </p>
        </div>
      </div>
      {state ? (
        <span
          className={cn(
            "mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
            tone === "neel" && "bg-neel-50 text-neel-700",
            tone === "hara" && "bg-hara-100 text-hara-700",
            tone === "amber" && "bg-amber-100 text-amber-700",
          )}
        >
          {state}
        </span>
      ) : null}
    </div>
  );
}

/** Name first, then size, then status — each on its own line, so nothing is squeezed out. */
export function DocCard({ name, meta, state }: { name: string; meta: string; state?: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-[10px] border border-[#e6e8f1] bg-white p-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-[8px] bg-neel-50">
        <FileText className="size-4 text-neel-700" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] leading-[17px] font-semibold break-all text-ink-900">{name}</p>
        <p className="text-[12px] whitespace-nowrap text-ink-500">{meta}</p>
        {state ? (
          <span className="mt-1.5 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-amber-700">
            {state}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function Stamp({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-hara-100 px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-hara-700">
      <Check className="size-3" aria-hidden="true" />
      {text}
    </span>
  );
}
