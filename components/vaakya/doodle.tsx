/**
 * The doodle: the mark's three strokes scattered at low opacity on paper
 * (Character document §2.8). It is the wallpaper for the landing hero and
 * empty states — never behind text smaller than 20px, and never on the working
 * screens.
 */
export function Doodle({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={className}>
      <svg
        width="100%"
        height="100%"
        className="opacity-[0.07]"
        role="presentation"
      >
        <defs>
          <pattern
            id="waakya-doodle"
            width="160"
            height="160"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-12)"
          >
            <g
              fill="none"
              stroke="var(--neel-600)"
              strokeWidth={4}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 34v10" />
              <path d="M28 26v26" />
              <path d="M42 44l6 6 10-18" />
              <path d="M104 108v10" />
              <path d="M114 100v26" />
              <path d="M128 118l6 6 10-18" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#waakya-doodle)" />
      </svg>
    </div>
  );
}
