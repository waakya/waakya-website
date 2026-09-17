"use client";

import { Check, CheckCheck, Clock, Flag, ListPlus, Paperclip, Send } from "lucide-react";

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
import { BUSINESS, CONVERSATIONS, PEOPLE, TASK_FROM_CHAT, THREAD } from "../../_lib/data";
import { stageReached, useDemo } from "../../_lib/store";
import type { SectionProps } from "../../_lib/types";

/**
 * The turning point of the pitch: a sentence in a conversation becomes a task
 * that somebody owns, with a deadline, without leaving the conversation.
 */
export function ConversationSection(props: SectionProps) {
  void props;
  const { state, dispatch } = useDemo();
  const created = stageReached(state.stage, "created");

  return (
    <Stage wide className="min-h-full">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow className="wk-rise">Communication becomes work</Eyebrow>
          <Title size="md" className="wk-rise wk-d1 mt-3 max-w-[22ch]">
            The same message. One tap later, it has an owner.
          </Title>
        </div>
        {!created ? (
          <p className="wk-rise wk-d2 text-[14px] text-[var(--d-faint)]">
            Press <span className="font-semibold text-[var(--d-text)]">Create task</span> on
            Aarav&rsquo;s message.
          </p>
        ) : null}
      </div>

      <div className="wk-pop wk-d2 mt-6">
        <AppWindow
          title={BUSINESS.name}
          subtitle="Conversations"
          bodyClassName="flex h-[min(60vh,540px)] overflow-hidden"
        >
          {/* conversation list */}
          <div className="hidden w-[220px] shrink-0 flex-col border-r border-[var(--s-line)] bg-[var(--s-sub)] p-2.5 md:flex">
            {CONVERSATIONS.map((conversation, index) => (
              <span
                key={conversation.id}
                className={cn(
                  "flex flex-col rounded-[10px] px-3 py-2.5",
                  index === 0 ? "bg-[var(--s-bg)] shadow-[0_1px_2px_rgba(0,0,0,0.05)]" : "",
                )}
              >
                <span className="flex items-center gap-2">
                  <span className="truncate text-[13px] font-semibold">{conversation.name}</span>
                  <span className="wk-tabnum ml-auto shrink-0 text-[10.5px] text-[var(--s-faint)]">
                    {conversation.when}
                  </span>
                </span>
                <span className="truncate text-[11.5px] text-[var(--s-faint)]">
                  {conversation.preview}
                </span>
              </span>
            ))}
          </div>

          {/* thread */}
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center gap-2.5 border-b border-[var(--s-line)] px-4 py-2.5">
              <PersonAvatar personId="rahul" size={30} />
              <div className="min-w-0">
                <p className="truncate text-[13.5px] font-semibold">Rahul Sharma</p>
                <p className="truncate text-[11.5px] text-[var(--s-faint)]">
                  Project Manager · Greenwood Residence — Tower B
                </p>
              </div>
            </div>

            <div className="wk-scroll flex-1 overflow-y-auto px-4 py-4">
              <ul className="flex flex-col gap-3">
                {THREAD.map((message) => {
                  const mine = message.personId === "aarav";
                  const isTrigger = message.id === "m3";
                  return (
                    <li
                      key={message.id}
                      className={cn("flex items-end gap-2.5", mine && "flex-row-reverse")}
                    >
                      <PersonAvatar personId={message.personId} size={28} />
                      <div className={cn("max-w-[76%]", mine && "flex flex-col items-end")}>
                        <div
                          className={cn(
                            "rounded-[13px] px-3.5 py-2.5 text-[13.5px] leading-[1.5]",
                            mine
                              ? "rounded-br-[4px] bg-[#3541c4] text-white"
                              : "rounded-bl-[4px] bg-[var(--s-sub)] text-[var(--s-text)]",
                            isTrigger && !created && "ring-2 ring-[#a9b0f0] ring-offset-2",
                          )}
                        >
                          {message.text}
                        </div>
                        <div className="mt-1 flex items-center gap-2 px-1">
                          <span className="wk-tabnum text-[11px] text-[var(--s-faint)]">
                            {message.at}
                          </span>
                          {mine ? (
                            <CheckCheck
                              className="size-3.5 text-[#3541c4]"
                              aria-hidden="true"
                            />
                          ) : null}
                          {isTrigger ? (
                            <DemoButton
                              size="sm"
                              variant={created ? "quiet" : "primary"}
                              onClick={() => dispatch({ type: "createTask" })}
                              disabled={created}
                              className="ml-1"
                            >
                              <ListPlus aria-hidden="true" />
                              {created ? "Task created" : "Create task"}
                            </DemoButton>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  );
                })}

                {/* the task, living inside the conversation */}
                {created ? (
                  <li className="wk-pop pt-1">
                    <div className="rounded-[13px] border border-[#c9cdf6] bg-[#fafbff] p-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10.5px] font-bold tracking-[0.14em] uppercase text-[#3541c4]">
                          Task created from this conversation
                        </span>
                        <span className="wk-tabnum ml-auto text-[11px] text-[var(--s-faint)]">
                          11:08 AM
                        </span>
                      </div>

                      <p className="mt-2.5 text-[15px] font-semibold">
                        {TASK_FROM_CHAT.title}
                      </p>

                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        <Chip tone="neutral">
                          <PersonAvatar personId={TASK_FROM_CHAT.assignee} size={14} />
                          {PEOPLE[TASK_FROM_CHAT.assignee]?.name}
                        </Chip>
                        <Chip tone="neutral" icon={<Clock aria-hidden="true" />}>
                          {TASK_FROM_CHAT.due}
                        </Chip>
                        <Chip tone="bad" icon={<Flag aria-hidden="true" />}>
                          {TASK_FROM_CHAT.priority} priority
                        </Chip>
                      </div>

                      <div className="mt-3 flex items-center gap-2 border-t border-[#e3e6fb] pt-3">
                        <Chip tone="good" icon={<Check aria-hidden="true" />}>
                          Accepted
                        </Chip>
                        <span className="wk-tabnum text-[11.5px] text-[var(--s-faint)]">
                          Rahul accepted at 11:10 AM
                        </span>
                      </div>
                    </div>
                  </li>
                ) : null}
              </ul>
            </div>

            <div className="flex items-center gap-2 border-t border-[var(--s-line)] px-4 py-2.5">
              <Paperclip className="size-4 shrink-0 text-[var(--s-faint)]" aria-hidden="true" />
              <span className="flex-1 truncate text-[13px] text-[var(--s-faint)]">
                Write a message
              </span>
              <span className="grid size-8 shrink-0 place-items-center rounded-[9px] bg-[#3541c4] text-white">
                <Send className="size-3.5" aria-hidden="true" />
              </span>
            </div>
          </div>
        </AppWindow>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <PresenterNote>
          {created
            ? "The task lives in the conversation. Nobody has to remember what was agreed."
            : "Nothing was retyped. The message is the task."}
        </PresenterNote>
      </div>
    </Stage>
  );
}
