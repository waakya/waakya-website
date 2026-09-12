"use client";

import {
  Activity,
  Building2,
  FileText,
  FolderKanban,
  Handshake,
  MessageSquare,
  ShieldCheck,
  SquareCheckBig,
  Users,
} from "lucide-react";

import { Eyebrow, Stage, Title } from "../chrome";
import type { SectionProps } from "../../_lib/types";

const LEFT = [
  { id: "team", icon: Users, label: "Team" },
  { id: "clients", icon: Building2, label: "Clients" },
  { id: "communication", icon: MessageSquare, label: "Communication" },
  { id: "tasks", icon: SquareCheckBig, label: "Tasks" },
];

const RIGHT = [
  { id: "projects", icon: FolderKanban, label: "Projects" },
  { id: "documents", icon: FileText, label: "Documents" },
  { id: "approvals", icon: ShieldCheck, label: "Approvals" },
  { id: "proof", icon: Handshake, label: "Proof" },
  { id: "activity", icon: Activity, label: "Activity" },
];

function Node({
  icon: Icon,
  label,
  delay,
}: {
  icon: typeof Users;
  label: string;
  delay: number;
}) {
  return (
    <div
      style={{ animationDelay: `${delay}s` }}
      className="wk-rise flex items-center gap-2.5 rounded-full border border-[var(--d-line)] bg-[var(--d-veil)] px-4 py-2.5"
    >
      <Icon className="size-4 shrink-0 text-[var(--d-accent-bright)]" aria-hidden="true" />
      <span className="text-[13.5px] font-semibold whitespace-nowrap text-[var(--d-text)]">
        {label}
      </span>
    </div>
  );
}

/** The culmination: nine scattered things, one workspace. */
export function ConnectedSection(props: SectionProps) {
  void props;
  return (
    <Stage wide className="min-h-full">
      <Eyebrow className="wk-rise">Everything connected</Eyebrow>
      <Title className="wk-rise wk-d1 mt-4 max-w-[22ch]">
        Nine things you already do. One place they finally meet.
      </Title>

      <div className="mt-12 grid items-center gap-8 lg:grid-cols-[1fr_auto_1fr] lg:gap-10">
        <div className="flex flex-col gap-3 lg:items-end">
          {LEFT.map((node, index) => (
            <Node key={node.id} icon={node.icon} label={node.label} delay={0.1 + index * 0.08} />
          ))}
        </div>

        {/* the centre */}
        <div className="relative flex justify-center">
          <span
            aria-hidden="true"
            className="wk-fade absolute inset-0 -m-10 rounded-full bg-[radial-gradient(circle,rgba(122,132,230,0.22),transparent_68%)]"
          />
          <div
            style={{ animationDelay: "0.5s" }}
            className="wk-pop relative flex w-[260px] flex-col items-center rounded-[20px] border border-[var(--d-line)] bg-[var(--d-ground-2)] px-6 py-8 text-center shadow-[var(--d-shadow)]"
          >
            <p className="font-display text-[11px] font-extrabold tracking-[0.4em] text-[var(--d-accent)]">
              WAAKYA
            </p>
            <p className="mt-3 font-display text-[26px] leading-[1.15] font-extrabold text-[var(--d-text)]">
              Business
              <br />
              Workspace
            </p>
            <span
              aria-hidden="true"
              className="mt-5 h-px w-14 bg-[var(--d-accent)] opacity-60"
            />
            <p className="mt-5 text-[13px] leading-[1.5] text-[var(--d-dim)]">
              One record of what was said, agreed, done and approved.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {RIGHT.map((node, index) => (
            <Node key={node.id} icon={node.icon} label={node.label} delay={0.15 + index * 0.08} />
          ))}
        </div>
      </div>

      <p
        style={{ animationDelay: "0.95s" }}
        className="wk-rise mt-14 text-center font-display text-[clamp(26px,3.4vw,42px)] leading-[1.15] font-extrabold text-[var(--d-text)]"
      >
        All your business work.
        <br />
        <span className="text-[var(--d-accent-bright)]">One workspace.</span>
      </p>
    </Stage>
  );
}
