"use client";

import {
  Activity,
  ArrowLeftRight,
  Check,
  FileText,
  MessageSquare,
  ShieldCheck,
  SquareCheckBig,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  AppWindow,
  Chip,
  DemoButton,
  Eyebrow,
  PersonAvatar,
  PresenterNote,
  Stage,
  Title,
} from "../chrome";
import {
  BUSINESS,
  CLIENT,
  PEOPLE,
  WORKSPACE_DOCS,
  WORKSPACE_PEOPLE,
  WORKSPACE_STREAM,
  WORKSPACE_TASKS,
  type StreamEntry,
} from "../../_lib/data";
import { useDemo } from "../../_lib/store";
import type { SectionProps } from "../../_lib/types";

const TABS = [
  { id: "stream", label: "Conversation", icon: MessageSquare },
  { id: "tasks", label: "Tasks", icon: SquareCheckBig },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "approvals", label: "Approvals", icon: ShieldCheck },
  { id: "people", label: "People", icon: Users },
  { id: "activity", label: "Activity", icon: Activity },
];

const KIND_LABEL: Record<StreamEntry["kind"], { label: string; tone: "neutral" | "accent" | "good" | "warn" }> = {
  message: { label: "Message", tone: "neutral" },
  task: { label: "Task created", tone: "accent" },
  document: { label: "Document submitted", tone: "accent" },
  approval_request: { label: "Approval requested", tone: "warn" },
  approved: { label: "Approved", tone: "good" },
};

/**
 * The signature screen: two businesses working in one place.
 *
 * The point to land is that the message, the task it created, the document it
 * produced and the approval that closed it are the same thread of work — not
 * four tools that happen to mention the same project.
 */
