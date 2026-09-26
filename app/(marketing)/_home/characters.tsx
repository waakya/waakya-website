import { cn } from "@/lib/utils";

/**
 * Waakya character family — a V3.1 proposal, local to the Design Lab.
 *
 * Same hand as `components/waakya/illustrations.tsx`: navy line, one Waakya
 * blue accent, a warm accent that is never the Haldi of the done tick.
 * Adults at work, no mascots, no cartoon faces — the people an Indian SMB
 * actually has: the owner, the manager, the person on site, the one on the
 * road, the one at the desk, the one who designs.
 *
 * They are decorative (aria-hidden); words always carry the meaning.
 */
const INK = "#1b2060";
const BLUE = "#3541c4";
const WARM = "#f6c85f";
const HARA = "#17803f";
const PAPER = "#ffffff";

export type CharacterName = "owner" | "manager" | "site" | "road" | "desk" | "designer";

export const CHARACTERS: { name: CharacterName; label: string; role: string }[] = [
  { name: "owner", label: "Priya", role: "Owner — decides, verifies" },
  { name: "manager", label: "Arjun", role: "Manager — coordinates the day" },
  { name: "site", label: "Raju", role: "On site — does the work, sends proof" },
  { name: "road", label: "Imran", role: "On the road — deliveries, pickups" },
  { name: "desk", label: "Neha", role: "At the desk — quotations, records" },
  { name: "designer", label: "Sunita", role: "Designs — measures, specifies" },
];

/** Shared body: a standing adult, seen from the front, two strokes wide. */
function Body({ shirt = PAPER, accent = BLUE }: { shirt?: string; accent?: string }) {
  return (
    <>
      <circle cx="0" cy="-70" r="13" fill={PAPER} stroke={INK} strokeWidth="2.5" />
      <path d="M-13 -74c2-11 11-15 18-14 6 1 9 6 9 11" fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M-20 0c0-28 7-47 20-47s20 19 20 47" fill={shirt} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M0 -57v9" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M-20 -22h40" stroke={accent} strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
    </>
  );
}

