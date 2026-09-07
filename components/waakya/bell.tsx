import Link from "next/link";
import { Bell as BellIcon } from "lucide-react";

import { getDictionary, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * The bell from screens/Dashboard.png. The count is a number *and* the
 * accessible name says how many, so it is never a red dot you have to guess at.
 */
export function Bell({
  locale,
  unread,
  onNeel = false,
}: {
  locale: Locale;
  unread: number;
  /** Inside the owner's Neel header. */
  onNeel?: boolean;
}) {
  const t = getDictionary(locale);
  const label =
    unread > 0 ? `${t.inbox.title} · ${t.inbox.unread(unread)}` : t.inbox.title;

  return (
    <Link
      href="/khabar"
      aria-label={label}
      className={cn(
        "relative flex size-tap items-center justify-center rounded-tile",
        onNeel ? "bg-white/15 text-white" : "bg-neel-50 text-neel-700",
      )}
    >
      <BellIcon className="size-6" aria-hidden="true" />
      {unread > 0 ? (
        <span
          aria-hidden="true"
          className={cn(
            "num absolute top-1 right-1 min-w-4 rounded-full px-1 text-center text-[11px] leading-4 font-bold",
            // Laal is for Late, Urgent and Cancel only, so the badge is Neel
            // on paper and white on the Neel header.
            onNeel ? "bg-white text-neel-700" : "bg-neel-600 text-white",
          )}
        >
          {unread > 9 ? "9+" : unread}
        </span>
      ) : null}
    </Link>
  );
}
