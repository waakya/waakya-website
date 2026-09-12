/** Shared contract between the deck and every section it runs. */

export type SectionId =
  | "opening"
  | "problem"
  | "idea"
  | "home"
  | "conversation"
  | "execution"
  | "workspace"
  | "tasks"
  | "documents"
  | "approvals"
  | "connected"
  | "close";

export interface SectionProps {
  /** Advance to the next section. */
  onNext: () => void;
  /** Jump straight to a named section. */
  onGoTo: (id: SectionId) => void;
}
