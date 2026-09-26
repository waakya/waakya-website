import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The top of every signed-in screen (design constitution §6): a title, one
 * line of context, and at most one primary action on the right. On a phone the
 * action drops under the title so the title never truncates to make room.
 */
export function PageHeader({
  title,
  description,
  actions,
  back,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** One primary action, optionally with a quieter one beside it. */
  actions?: React.ReactNode;
  /** A parent screen to step back to, with its name. */
  back?: { href: string; label: string };
  className?: string;
}) {
  return (
    <header className={cn("flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {back ? (
          <Link
            href={back.href}
            className="mb-2 inline-flex min-h-8 items-center gap-1.5 rounded-inner text-label font-semibold text-neel-700 hover:text-neel-800"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            {back.label}
          </Link>
        ) : null}
        <h1 className="text-title font-bold text-fg">{title}</h1>
        {description ? (
          <p className="num mt-1 text-body text-fg-subtle">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

/**
 * A section of a screen: a small heading with an optional count and a link,
 * then its content. Headings are text, not boxes.
 */
export function Section({
  title,
  count,
  action,
  children,
  className,
  id,
}: {
  title: React.ReactNode;
  count?: number;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section className={cn("mt-8 first:mt-0", className)} aria-labelledby={id}>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 id={id} className="text-body font-bold text-fg">
          {title}
          {typeof count === "number" ? (
            <span className="num ml-1.5 font-normal text-fg-subtle">{count}</span>
          ) : null}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** A list is one surface with dividers, not a stack of cards (§5). */
export function ListSurface({
  children,
  className,
  label,
}: {
  children: React.ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <ul
      aria-label={label}
      className={cn(
        "divide-y divide-line overflow-hidden rounded-card border border-line bg-surface shadow-card",
        className,
      )}
    >
      {children}
    </ul>
  );
}

/**
 * An empty state answers: what is this, why would I use it, what do I do
 * next (§10). A small line icon at most.
 */
export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  body?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-card border border-dashed border-line-strong px-6 py-10 text-center",
        className,
      )}
    >
      {icon ? <span className="text-fg-subtle [&_svg]:size-7" aria-hidden="true">{icon}</span> : null}
      <p className="text-body-lg font-bold text-fg">{title}</p>
      {body ? <p className="max-w-sm text-body text-fg-subtle">{body}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
