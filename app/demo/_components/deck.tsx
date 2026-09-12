"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  RotateCcw,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useDemo } from "../_lib/store";
import type { SectionId, SectionProps } from "../_lib/types";

import { OpeningSection } from "./sections/opening";
import { ProblemSection } from "./sections/problem";
import { IdeaSection } from "./sections/idea";
import { HomeSection } from "./sections/home";
import { ConversationSection } from "./sections/conversation";
import { ExecutionSection } from "./sections/execution";
import { WorkspaceSection } from "./sections/workspace";
import { TasksSection } from "./sections/tasks";
import { DocumentsSection } from "./sections/documents";
import { ApprovalsSection } from "./sections/approvals";
import { ConnectedSection } from "./sections/connected";
import { CloseSection } from "./sections/close";

interface Section {
  id: SectionId;
  label: string;
  Component: (props: SectionProps) => React.ReactNode;
}

const SECTIONS: Section[] = [
  { id: "opening", label: "Waakya", Component: OpeningSection },
  { id: "problem", label: "The problem", Component: ProblemSection },
  { id: "idea", label: "The idea", Component: IdeaSection },
  { id: "home", label: "Home", Component: HomeSection },
  { id: "conversation", label: "Message to task", Component: ConversationSection },
  { id: "execution", label: "Proof", Component: ExecutionSection },
  { id: "workspace", label: "Shared workspace", Component: WorkspaceSection },
  { id: "tasks", label: "Accountability", Component: TasksSection },
  { id: "documents", label: "Documents", Component: DocumentsSection },
  { id: "approvals", label: "Approvals", Component: ApprovalsSection },
  { id: "connected", label: "Connected", Component: ConnectedSection },
  { id: "close", label: "Close", Component: CloseSection },
];

/**
 * The presentation runner.
 *
 * Sections are mounted one at a time and keyed by id, so every entrance
 * animation replays when the presenter arrives — including on the way back.
 * Arrow keys move; Escape leaves fullscreen, unless a drawer is open, in which
 * case the drawer takes the keypress.
 */
export function Deck() {
  const { reset } = useDemo();
  const [index, setIndex] = React.useState(0);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const current = SECTIONS[index];

  const goTo = React.useCallback((id: SectionId) => {
    const next = SECTIONS.findIndex((section) => section.id === id);
    if (next >= 0) setIndex(next);
  }, []);

  const next = React.useCallback(() => {
    setIndex((value) => Math.min(value + 1, SECTIONS.length - 1));
  }, []);

  const previous = React.useCallback(() => {
    setIndex((value) => Math.max(value - 1, 0));
  }, []);

  /* ------------------------------------------------------------ keyboard -- */
  React.useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;

      if (event.key === "ArrowRight" || event.key === "PageDown") {
        event.preventDefault();
        next();
      } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        previous();
      } else if (event.key === "Home") {
        event.preventDefault();
        setIndex(0);
      } else if (event.key === "End") {
        event.preventDefault();
        setIndex(SECTIONS.length - 1);
      } else if (event.key === "Escape") {
        // A drawer, if one is open, handles its own Escape.
        if (document.querySelector('[role="dialog"]')) return;
        if (document.fullscreenElement) void document.exitFullscreen();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, previous]);

  /* ---------------------------------------------------------- fullscreen -- */
  React.useEffect(() => {
    function onChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = React.useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void document.documentElement.requestFullscreen?.();
    }
  }, []);

  const progress = ((index + 1) / SECTIONS.length) * 100;

  return (
    <div className="wk-demo relative flex h-dvh w-full flex-col overflow-hidden">
      {/* ground */}
      <div aria-hidden="true" className="wk-aurora pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="wk-grid-lines pointer-events-none absolute inset-0" />

      {/* progress */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 z-30 h-[2px] bg-[rgba(255,255,255,0.06)]"
      >
        <div
          className="h-full bg-[var(--d-accent)] transition-[width] duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* demo marker */}
      <div className="absolute top-4 right-5 z-30 flex items-center gap-2">
        <span className="rounded-full border border-[var(--d-line)] bg-[var(--d-veil)] px-2.5 py-1 text-[10.5px] font-bold tracking-[0.14em] uppercase text-[var(--d-dim)]">
          Demo
        </span>
      </div>

      {/* the section */}
      <main className="wk-scroll relative z-10 flex-1 overflow-y-auto">
        <div key={current.id} className="flex min-h-full items-center pb-24">
          <current.Component onNext={next} onGoTo={goTo} />
        </div>
      </main>

      {/* controls */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center pb-5">
        <div className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-[var(--d-line)] bg-[rgba(9,10,28,0.82)] px-2 py-1.5 backdrop-blur-md">
          <button
            type="button"
            onClick={previous}
            disabled={index === 0}
            aria-label="Previous section"
            className="grid size-8 place-items-center rounded-full text-[var(--d-dim)] transition-colors hover:bg-[var(--d-veil)] hover:text-[var(--d-text)] disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>

          {/* section dots double as the jump menu */}
          <div className="flex items-center gap-1 px-1.5">
            {SECTIONS.map((section, sectionIndex) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setIndex(sectionIndex)}
                title={section.label}
                aria-label={`Go to ${section.label}`}
                aria-current={sectionIndex === index ? "true" : undefined}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  sectionIndex === index
                    ? "w-6 bg-[var(--d-accent-bright)]"
                    : "w-1.5 bg-[rgba(255,255,255,0.22)] hover:bg-[rgba(255,255,255,0.45)]",
                )}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={next}
            disabled={index === SECTIONS.length - 1}
            aria-label="Next section"
            className="grid size-8 place-items-center rounded-full text-[var(--d-dim)] transition-colors hover:bg-[var(--d-veil)] hover:text-[var(--d-text)] disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>

          <span
            aria-hidden="true"
            className="mx-1 h-5 w-px bg-[var(--d-line)]"
          />

          <span className="wk-tabnum hidden px-1 text-[11.5px] font-medium text-[var(--d-faint)] sm:block">
            {index + 1} / {SECTIONS.length}
            <span className="ml-2 text-[var(--d-dim)]">{current.label}</span>
          </span>

          <button
            type="button"
            onClick={reset}
            aria-label="Reset demo"
            title="Reset demo"
            className="grid size-8 place-items-center rounded-full text-[var(--d-dim)] transition-colors hover:bg-[var(--d-veil)] hover:text-[var(--d-text)]"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? "Leave fullscreen" : "Enter fullscreen"}
            title={isFullscreen ? "Leave fullscreen" : "Enter fullscreen"}
            className="grid size-8 place-items-center rounded-full text-[var(--d-dim)] transition-colors hover:bg-[var(--d-veil)] hover:text-[var(--d-text)]"
          >
            {isFullscreen ? (
              <Minimize2 className="size-3.5" aria-hidden="true" />
            ) : (
              <Maximize2 className="size-3.5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
