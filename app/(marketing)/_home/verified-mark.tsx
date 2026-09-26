"use client";

import * as React from "react";

import { Ticks } from "@/components/waakya/ticks";

/** The ticks glyph, drawing itself to Verified the moment the close is in view. */
export function VerifiedMark() {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [on, setOn] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setOn(true), { threshold: 0.6 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className="w4-close-mark" aria-hidden="true">
      {on ? <Ticks state="verified" size={44} animate /> : <Ticks state="verified" size={44} />}
    </div>
  );
}
