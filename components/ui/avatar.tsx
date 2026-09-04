import { cn } from "@/lib/utils";

/**
 * Initial avatars are Neel, always.
 *
 * The palette line and the staff screens in the brand kit show a Haldi avatar;
 * we do not, on purpose. Haldi has exactly one job in the product — the done
 * tick — and an avatar competing for it weakens the signal (D-01, D-12). To
 * restore the drawn behaviour, give this component a Haldi variant.
 */
export function Avatar({
  name,
  size = 40,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const initial = firstGrapheme(name);
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full",
        "bg-neel-600 font-semibold text-white",
        className,
      )}
    >
      {initial}
    </span>
  );
}

/**
 * Devanagari initials are a base letter plus any matras, which a plain
 * `name[0]` would split apart. Intl.Segmenter keeps the cluster whole.
 */
function firstGrapheme(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    const first = segmenter.segment(trimmed)[Symbol.iterator]().next();
    if (!first.done) return first.value.segment.toUpperCase();
  }
  return trimmed.slice(0, 1).toUpperCase();
}
