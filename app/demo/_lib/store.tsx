"use client";

import * as React from "react";

/**
 * Demo state.
 *
 * Everything the presenter changes during the pitch lives here, in memory. One
 * reducer, one reset, no persistence: refreshing the page or pressing Reset
 * puts the story back to its opening position, and nothing leaves the browser.
 */

export type TaskStage =
  | "none"
  | "created"
  | "seen"
  | "accepted"
  | "in_progress"
  | "submitted"
  | "verified";

/** The order the lifecycle runs in; used for "has it reached x yet" checks. */
export const STAGE_ORDER: TaskStage[] = [
  "none",
  "created",
  "seen",
  "accepted",
  "in_progress",
  "submitted",
  "verified",
];

export function stageReached(current: TaskStage, target: TaskStage): boolean {
  return STAGE_ORDER.indexOf(current) >= STAGE_ORDER.indexOf(target);
}

export type DocStep = "pick" | "fields" | "preview" | "sent";

export interface DemoState {
  /** The task born out of the conversation in section 5. */
  stage: TaskStage;
  /** Which task row has its drawer open, if any. */
  openTaskId: string | null;
  /** Approvals the presenter has acted on. */
  approvals: Record<string, "pending" | "approved">;
  /** The shared B2B workspace approval. */
  boqApproved: boolean;
  /** Which tab the B2B workspace is showing. */
  workspaceTab: string;
  /** Document generation walk-through. */
  docStep: DocStep;
  docTemplate: string | null;
  /** Which approval is expanded. */
  openApprovalId: string | null;
}

const INITIAL: DemoState = {
  stage: "none",
  openTaskId: null,
  approvals: { ap1: "pending", ap2: "pending", ap3: "pending", ap4: "pending" },
  boqApproved: false,
  workspaceTab: "stream",
  docStep: "pick",
  docTemplate: null,
  openApprovalId: null,
};

type Action =
  | { type: "createTask" }
  | { type: "setStage"; stage: TaskStage }
  | { type: "openTask"; id: string | null }
  | { type: "approve"; id: string }
  | { type: "approveBoq" }
  | { type: "workspaceTab"; tab: string }
  | { type: "docStep"; step: DocStep }
  | { type: "docTemplate"; id: string }
  | { type: "openApproval"; id: string | null }
  | { type: "reset" };

function reducer(state: DemoState, action: Action): DemoState {
  switch (action.type) {
    case "createTask":
      return { ...state, stage: "created" };
    case "setStage":
      return { ...state, stage: action.stage };
    case "openTask":
      return { ...state, openTaskId: action.id };
    case "approve":
      return { ...state, approvals: { ...state.approvals, [action.id]: "approved" } };
    case "approveBoq":
      return { ...state, boqApproved: true };
    case "workspaceTab":
      return { ...state, workspaceTab: action.tab };
    case "docStep":
      return { ...state, docStep: action.step };
    case "docTemplate":
      return { ...state, docTemplate: action.id, docStep: "fields" };
    case "openApproval":
      return { ...state, openApprovalId: action.id };
    case "reset":
      return INITIAL;
    default:
      return state;
  }
}

interface DemoContextValue {
  state: DemoState;
  dispatch: React.Dispatch<Action>;
  reset: () => void;
}

const DemoContext = React.createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(reducer, INITIAL);
  const reset = React.useCallback(() => dispatch({ type: "reset" }), []);
  const value = React.useMemo(() => ({ state, dispatch, reset }), [state, reset]);
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoContextValue {
  const ctx = React.useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used inside DemoProvider");
  return ctx;
}

/** True when any overlay is open, so Escape knows what to close first. */
export function hasOverlay(state: DemoState): boolean {
  return state.openTaskId !== null || state.openApprovalId !== null;
}
