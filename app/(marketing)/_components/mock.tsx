/**
 * Product views for the website, drawn as real interface rather than
 * screenshots so they stay sharp, translate, and never drift from the product.
 * Everything here uses sample business data and says so.
 */
import { Check, FileText, Paperclip, Send, SquareCheckBig } from "lucide-react";

import { cn } from "@/lib/utils";

export function Frame({
  children,
  className,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[14px] border border-[#dfe2ef] bg-white shadow-[0_18px_50px_-24px_rgba(27,32,96,0.35)]",
        className,
      )}
    >
      <div className="flex items-center gap-1.5 border-b border-[#eceef6] bg-[#fafbfe] px-3.5 py-2">
        <span className="size-2 rounded-full bg-[#e7e8f0]" />
        <span className="size-2 rounded-full bg-[#e7e8f0]" />
        <span className="size-2 rounded-full bg-[#e7e8f0]" />
        {title ? <span className="ml-2 truncate text-[11.5px] font-semibold text-ink-500">{title}</span> : null}
      </div>
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
}: {
  name: string;
  time: string;
  text: string;
  initials: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Face initials={initials} tone={highlight ? "blue" : "navy"} />
      <div
        className={cn(
          "min-w-0 rounded-[10px] px-3 py-2",
          highlight ? "border border-neel-200 bg-neel-50" : "bg-[#f5f6fa]",
        )}
      >
        <p className="text-[12px] font-semibold text-ink-900">
          {name} <span className="font-normal text-ink-400">{time}</span>
        </p>
        <p className="text-[12.5px] leading-[18px] text-ink-700">{text}</p>
      </div>
    </div>
  );
}

export function Composer() {
  return (
    <div className="flex items-center gap-2 rounded-[10px] border border-[#e6e8f1] px-3 py-2">
      <Paperclip className="size-3.5 text-ink-400" aria-hidden="true" />
      <span className="flex-1 text-[12px] text-ink-400">Write a message</span>
      <span className="grid size-6 place-items-center rounded-[7px] bg-neel-600 text-white">
        <Send className="size-3" aria-hidden="true" />
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
          <p className="text-[12.5px] font-semibold text-ink-900">{title}</p>
          <p className="text-[11.5px] text-ink-500">
            {who} · {due}
          </p>
        </div>
        {state ? (
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold",
              tone === "neel" && "bg-neel-50 text-neel-700",
              tone === "hara" && "bg-hara-100 text-hara-700",
              tone === "amber" && "bg-amber-100 text-amber-700",
            )}
          >
            {state}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function DocCard({ name, meta, state }: { name: string; meta: string; state?: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-[10px] border border-[#e6e8f1] bg-white p-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-[8px] bg-neel-50">
        <FileText className="size-4 text-neel-700" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12.5px] font-semibold text-ink-900">{name}</p>
        <p className="text-[11.5px] text-ink-500">{meta}</p>
      </div>
      {state ? (
        <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10.5px] font-semibold text-amber-700">
          {state}
        </span>
      ) : null}
    </div>
  );
}

export function Stamp({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-hara-100 px-2 py-0.5 text-[10.5px] font-semibold text-hara-700">
      <Check className="size-3" aria-hidden="true" />
      {text}
    </span>
  );
}
