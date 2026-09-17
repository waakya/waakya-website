/**
 * The Waakya illustration set: simple human line art in navy, with a single
 * Waakya-blue accent and, rarely, a soft warm accent.
 *
 * Used in marketing, onboarding, empty states and explanatory moments — never
 * inside operational tables. Every figure is decorative (aria-hidden); the
 * words beside it carry the meaning.
 *
 * The warm accent is deliberately not the Haldi of the done tick: that colour
 * means "done" in the product and nowhere else.
 */
import { cn } from "@/lib/utils";

const INK = "#1b2060";
const BLUE = "#3541c4";
const WARM = "#f6c85f";
const PAPER = "#ffffff";

export type IllustrationName =
  | "conversation"
  | "documents"
  | "team"
  | "laptop"
  | "handoff"
  | "review"
  | "attendance"
  | "projects";

function Person({
  x,
  y,
  scale = 1,
  flip = false,
  shirt = PAPER,
}: {
  x: number;
  y: number;
  scale?: number;
  flip?: boolean;
  shirt?: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`}>
      {/* head and hair */}
      <circle cx="0" cy="-58" r="11" fill={PAPER} stroke={INK} strokeWidth="2" />
      <path d="M-11 -61c2-9 9-13 15-12 5 1 8 5 8 9" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      {/* body */}
      <path
        d="M-17 0c0-24 6-40 17-40s17 16 17 40"
        fill={shirt}
        stroke={INK}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M0 -47v7" stroke={INK} strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

function Conversation() {
  return (
    <>
      <Person x={70} y={150} shirt={BLUE} />
      <Person x={170} y={150} flip />
      <rect x="92" y="34" width="56" height="30" rx="9" fill={PAPER} stroke={INK} strokeWidth="2" />
      <path d="M104 64l-6 9 13-9" fill={PAPER} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <path d="M104 45h32M104 53h20" stroke={BLUE} strokeWidth="2" strokeLinecap="round" />
      <circle cx="160" cy="30" r="5" fill={WARM} />
    </>
  );
}

function Documents() {
  return (
    <>
      <rect x="120" y="44" width="62" height="80" rx="6" fill={PAPER} stroke={INK} strokeWidth="2" transform="rotate(8 151 84)" />
      <rect x="112" y="40" width="62" height="80" rx="6" fill={PAPER} stroke={INK} strokeWidth="2" />
      <path d="M124 58h38M124 70h38M124 82h26" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      <path d="M124 100l8 8 16-18" stroke={BLUE} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Person x={72} y={150} shirt={BLUE} />
      <path d="M86 118c10-4 18-10 26-16" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />
    </>
  );
}

function Team() {
  return (
    <>
      <Person x={60} y={152} scale={0.92} />
      <Person x={120} y={150} shirt={BLUE} />
      <Person x={180} y={152} scale={0.92} flip />
      <path d="M40 40c30-18 130-18 160 0" stroke={BLUE} strokeWidth="2" fill="none" strokeDasharray="4 6" strokeLinecap="round" />
      <circle cx="120" cy="30" r="5" fill={WARM} />
    </>
  );
}

function Laptop() {
  return (
    <>
      <Person x={96} y={150} shirt={BLUE} />
      <path d="M118 112h72l-8 30h-60z" fill={PAPER} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <path d="M112 142h86" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      <path d="M140 124h26" stroke={BLUE} strokeWidth="2" strokeLinecap="round" />
      <path d="M150 46c14 0 24 10 24 22" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M170 64l4 6 5-5" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
}

function Handoff() {
  return (
    <>
      <Person x={70} y={150} />
      <Person x={170} y={150} shirt={BLUE} flip />
      <rect x="104" y="92" width="32" height="40" rx="4" fill={PAPER} stroke={INK} strokeWidth="2" transform="rotate(-8 120 112)" />
      <path d="M112 104h16M112 112h16M112 120h10" stroke={BLUE} strokeWidth="2" strokeLinecap="round" transform="rotate(-8 120 112)" />
      <path d="M84 112c6-2 12-4 20-6M156 112c-6-2-12-4-20-6" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />
    </>
  );
}

function Review() {
  return (
    <>
      <Person x={84} y={150} shirt={BLUE} />
      <rect x="120" y="48" width="70" height="88" rx="8" fill={PAPER} stroke={INK} strokeWidth="2" />
      <path d="M134 70l5 5 9-10M134 92l5 5 9-10" stroke={BLUE} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M156 70h22M156 92h22M134 114h44" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      <path d="M100 118c8-6 14-12 20-20" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />
    </>
  );
}

function Attendance() {
  return (
    <>
      <Person x={80} y={150} shirt={BLUE} />
      <circle cx="160" cy="84" r="36" fill={PAPER} stroke={INK} strokeWidth="2" />
      <path d="M160 62v22l14 10" stroke={BLUE} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="160" cy="84" r="3" fill={INK} />
      <circle cx="196" cy="48" r="5" fill={WARM} />
    </>
  );
}

function Projects() {
  return (
    <>
      <path d="M36 126c30-40 60-10 90-40s50-44 80-50" stroke={BLUE} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeDasharray="1 0" />
      {[
        [36, 126],
        [98, 100],
        [150, 70],
        [206, 36],
      ].map(([cx, cy], index) => (
        <circle key={index} cx={cx} cy={cy} r="8" fill={index === 3 ? WARM : PAPER} stroke={INK} strokeWidth="2" />
      ))}
      <Person x={70} y={156} scale={0.8} />
    </>
  );
}

const SCENES: Record<IllustrationName, () => React.ReactNode> = {
  conversation: Conversation,
  documents: Documents,
  team: Team,
  laptop: Laptop,
  handoff: Handoff,
  review: Review,
  attendance: Attendance,
  projects: Projects,
};

export function Illustration({
  name,
  className,
}: {
  name: IllustrationName;
  className?: string;
}) {
  const Scene = SCENES[name];
  return (
    <svg
      viewBox="0 0 240 160"
      aria-hidden="true"
      focusable="false"
      className={cn("h-auto w-full", className)}
    >
      <Scene />
    </svg>
  );
}

/** A handwritten note with an arrow, for marketing moments only. */
export function Annotation({
  text,
  className,
  arrow = "down-left",
}: {
  text: string;
  className?: string;
  arrow?: "down-left" | "down-right";
}) {
  return (
    <span className={cn("inline-flex flex-col items-start", className)} aria-hidden="true">
      <span className="text-[22px] leading-tight text-neel-700 [font-family:var(--font-hand),'Segoe_Print','Bradley_Hand',cursive] -rotate-3">
        {text}
      </span>
      <svg viewBox="0 0 60 40" className={cn("mt-1 h-8 w-12", arrow === "down-right" && "-scale-x-100")}>
        <path d="M54 4C40 10 22 18 10 34" fill="none" stroke={BLUE} strokeWidth="2" strokeLinecap="round" />
        <path d="M8 22l2 12 11-5" fill="none" stroke={BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