export function WorkspaceSection(props: SectionProps) {
  void props;
  const { state, dispatch } = useDemo();
  const tab = state.workspaceTab;
  const approved = state.boqApproved;

  return (
    <Stage wide className="min-h-full">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow className="wk-rise">Shared business workspace</Eyebrow>
          <Title size="md" className="wk-rise wk-d1 mt-3 max-w-[26ch]">
            Two businesses. One place the whole relationship lives.
          </Title>
        </div>
        <p className="wk-rise wk-d2 max-w-[34ch] text-[14px] leading-[1.55] text-[var(--d-faint)]">
          Move between the tabs. It is all the same project.
        </p>
      </div>

      <div className="wk-pop wk-d2 mt-6">
        <AppWindow
          title={
            <span className="flex items-center gap-2">
              {BUSINESS.name}
              <ArrowLeftRight className="size-3.5 text-[var(--s-faint)]" aria-hidden="true" />
              {CLIENT.name}
            </span>
          }
          subtitle="Greenwood Residence — Tower B · Shared workspace"
          right={
            <Chip tone={approved ? "good" : "warn"}>
              {approved ? "BOQ approved" : "1 approval pending"}
            </Chip>
          }
          bodyClassName="flex h-[min(66vh,600px)] flex-col overflow-hidden"
        >
          {/* who is in the room */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-[var(--s-line)] bg-[var(--s-sub)] px-4 py-2.5">
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#3541c4]" aria-hidden="true" />
              <span className="text-[12px] font-semibold">{BUSINESS.name}</span>
              <span className="text-[11.5px] text-[var(--s-faint)]">3 people</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#1f6f52]" aria-hidden="true" />
              <span className="text-[12px] font-semibold">{CLIENT.name}</span>
              <span className="text-[11.5px] text-[var(--s-faint)]">2 people</span>
            </span>
          </div>

          {/* tabs */}
          <div className="wk-scroll flex shrink-0 gap-1 overflow-x-auto border-b border-[var(--s-line)] px-3 py-2">
            {TABS.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => dispatch({ type: "workspaceTab", tab: item.id })}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-[9px] px-3 py-1.5 text-[12.5px] font-semibold transition-colors",
                    active
                      ? "bg-[#eef0fe] text-[#2c35a5]"
                      : "text-[var(--s-dim)] hover:bg-[var(--s-sub)]",
                  )}
                >
                  <Icon className="size-3.5" aria-hidden="true" />
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="wk-scroll flex-1 overflow-y-auto p-4">
            {tab === "stream" ? (
              <ol className="flex flex-col gap-2">
                {WORKSPACE_STREAM.map((entry) => {
                  const kind = KIND_LABEL[entry.kind];
                  return (
                    <li
                      key={entry.id}
                      className="rounded-[12px] border border-[var(--s-line)] p-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <PersonAvatar personId={entry.personId} size={26} />
                        <span className="text-[12.5px] font-semibold">
                          {PEOPLE[entry.personId]?.name}
                        </span>
                        <span className="text-[11.5px] text-[var(--s-faint)]">
                          {PEOPLE[entry.personId]?.org === "greenwood" ? CLIENT.name : BUSINESS.name}
                        </span>
                        <Chip tone={kind.tone} className="ml-auto">
                          {kind.label}
                        </Chip>
                        <span className="wk-tabnum shrink-0 text-[11px] text-[var(--s-faint)]">
                          {entry.at}
                        </span>
                      </div>
                      {entry.body ? (
                        <p className="mt-2.5 text-[13.5px] leading-[1.5]">{entry.body}</p>
                      ) : null}
                      {entry.kind !== "message" ? (
                        <div className="mt-2.5 flex items-center gap-2.5 rounded-[10px] bg-[var(--s-sub)] px-3 py-2.5">
                          {entry.kind === "document" ? (
                            <FileText className="size-4 shrink-0 text-[#3541c4]" aria-hidden="true" />
                          ) : entry.kind === "task" ? (
                            <SquareCheckBig className="size-4 shrink-0 text-[#3541c4]" aria-hidden="true" />
                          ) : (
                            <ShieldCheck className="size-4 shrink-0 text-[#8a5a12]" aria-hidden="true" />
                          )}
                          <span className="min-w-0">
                            <span className="block truncate text-[13px] font-semibold">
                              {entry.title}
                            </span>
                            {entry.meta ? (
                              <span className="block truncate text-[11.5px] text-[var(--s-faint)]">
                                {entry.meta}
                              </span>
                            ) : null}
                          </span>

                          {entry.kind === "approval_request" && !approved ? (
                            <DemoButton
                              size="sm"
                              onClick={() => dispatch({ type: "approveBoq" })}
                              className="ml-auto"
                            >
                              <Check aria-hidden="true" />
                              Approve
                            </DemoButton>
                          ) : null}
                        </div>
                      ) : null}
                    </li>
                  );
                })}

                {approved ? (
                  <li className="wk-pop rounded-[12px] border border-[#cfeddf] bg-[#f2faf6] p-3.5">
                    <div className="flex items-center gap-2.5">
                      <PersonAvatar personId="rohan" size={26} />
                      <span className="text-[12.5px] font-semibold">Rohan Kapoor</span>
                      <span className="text-[11.5px] text-[var(--s-faint)]">{CLIENT.name}</span>
                      <Chip tone="good" className="ml-auto" icon={<Check aria-hidden="true" />}>
                        Approved
                      </Chip>
                      <span className="wk-tabnum shrink-0 text-[11px] text-[var(--s-faint)]">
                        2:46 PM
                      </span>
                    </div>
                    <p className="mt-2.5 text-[13.5px] leading-[1.5] text-[#14623a]">
                      Revised BOQ approved. Proceed with the Tower B carpentry order.
                    </p>
                  </li>
                ) : null}
              </ol>
            ) : null}

            {tab === "tasks" ? (
              <ul className="flex flex-col gap-2">
                {WORKSPACE_TASKS.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-center gap-3 rounded-[11px] border border-[var(--s-line)] px-3.5 py-3"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-semibold">
                        {task.title}
                      </span>
                      <span className="wk-tabnum block truncate text-[11.5px] text-[var(--s-faint)]">
                        {task.person} · {task.due}
                      </span>
                    </span>
                    <Chip tone={task.state === "Submitted" ? "accent" : "neutral"}>
                      {task.state}
                    </Chip>
                  </li>
                ))}
              </ul>
            ) : null}

            {tab === "documents" ? (
              <ul className="grid gap-2 sm:grid-cols-2">
                {WORKSPACE_DOCS.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex items-center gap-3 rounded-[11px] border border-[var(--s-line)] px-3.5 py-3"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-[9px] bg-[#eef0fe]">
                      <FileText className="size-4 text-[#3541c4]" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold">{doc.name}</span>
                      <span className="wk-tabnum block truncate text-[11.5px] text-[var(--s-faint)]">
                        {doc.kind} · {doc.when} · {doc.size}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}

            {tab === "approvals" ? (
              <div className="flex flex-col gap-2.5">
                <div className="rounded-[12px] border border-[var(--s-line)] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[14px] font-semibold">Revised BOQ — Tower B</span>
                    <Chip tone={approved ? "good" : "warn"} className="ml-auto">
                      {approved ? "Approved" : "Waiting"}
                    </Chip>
                  </div>
                  <p className="mt-2 text-[13px] leading-[1.5] text-[var(--s-dim)]">
                    Greenwood_BOQ_v4.pdf, submitted by Neha Verma at 2:31 PM.
                  </p>
                  {approved ? (
                    <p className="wk-fade mt-3 flex items-center gap-2 rounded-[9px] bg-[#e6f6ee] px-3 py-2 text-[12.5px] font-semibold text-[#14623a]">
                      <Check className="size-3.5" aria-hidden="true" />
                      Approved by Rohan Kapoor, {CLIENT.name} · 2:46 PM
                    </p>
                  ) : (
                    <DemoButton
                      size="sm"
                      className="mt-3"
                      onClick={() => dispatch({ type: "approveBoq" })}
                    >
                      <Check aria-hidden="true" />
                      Approve
                    </DemoButton>
                  )}
                </div>
              </div>
            ) : null}

            {tab === "people" ? (
              <ul className="grid gap-2 sm:grid-cols-2">
                {WORKSPACE_PEOPLE.map((member) => (
                  <li
                    key={member.id}
                    className="flex items-center gap-3 rounded-[11px] border border-[var(--s-line)] px-3.5 py-3"
                  >
                    <PersonAvatar personId={member.id} size={32} />
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold">
                        {PEOPLE[member.id]?.name}
                      </span>
                      <span className="block truncate text-[11.5px] text-[var(--s-faint)]">
                        {PEOPLE[member.id]?.role} · {member.side}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}

            {tab === "activity" ? (
              <ol className="flex flex-col gap-2.5">
                {[
                  { id: "s1", text: "Rohan Kapoor asked for the revised BOQ", at: "9:58 AM" },
                  { id: "s2", text: "Aarav Mehta created a task for Neha Verma", at: "10:04 AM" },
                  { id: "s3", text: "Neha Verma submitted Greenwood_BOQ_v4.pdf", at: "2:31 PM" },
                  { id: "s4", text: "Approval requested from Greenwood Builders", at: "2:33 PM" },
                  ...(approved
                    ? [{ id: "s5", text: "Rohan Kapoor approved the revised BOQ", at: "2:46 PM" }]
                    : []),
                ].map((entry) => (
                  <li key={entry.id} className="flex items-center gap-3">
                    <span className="size-1.5 shrink-0 rounded-full bg-[#c9cdf6]" aria-hidden="true" />
                    <span className="text-[13px] text-[var(--s-dim)]">{entry.text}</span>
                    <span className="wk-tabnum ml-auto shrink-0 text-[11.5px] text-[var(--s-faint)]">
                      {entry.at}
                    </span>
                  </li>
                ))}
              </ol>
            ) : null}
          </div>
        </AppWindow>
      </div>

      <div className="mt-6">
        <PresenterNote>One place to see the entire business relationship.</PresenterNote>
      </div>
    </Stage>
  );
}
