import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge only knows Tailwind's own names. Without this it reads the
 * Waakya type scale (`text-label`, `text-body`…) as text *colours*, and
 * `cn("text-label", "text-ink-900")` would silently drop the size. The radius
 * steps are taught for the same reason.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        "micro",
        "caption",
        "label",
        "body-sm",
        "body",
        "body-lg",
        "title-sm",
        "title",
        "title-lg",
      ],
      radius: ["inner", "card", "button", "chip", "sheet", "tile"],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
