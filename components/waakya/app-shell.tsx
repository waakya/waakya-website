import { SideNav } from "@/components/waakya/side-nav";
import { BottomNav } from "@/components/waakya/bottom-nav";
import type { Locale } from "@/lib/i18n";
import type { ModuleKey } from "@/lib/modules/catalog";
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
  modules,
  children,
  /**
   * How much of a wide screen the content takes (design system §8):
   *  - `reading` (default): one centred column, for detail and forms;
   *  - `list`: a wider centred container, for lists and tables;
   *  - `full`: the screen lays itself out edge to edge (Today, a thread).
   * `wide` is the older name for `full`.
   */
  width,
  wide = false,
}: {
  locale: Locale;
  variant: "owner" | "staff";
  orgName: string;
  personName: string;
  roleLabel: string;
  unread: number;
  /** The capabilities switched on; navigation shows only those. */
  modules?: ReadonlySet<ModuleKey>;
  memberships?: unknown;
  children: React.ReactNode;
  width?: "reading" | "list" | "full";
  wide?: boolean;
}) {
  const layout = width ?? (wide ? "full" : "reading");
  const moduleList = modules ? [...modules] : undefined;
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
          modules={moduleList}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div
          className={cn(
            "flex w-full flex-1 flex-col",
            // The phone column; a tablet gets a wider one rather than a
            // phone floating in the middle of the screen.
            "mx-auto max-w-md md:max-w-2xl",
            // From lg the column centres in what the sidebar leaves, instead
            // of pinning a phone-width strip to the left of an empty canvas.
            layout === "full" && "lg:max-w-none",
            layout === "reading" && "lg:max-w-3xl lg:px-8 lg:py-4",
            layout === "list" && "lg:max-w-5xl lg:px-8 lg:py-4",
          )}
        >
          {children}
        </div>
        <BottomNav locale={locale} variant={variant} modules={moduleList} />
      </div>
    </div>
  );
}