function Owner() {
  return (
    <g transform="translate(60 128)">
      <Body shirt={PAPER} />
      {/* a ledger held at the hip, and a small tick: the owner verifies */}
      <g transform="translate(24 -26)">
        <rect x="-4" y="-14" width="30" height="24" rx="3" fill={PAPER} stroke={INK} strokeWidth="2.5" />
        <path d="M2 -4h18M2 2h12" stroke={INK} strokeWidth="2" strokeLinecap="round" />
        <path d="M4 -9l4 4 8-8" fill="none" stroke={BLUE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <path d="M-22 -30c-8 3-12 9-12 16" fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
    </g>
  );
}

function Manager() {
  return (
    <g transform="translate(60 128)">
      <Body shirt={PAPER} />
      {/* clipboard: the day, in order */}
      <g transform="translate(-30 -34)">
        <rect x="-2" y="-12" width="26" height="32" rx="3" fill={PAPER} stroke={INK} strokeWidth="2.5" />
        <rect x="6" y="-17" width="10" height="7" rx="2" fill={WARM} stroke={INK} strokeWidth="2" />
        <path d="M4 -2h14M4 5h14M4 12h8" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      </g>
      <path d="M20 -30c9 2 14 8 14 15" fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
    </g>
  );
}

function Site() {
  return (
    <g transform="translate(60 128)">
      {/* helmet instead of hair */}
      <circle cx="0" cy="-70" r="13" fill={PAPER} stroke={INK} strokeWidth="2.5" />
      <path d="M-16 -74a16 16 0 0 1 32 0z" fill={WARM} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M-20 -74h40" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M-20 0c0-28 7-47 20-47s20 19 20 47" fill={PAPER} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M-20 -22h40" stroke={BLUE} strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
      {/* phone raised: the proof photo */}
      <g transform="translate(26 -40) rotate(12)">
        <rect x="-7" y="-12" width="15" height="25" rx="3" fill={PAPER} stroke={INK} strokeWidth="2.5" />
        <circle cx="0.5" cy="0" r="4" fill="none" stroke={BLUE} strokeWidth="2" />
      </g>
      <path d="M-20 -30c-7 4-10 10-9 17" fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
    </g>
  );
}

function Road() {
  return (
    <g transform="translate(58 132)">
      {/* scooter: the delivery run */}
      <circle cx="-26" cy="-6" r="13" fill={PAPER} stroke={INK} strokeWidth="2.5" />
      <circle cx="30" cy="-6" r="13" fill={PAPER} stroke={INK} strokeWidth="2.5" />
      <path d="M-26 -6h18l10-16h10" fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 -22l12 16h16" fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="-14" y="-40" width="20" height="14" rx="3" fill={WARM} stroke={INK} strokeWidth="2.5" />
      <circle cx="12" cy="-52" r="11" fill={PAPER} stroke={INK} strokeWidth="2.5" />
      <path d="M1 -56a11 11 0 0 1 22 0z" fill={BLUE} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M12 -41c6 2 10 7 10 13" fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
    </g>
  );
}

function Desk() {
  return (
    <g transform="translate(60 130)">
      {/* seated at a desk: quotations, records */}
      <path d="M-34 0h68" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M-26 0v-16h52V0" fill={PAPER} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="-4" cy="-56" r="12" fill={PAPER} stroke={INK} strokeWidth="2.5" />
      <path d="M-16 -60c2-10 10-13 16-12 5 1 8 5 8 9" fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M-22 -16c0-18 6-28 18-28s18 10 18 28" fill={PAPER} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M-22 -28h36" stroke={BLUE} strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
      <rect x="6" y="-30" width="24" height="16" rx="2" fill={PAPER} stroke={INK} strokeWidth="2.5" />
      <path d="M12 -24h12M12 -19h8" stroke={INK} strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

function Designer() {
  return (
    <g transform="translate(60 128)">
      <Body shirt={PAPER} accent={WARM} />
      {/* a rolled drawing and a measuring tape */}
      <g transform="translate(-32 -30) rotate(-14)">
        <rect x="-5" y="-18" width="12" height="34" rx="5" fill={PAPER} stroke={INK} strokeWidth="2.5" />
        <path d="M1 -14v26" stroke={BLUE} strokeWidth="2" strokeLinecap="round" />
      </g>
      <g transform="translate(28 -18)">
        <circle cx="0" cy="0" r="9" fill={PAPER} stroke={INK} strokeWidth="2.5" />
        <path d="M0 -9v18M-9 0h18" stroke={INK} strokeWidth="2" />
      </g>
      <path d="M20 -30c8 3 12 9 12 16" fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
    </g>
  );
}

const ART: Record<CharacterName, () => React.ReactNode> = {
  owner: Owner,
  manager: Manager,
  site: Site,
  road: Road,
  desk: Desk,
  designer: Designer,
};

/**
 * Small expressive states (V3.2.1). The body is unchanged — a state only adds
 * one prop to the same person: something in the hand, a word in the air, a
 * lean forward. No new faces, no bouncing mascots.
 */
export type CharacterAction = "idle" | "talking" | "working" | "waiting" | "uploading" | "reviewing" | "approving" | "walking";

function ActionMark({ action }: { action: CharacterAction }) {
  switch (action) {
    case "talking":
      return (
        <g transform="translate(34 -104)">
          <path d="M0 0h44a8 8 0 0 1 8 8v20a8 8 0 0 1-8 8H16l-10 9v-9H0a8 8 0 0 1-8-8V8a8 8 0 0 1 8-8z" fill={PAPER} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M2 14h38M2 24h24" stroke={BLUE} strokeWidth="2.5" strokeLinecap="round" />
        </g>
      );
    case "uploading":
      return (
        <g transform="translate(30 -96)">
          <rect x="-2" y="-2" width="40" height="30" rx="4" fill={PAPER} stroke={INK} strokeWidth="2.5" />
          <circle cx="18" cy="13" r="7" fill="none" stroke={BLUE} strokeWidth="2.5" />
          <path d="M18 -14v16M12 -8l6-6 6 6" fill="none" stroke={BLUE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
    case "reviewing":
      return (
        <g transform="translate(30 -98)">
          <rect x="0" y="0" width="34" height="26" rx="3" fill={PAPER} stroke={INK} strokeWidth="2.5" />
          <path d="M6 9h22M6 17h14" stroke={INK} strokeWidth="2" strokeLinecap="round" />
          <circle cx="30" cy="24" r="9" fill="none" stroke={BLUE} strokeWidth="2.5" />
          <path d="M37 31l7 7" stroke={BLUE} strokeWidth="2.5" strokeLinecap="round" />
        </g>
      );
    case "approving":
      return (
        <g transform="translate(32 -100)">
          <circle cx="16" cy="16" r="16" fill={PAPER} stroke={HARA} strokeWidth="2.5" />
          <path d="M8 16l6 6 12-13" fill="none" stroke={HARA} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
    case "waiting":
      return (
        <g transform="translate(34 -100)">
          <circle cx="14" cy="14" r="14" fill={PAPER} stroke={INK} strokeWidth="2.5" />
          <path d="M14 6v9l6 4" fill="none" stroke={WARM} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
    case "working":
      return (
        <g transform="translate(30 -92)">
          <path d="M0 18l14-14 8 8-14 14z" fill={PAPER} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M14 4l6-6 8 8-6 6z" fill={WARM} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
        </g>
      );
    default:
      return null;
  }
}

export function Character({
  name,
  action = "idle",
  className,
}: {
  name: CharacterName;
  action?: CharacterAction;
  className?: string;
}) {
  const Art = ART[name];
  return (
    <svg
      viewBox="0 0 120 140"
      aria-hidden="true"
      focusable="false"
      className={cn("h-auto w-full", className)}
      style={action === "walking" ? { transform: "rotate(-3deg)" } : undefined}
    >
      <Art />
      <g transform="translate(60 128)">
        <ActionMark action={action} />
      </g>
    </svg>
  );
}

/**
 * The world behind the workspace (Direction B): the same hand, drawn once,
 * very large and very faint — a site, a scooter, a conversation, a ledger.
 * Never above content, never animated faster than a slow drift.
 */
export function WaakyaWorld({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1200 700" aria-hidden="true" focusable="false" className={cn("h-full w-full", className)} preserveAspectRatio="xMidYMid slice">
      <g fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {/* a building under work, with a crane */}
        <path d="M80 620V330h190v290" />
        <path d="M110 380h40v40h-40zM180 380h40v40h-40zM110 460h40v40h-40zM180 460h40v40h-40z" />
        <path d="M300 620V210M300 240h150M420 240v70" />
        <path d="M300 210l-26 30h52z" />
        {/* conversation, becoming work */}
        <path d="M640 210h230a18 18 0 0 1 18 18v96a18 18 0 0 1-18 18H700l-40 36v-36h-20a18 18 0 0 1-18-18v-96a18 18 0 0 1 18-18z" />
        <path d="M676 264h150M676 300h96" />
        <path d="M980 300h170a16 16 0 0 1 16 16v86a16 16 0 0 1-16 16H980a16 16 0 0 1-16-16v-86a16 16 0 0 1 16-16z" />
        <path d="M1000 344h110M1000 378h70" />
        <path d="M912 330h40M932 310l20 20-20 20" />
        {/* a scooter on the road */}
        <circle cx="470" cy="600" r="34" />
        <circle cx="620" cy="600" r="34" />
        <path d="M470 600h50l26-44h28M520 556l32 44h44M496 520h54v36" />
        <path d="M60 660h1100" />
        {/* a ledger with a tick */}
        <path d="M840 520h150a10 10 0 0 1 10 10v90a10 10 0 0 1-10 10H840a10 10 0 0 1-10-10v-90a10 10 0 0 1 10-10z" />
        <path d="M862 560h100M862 592h60" />
      </g>
      <path d="M1044 566l22 22 44-46" fill="none" stroke={BLUE} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
