"use client";

import { ArrowLeft, Building2, Check, FileText, Send, Sparkle } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  AppWindow,
  Chip,
  DemoButton,
  Eyebrow,
  PresenterNote,
  Stage,
  Title,
} from "../chrome";
import {
  BUSINESS,
  CLIENT,
  DOC_TEMPLATES,
  QUOTATION_LINES,
  QUOTATION_TOTAL,
  inr,
} from "../../_lib/data";
import { useDemo } from "../../_lib/store";
import type { SectionProps } from "../../_lib/types";

const FIELDS = [
  { id: "client", label: "Client", value: CLIENT.name },
  { id: "project", label: "Project", value: "Greenwood Residence — Tower B" },
  { id: "amount", label: "Amount", value: inr(QUOTATION_TOTAL) },
  { id: "gst", label: "GST", value: "18% · 27AAECU1234F1ZQ" },
  { id: "validity", label: "Valid until", value: "30 September 2026" },
  { id: "terms", label: "Payment terms", value: "50% advance, 40% on delivery, 10% on handover" },
];

/**
 * Documents where the work is. The presenter walks a template from choice to
 * a finished quotation sitting in the client's workspace.
 */
export function DocumentsSection(props: SectionProps) {
  void props;
  const { state, dispatch } = useDemo();
  const step = state.docStep;

  return (
    <Stage wide className="min-h-full">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow className="wk-rise">Business documents</Eyebrow>
          <Title size="md" className="wk-rise wk-d1 mt-3 max-w-[26ch]">
            Your documents should live where the work happens.
          </Title>
        </div>
        {step !== "pick" ? (
          <DemoButton
            variant="quiet"
            onClick={() => dispatch({ type: "docStep", step: "pick" })}
            className="wk-rise text-[var(--d-dim)] hover:bg-[var(--d-veil)]"
          >
            <ArrowLeft aria-hidden="true" />
            Back to templates
          </DemoButton>
        ) : (
          <p className="wk-rise wk-d2 max-w-[34ch] text-[14px] leading-[1.55] text-[var(--d-faint)]">
            Choose Quotation to walk the flow.
          </p>
        )}
      </div>

      <div className="wk-pop wk-d2 mt-6">
        <AppWindow
          title={BUSINESS.name}
          subtitle="Documents"
          right={
            step === "sent" ? (
              <Chip tone="good" icon={<Check aria-hidden="true" />}>
                Sent to client
              </Chip>
            ) : null
          }
          bodyClassName="h-[min(58vh,520px)] overflow-y-auto p-5"
        >
          {/* 1. pick a template */}
          {step === "pick" ? (
            <div>
              <p className="text-[13px] text-[var(--s-dim)]">
                Start from the paperwork your business already sends.
              </p>
              <ul className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {DOC_TEMPLATES.map((template, index) => (
                  <li key={template.id}>
                    <button
                      type="button"
                      onClick={() => dispatch({ type: "docTemplate", id: template.id })}
                      style={{ animationDelay: `${index * 0.03}s` }}
                      className={cn(
                        "wk-pop flex h-full w-full flex-col items-start gap-1 rounded-[11px] border px-3.5 py-3 text-left transition-all duration-200",
                        template.id === "quotation"
                          ? "border-[#c9cdf6] bg-[#fafbff] hover:border-[#3541c4]"
                          : "border-[var(--s-line)] hover:border-[#c9cdf6] hover:bg-[#fafbff]",
                      )}
                    >
                      <FileText
                        className="size-4 shrink-0 text-[#3541c4]"
                        aria-hidden="true"
                      />
                      <span className="text-[13px] font-semibold">{template.name}</span>
                      <span className="text-[11.5px] leading-[1.4] text-[var(--s-faint)]">
                        {template.blurb}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* 2. smart fields */}
          {step === "fields" ? (
            <div className="wk-fade grid gap-6 lg:grid-cols-[1fr_300px]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-[20px] font-bold">New quotation</h3>
                  <Chip tone="accent" icon={<Sparkle aria-hidden="true" />}>
                    Fields filled from the project
                  </Chip>
                </div>
                <p className="mt-1.5 text-[13px] text-[var(--s-dim)]">
                  Waakya already knows the client, the project and the rates. Check and
                  generate.
                </p>

                <dl className="mt-4 grid gap-2.5 sm:grid-cols-2">
                  {FIELDS.map((field, index) => (
                    <div
                      key={field.id}
                      style={{ animationDelay: `${0.05 + index * 0.05}s` }}
                      className="wk-rise rounded-[10px] border border-[var(--s-line)] px-3.5 py-2.5"
                    >
                      <dt className="text-[11px] tracking-[0.1em] uppercase text-[var(--s-faint)]">
                        {field.label}
                      </dt>
                      <dd className="wk-tabnum mt-1 text-[13.5px] font-semibold">
                        {field.value}
                      </dd>
                    </div>
                  ))}
                </dl>

                <DemoButton
                  className="mt-5"
                  onClick={() => dispatch({ type: "docStep", step: "preview" })}
                >
                  Preview quotation
                </DemoButton>
              </div>

              <div className="rounded-[12px] border border-[var(--s-line)] bg-[var(--s-sub)] p-4">
                <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--s-faint)]">
                  Line items
                </p>
                <ul className="mt-3 flex flex-col gap-2.5">
                  {QUOTATION_LINES.map((line) => (
                    <li key={line.id} className="flex items-baseline gap-2">
                      <span className="min-w-0 flex-1 text-[12.5px] leading-[1.4]">
                        {line.item}
                      </span>
                      <span className="wk-tabnum shrink-0 text-[12.5px] font-semibold">
                        {inr(line.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 flex items-baseline gap-2 border-t border-[var(--s-line)] pt-3">
                  <span className="flex-1 text-[12.5px] font-semibold">Total</span>
                  <span className="wk-tabnum text-[15px] font-bold">{inr(QUOTATION_TOTAL)}</span>
                </p>
              </div>
            </div>
          ) : null}

          {/* 3. preview, then send */}
          {step === "preview" || step === "sent" ? (
            <div className="wk-fade grid gap-6 lg:grid-cols-[1fr_260px]">
              <div className="rounded-[12px] border border-[var(--s-line)] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                <div className="flex items-start justify-between gap-4 border-b border-[var(--s-line)] pb-4">
                  <div>
                    <p className="font-display text-[17px] font-bold">{BUSINESS.name}</p>
                    <p className="text-[11.5px] text-[var(--s-faint)]">
                      {BUSINESS.kind} · {BUSINESS.city}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] tracking-[0.12em] uppercase text-[var(--s-faint)]">
                      Quotation
                    </p>
                    <p className="wk-tabnum text-[12.5px] font-semibold">QTN-2026-114</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-x-10 gap-y-2">
                  <div>
                    <p className="text-[11px] text-[var(--s-faint)]">Prepared for</p>
                    <p className="text-[13px] font-semibold">{CLIENT.name}</p>
                    <p className="text-[11.5px] text-[var(--s-dim)]">
                      Greenwood Residence — Tower B
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[var(--s-faint)]">Valid until</p>
                    <p className="wk-tabnum text-[13px] font-semibold">30 September 2026</p>
                  </div>
                </div>

                <table className="mt-5 w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[var(--s-line)]">
                      <th className="pb-2 text-[10.5px] font-bold tracking-[0.1em] uppercase text-[var(--s-faint)]">
                        Item
                      </th>
                      <th className="pb-2 text-right text-[10.5px] font-bold tracking-[0.1em] uppercase text-[var(--s-faint)]">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {QUOTATION_LINES.map((line) => (
                      <tr key={line.id} className="border-b border-[var(--s-line-soft)]">
                        <td className="py-2.5">
                          <span className="block text-[12.5px] font-medium">{line.item}</span>
                          <span className="block text-[11px] text-[var(--s-faint)]">
                            {line.qty}
                          </span>
                        </td>
                        <td className="wk-tabnum py-2.5 text-right text-[12.5px] font-semibold">
                          {inr(line.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-3 flex items-baseline justify-end gap-6">
                  <span className="text-[12.5px] text-[var(--s-dim)]">Total before GST</span>
                  <span className="wk-tabnum font-display text-[20px] font-bold">
                    {inr(QUOTATION_TOTAL)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="rounded-[12px] border border-[var(--s-line)] p-4">
                  <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--s-faint)]">
                    Send to
                  </p>
                  <span className="mt-2.5 flex items-center gap-2.5">
                    <span className="grid size-8 shrink-0 place-items-center rounded-[9px] bg-[#e8f3ee]">
                      <Building2 className="size-4 text-[#1f6f52]" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold">
                        {CLIENT.name}
                      </span>
                      <span className="block truncate text-[11.5px] text-[var(--s-faint)]">
                        Project · Tower B
                      </span>
                    </span>
                  </span>
                </div>

                {step === "sent" ? (
                  <div className="wk-pop rounded-[12px] border border-[#cfeddf] bg-[#f2faf6] p-4">
                    <p className="flex items-center gap-2 text-[13px] font-semibold text-[#14623a]">
                      <Check className="size-4" aria-hidden="true" />
                      Saved and sent for approval
                    </p>
                    <p className="wk-tabnum mt-1.5 text-[12px] text-[#14623a]">
                      Saved 5:04 PM · waiting for approval
                    </p>
                    <p className="mt-2 text-[12px] leading-[1.5] text-[var(--s-dim)]">
                      It is now in Documents, attached to the project, with its own
                      approval.
                    </p>
                  </div>
                ) : (
                  <DemoButton onClick={() => dispatch({ type: "docStep", step: "sent" })}>
                    <Send aria-hidden="true" />
                    Generate and send
                  </DemoButton>
                )}
              </div>
            </div>
          ) : null}
        </AppWindow>
      </div>

      <div className="mt-6">
        <PresenterNote>
          The quotation is not a file someone emailed. It belongs to the project.
        </PresenterNote>
      </div>
    </Stage>
  );
}
