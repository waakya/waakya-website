"use client";

import * as React from "react";

import { Ticks } from "@/components/waakya/ticks";
import { DemoPhoto } from "./demo-photo";

/**
 * The close: the system resolving (Visual V2). Proof arrives, someone
 * verifies it, and it becomes part of the record — the same Line the page
 * has followed, ending in the Verified tick drawing itself. The whole figure
 * is present from the first frame; arriving in view only draws the Line and
 * the tick.
 */
export function VerifiedMark() {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [on, setOn] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setOn(true), { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className="w4-resolve" data-on={on}>
      <ol aria-label="Proof, verified, kept">
        <li>
          <span className="w4-resolve-label">Proof · Rahul · Sat 4:12</span>
          <span className="w4-resolve-photos" aria-hidden="true">
            <DemoPhoto scene="reception" className="w4-resolve-photo" label={false} />
            <DemoPhoto scene="openfloor" className="w4-resolve-photo" label={false} />
          </span>
        </li>
        <li>
          <span className="w4-resolve-label">Verified · Priya · Sat 6:05</span>
          <span className="w4-resolve-tick" aria-hidden="true">
            {on ? <Ticks state="verified" size={36} animate /> : <Ticks state="verified" size={36} />}
          </span>
        </li>
        <li>
          <span className="w4-resolve-label">Kept · Sterling Group · Kharadi office</span>
          <span className="w4-resolve-record">Handover complete · on the project, on the customer, for good</span>
        </li>
      </ol>
    </div>
  );
}
