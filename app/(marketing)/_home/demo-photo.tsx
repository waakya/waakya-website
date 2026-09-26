import { cn } from "@/lib/utils";

/**
 * Demo imagery for the Design Lab (V3.3).
 *
 * Grey gradients made every screen look unfinished, and we have no licensed
 * photography, so these are drawn scenes with photographic framing: warm
 * light, depth, a horizon, foreground objects. They are clearly demo
 * material — never presented as a real Waakya customer or a real project.
 *
 * REPLACE LATER with real photography:
 *   · reception / office interior after handover (landscape, 16:10)
 *   · open floor with lighting in progress (landscape)
 *   · site measurement in progress, person in frame (landscape)
 *   · laminate and material close-ups (square, 3 shades)
 *   · a finished cabin or pantry (landscape)
 */
export type DemoScene = "reception" | "openfloor" | "site" | "material" | "tower";

function Reception() {
  return (
    <>
      <defs>
        <linearGradient id="dp-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6efe2" />
          <stop offset="1" stopColor="#e6dcc9" />
        </linearGradient>
        <linearGradient id="dp-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#cbb79b" />
          <stop offset="1" stopColor="#a98f70" />
        </linearGradient>
        <linearGradient id="dp-glow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff6e2" stopOpacity="0.95" />
          <stop offset="1" stopColor="#fff6e2" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="400" height="250" fill="url(#dp-wall)" />
      <rect y="168" width="400" height="82" fill="url(#dp-floor)" />
      {/* window light from the left */}
      <path d="M0 0h120v168H0z" fill="#fdf6e6" />
      <path d="M18 18h84v132H18z" fill="#e8eef6" />
      <path d="M60 18v132M18 84h84" stroke="#cdbfa6" strokeWidth="3" />
      <path d="M0 0h400v250H0z" fill="url(#dp-glow)" />
      {/* reception desk */}
      <path d="M150 128h150v40h-150z" fill="#6c4a2f" />
      <path d="M140 118h170v14h-170z" fill="#8a5f3c" />
      <path d="M150 168h150v10h-150z" fill="#4e341f" opacity="0.5" />
      {/* brand wall + ceiling lights */}
      <rect x="196" y="44" width="120" height="52" rx="4" fill="#efe6d5" />
      <rect x="212" y="62" width="60" height="8" rx="4" fill="#1b2060" opacity="0.75" />
      <rect x="212" y="76" width="34" height="6" rx="3" fill="#3541c4" opacity="0.5" />
      {[140, 210, 280, 350].map((x) => (
        <g key={x}>
          <path d={`M${x} 0v18`} stroke="#c9bda6" strokeWidth="2" />
          <ellipse cx={x} cy="22" rx="16" ry="5" fill="#fff3d6" />
        </g>
      ))}
      {/* plant */}
      <path d="M338 168v-26" stroke="#5c6b4a" strokeWidth="4" />
      <path d="M338 146c-14-6-18-20-8-28 10 4 14 16 8 28zM338 150c12-8 14-22 4-28-9 6-11 18-4 28z" fill="#6f8158" />
      <path d="M326 168h24l-3 14h-18z" fill="#b5a68e" />
      {/* chair silhouettes */}
      <circle cx="120" cy="150" r="14" fill="#3c3a36" opacity="0.18" />
      <rect x="96" y="150" width="48" height="8" rx="4" fill="#3c3a36" opacity="0.18" />
    </>
  );
}

function OpenFloor() {
  return (
    <>
      <rect width="400" height="250" fill="#f1ece1" />
      <rect y="176" width="400" height="74" fill="#c9b79c" />
      {/* ceiling grid, lighting being fitted */}
      {[0, 1, 2, 3].map((r) => (
        <path key={r} d={`M0 ${20 + r * 22}h400`} stroke="#e2d9c7" strokeWidth="2" />
      ))}
      {[70, 170, 270, 350].map((x, i) => (
        <g key={x}>
          <rect x={x - 26} y={24 + (i % 2) * 22} width="52" height="8" rx="3" fill={i === 1 ? "#fff0cc" : "#e8e0cf"} stroke="#cfc3ab" />
          {i === 1 ? <ellipse cx={x} cy="60" rx="46" ry="18" fill="#fff3d6" opacity="0.65" /> : null}
        </g>
      ))}
      {/* workstations */}
      {[40, 150, 260].map((x) => (
        <g key={x}>
          <rect x={x} y="140" width="96" height="30" rx="3" fill="#8a5f3c" />
          <rect x={x + 8} y="120" width="30" height="20" rx="2" fill="#2f3542" />
          <rect x={x + 54} y="120" width="30" height="20" rx="2" fill="#2f3542" />
        </g>
      ))}
      {/* ladder, work in progress */}
      <path d="M330 176V96M352 176V96M330 112h22M330 132h22M330 152h22" stroke="#9a8b70" strokeWidth="4" strokeLinecap="round" />
    </>
  );
}

