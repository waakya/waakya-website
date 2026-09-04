import { SideNav } from "@/components/vaakya/side-nav";
import { BottomNav } from "@/components/vaakya/bottom-nav";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * One frame for every signed-in screen, at every width.
 *
 * Below `lg` it is the phone layout the product was designed as: a centred
 * column with the bottom nav under it. From `lg` up the sidebar takes over and
 * the content gets the rest of the viewport. One component tree serves both —
 * there is no separate desktop app.
 */
export function AppShell({
  locale,
  variant,
  orgName,
  personName,
  roleLabel,
  unread,
  children,
  /**
   * Screens that lay themselves out across the full width (the dashboard) opt
   * out of the centred reading column that everything else keeps.
   */
  wide = false,
}: {
  locale: Locale;
  variant: "owner" | "staff";
  orgName: string;
  personName: string;
  roleLabel: string;
  unread: number;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="flex min-h-dvh bg-paper-50">
      {/* The wrapper carries the Neel ground so the column stays coloured for
          the whole page; the nav inside it sticks to the viewport. */}
      <div className="hidden w-64 shrink-0 bg-neel-900 lg:block xl:w-72">
        <SideNav
          locale={locale}
          variant={variant}
          orgName={orgName}
          personName={personName}
          roleLabel={roleLabel}
          unread={unread}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div
          className={cn(
            "flex w-full flex-1 flex-col",
            // The phone column, kept exactly as it was.
            "mx-auto max-w-md lg:mx-0",
            wide ? "lg:max-w-none" : "lg:max-w-3xl lg:px-8 lg:py-2",
          )}
        >
          {children}
        </div>
        <BottomNav locale={locale} variant={variant} />
      </div>
    </div>
  );
}
