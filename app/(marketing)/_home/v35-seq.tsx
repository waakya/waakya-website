"use client";

import * as React from "react";

/**
 * A story that plays while it is on screen, stops at the end, and hands over
 * to the reader the moment they touch it.
 *
 * V3.4's stories looped forever and auto-advanced away from whatever the
 * reader had just selected. Here: picking a step pauses; the last step holds
 * so a finished state stays readable; Play/Replay puts it back in motion.
 */
export function useSequence(count: number, ms = 1800) {
  const [step, setStep] = React.useState(0);
  const [playing, setPlaying] = React.useState(true);
  const [live, setLive] = React.useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setLive(e.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

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
  return { ref, step, playing, setPlaying, pick, replay, done };
}

/** Play / pause / replay, as one control that is always at least 44 px. */
export function StoryControl({
  playing,
  done,
  onPlay,
  onPause,
  onReplay,
  label,
}: {
  playing: boolean;
  done: boolean;
  onPlay: () => void;
  onPause: () => void;
  onReplay: () => void;
  label: string;
}) {
  if (done) {
    return (
      <button type="button" className="w35-control" onClick={onReplay}>
        <span aria-hidden="true">↺</span> Play {label} again
      </button>
    );
  }
  return (
    <button type="button" className="w35-control" onClick={playing ? onPause : onPlay}>
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
}: {
  count: number;
  step: number;
  onPick: (i: number) => void;
  labels: string[];
}) {
  return (
    <div className="w35-dots" role="group" aria-label="Steps">
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          className="w35-dot"
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
