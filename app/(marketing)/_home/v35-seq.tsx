"use client";

import * as React from "react";

/**
 * A story that plays while it is on screen, stops at the end, and hands over
 * to the reader the moment they touch it.
 *
 * It starts only once a good part of the scene is actually in view (not the
 * moment a corner crosses the fold), picking a step pauses it, the last step
 * holds so a finished state stays readable, and Play/Replay puts it back in
 * motion. Under reduced motion it jumps straight to the finished state.
 */
export function useSequence(count: number, ms = 1800, options: { threshold?: number; start?: number } = {}) {
  const { threshold = 0.45, start = 0 } = options;
  const [step, setStep] = React.useState(start);
  const [playing, setPlaying] = React.useState(true);
  const [live, setLive] = React.useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(
      ([e]) => {
        setLive(e.isIntersecting);
        // No motion asked for: the scene arrives finished.
        if (e.isIntersecting && reduced) setStep(count - 1);
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [count, threshold]);

  React.useEffect(() => {
    if (!live || !playing) return;
    if (step >= count - 1) return; // the end holds; it does not loop away
    const id = setTimeout(() => setStep((s) => s + 1), ms);
    return () => clearTimeout(id);
  }, [live, playing, step, count, ms]);

  const pick = React.useCallback((i: number) => {
    setPlaying(false); // the reader is driving now
    setStep(i);
  }, []);

  const replay = React.useCallback(() => {
    setStep(0);
    setPlaying(true);
  }, []);

  const done = step >= count - 1;
  return { ref, step, playing, setPlaying, pick, replay, done, live };
}

/** Play / pause / replay, as one control that is always at least 44 px. */
export function StoryControl({
  playing,
  done,
  onPlay,
  onPause,
  onReplay,
  label,
  light = false,
}: {
  playing: boolean;
  done: boolean;
  onPlay: () => void;
  onPause: () => void;
  onReplay: () => void;
  label: string;
  light?: boolean;
}) {
  if (done) {
    return (
      <button type="button" className="w4-control" data-light={light} onClick={onReplay}>
        <span aria-hidden="true">↺</span> Play {label} again
      </button>
    );
  }
  return (
    <button type="button" className="w4-control" data-light={light} onClick={playing ? onPause : onPlay}>
      <span aria-hidden="true">{playing ? "❙❙" : "▸"}</span> {playing ? "Pause" : "Play"} {label}
    </button>
  );
}

/** The step markers under a story: a real 44 px target around a small mark. */
export function StoryDots({
  count,
  step,
  onPick,
  labels,
  className,
}: {
  count: number;
  step: number;
  onPick: (i: number) => void;
  labels: string[];
  className?: string;
}) {
  return (
    <div className={["w35-dots w4-dots", className].filter(Boolean).join(" ")} role="group" aria-label="Steps">
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          className="w4-dot"
          data-on={i === step}
          data-seen={i < step}
          aria-label={labels[i] ?? `Step ${i + 1}`}
          aria-current={i === step ? "step" : undefined}
          onClick={() => onPick(i)}
        >
          <span aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
