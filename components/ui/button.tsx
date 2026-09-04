import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Waakya buttons. Design Direction §5.1/§5.2 and screens/StyleTile.png.
 *
 * Neel is the only working accent, so `primary` is the single Neel-filled
 * button on a screen. Haldi is never a button (D-01/D-12). Heights come from
 * the touch-target rules: 48 owner, 56 staff, 60 staff primary.
 */
const buttonVariants = cva(
  [
    "inline-flex shrink-0 items-center justify-center gap-2",
    "rounded-button font-semibold whitespace-nowrap",
    "transition-colors outline-none select-none",
    "disabled:pointer-events-none disabled:bg-paper-200 disabled:text-ink-400 disabled:border-transparent",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  ],
  {
    variants: {
      variant: {
        primary: "bg-neel-600 text-white hover:bg-neel-700 active:bg-neel-700",
        secondary: "bg-neel-100 text-neel-700 hover:bg-neel-200",
        outline:
          "bg-paper-0 text-ink-900 border border-paper-200 hover:bg-paper-100",
        ghost: "bg-transparent text-neel-600 hover:bg-neel-50",
        danger: "bg-laal-100 text-laal-600 hover:bg-laal-100/70",
        /** Laal 600 solid — only for a destructive confirmation. */
        dangerSolid: "bg-laal-600 text-white hover:bg-laal-700",
      },
      size: {
        /** Inline actions inside a card row. */
        sm: "h-10 px-3 text-[13px]",
        /** Owner tap target. */
        owner: "h-tap px-4 text-[15px]",
        /** Staff tap target. */
        staff: "h-tap-staff px-5 text-[17px]",
        /** The one big button on a staff screen. */
        staffPrimary: "h-tap-staff-primary w-full px-5 text-[17px]",
        /** Full-width owner primary (the Confirm card's Bhejo). */
        block: "h-tap-staff w-full px-5 text-[17px]",
        icon: "size-tap",
        iconStaff: "size-tap-staff",
      },
    },
    defaultVariants: { variant: "primary", size: "owner" },
  },
);

function Button({
  className,
  variant,
  size,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