function Site() {
  return (
    <>
      <rect width="400" height="250" fill="#eceadf" />
      <rect y="182" width="400" height="68" fill="#bfae94" />
      {/* bare shell, scaffolding */}
      <rect x="40" y="46" width="300" height="136" fill="#ded6c6" />
      {[90, 160, 230, 300].map((x) => (
        <rect key={x} x={x} y="70" width="46" height="46" fill="#cfc6b2" />
      ))}
      <path d="M40 46h300M40 116h300" stroke="#c2b7a0" strokeWidth="3" />
      <path d="M356 182V40l-40 18" stroke="#8e8370" strokeWidth="5" strokeLinecap="round" fill="none" />
      {/* A measuring tape and a helmet on the floor. Site yellow, deliberately
          NOT the Haldi token: Haldi means "done" and belongs to the tick and
          the mark alone (D-01), even in a drawn photograph. */}
      <circle cx="120" cy="206" r="14" fill="#eba52b" />
      <circle cx="120" cy="206" r="5" fill="#fff" />
      <path d="M134 206h58" stroke="#eba52b" strokeWidth="6" strokeLinecap="round" />
      <path d="M232 214a20 20 0 0 1 40 0z" fill="#eba52b" />
      <path d="M226 214h52" stroke="#d99a14" strokeWidth="4" strokeLinecap="round" />
    </>
  );
}

function Material() {
  const tone: "oak" | "walnut" | "teak" = "walnut";
  const map = {
    oak: ["#e8d5b5", "#cdb189", "#b99a6f"],
    walnut: ["#8a5a3b", "#5d3a24", "#432a19"],
    teak: ["#c58b52", "#8a5a2c", "#6d451f"],
  } as const;
  const [a, b, c] = map[tone];
  return (
    <>
      <rect width="400" height="250" fill={b} />
      {Array.from({ length: 14 }, (_, i) => (
        <path key={i} d={`M0 ${i * 18}h400`} stroke={i % 3 === 0 ? c : a} strokeWidth={i % 3 === 0 ? 3 : 1.2} opacity="0.5" />
      ))}
      <ellipse cx="120" cy="90" rx="70" ry="26" fill={c} opacity="0.35" />
      <ellipse cx="300" cy="180" rx="60" ry="22" fill={a} opacity="0.25" />
    </>
  );
}

function Tower() {
  return (
    <>
      <rect width="400" height="250" fill="#e9eef6" />
      <rect y="196" width="400" height="54" fill="#cfd3c4" />
      {[{ x: 40, h: 150 }, { x: 150, h: 186 }, { x: 264, h: 132 }].map((t) => (
        <g key={t.x}>
          <rect x={t.x} y={196 - t.h} width="90" height={t.h} fill="#dfe3ea" stroke="#c2c8d3" />
          {Array.from({ length: Math.floor(t.h / 26) }, (_, r) => (
            <g key={r}>
              <rect x={t.x + 12} y={196 - t.h + 14 + r * 26} width="28" height="14" fill="#b9c6da" />
              <rect x={t.x + 50} y={196 - t.h + 14 + r * 26} width="28" height="14" fill="#cdd8e6" />
            </g>
          ))}
        </g>
      ))}
      <ellipse cx="330" cy="70" rx="46" ry="16" fill="#fff" opacity="0.7" />
      <ellipse cx="96" cy="48" rx="34" ry="12" fill="#fff" opacity="0.6" />
    </>
  );
}

const SCENES: Record<DemoScene, () => React.ReactNode> = {
  reception: Reception,
  openfloor: OpenFloor,
  site: Site,
  material: Material,
  tower: Tower,
};

export function DemoPhoto({
  scene,
  className,
  caption,
  label = true,
}: {
  scene: DemoScene;
  className?: string;
  caption?: string;
  /** The small "demo" mark; on by default so nothing reads as a real photo. */
  label?: boolean;
}) {
  const Scene = SCENES[scene];
  return (
    <figure className={cn("w32-photoframe", className)}>
      <svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" className="h-full w-full" role="img" aria-label={caption ?? "Demo project image"}>
        <Scene />
      </svg>
      {label ? <span className="w32-photoframe-tag">demo</span> : null}
      {caption ? <figcaption className="w32-photoframe-cap">{caption}</figcaption> : null}
    </figure>
  );
}
