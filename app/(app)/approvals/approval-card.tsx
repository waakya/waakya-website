"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Hourglass, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StateChip } from "@/components/ui/state-chip";
import { type Locale } from "@/lib/i18n";
import { getPhase1 } from "@/lib/i18n/phase1";
import { decideApproval } from "@/lib/actions/approvals";
import type { ApprovalItem } from "@/lib/approvals/queries";
import { formatIndianDate } from "@/lib/tasks/format-date";
import { formatTime } from "@/lib/tasks/time";

export function ApprovalCard({
  locale,
  approval,
  canDecide,
}: {
  locale: Locale;
  approval: ApprovalItem;
  canDecide: boolean;
}) {
  const p = getPhase1(locale);
  const router = useRouter();
  const [note, setNote] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function decide(approve: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await decideApproval({ id: approval.id, approve, note: note || undefined });
      if (!result.ok) setError(result.message);
      else router.refresh();
    });
  }

  return (
    <Card
      data-testid="approval-card"
      // A decision already made looks settled: quieter ground, no controls.
      className={approval.status === "pending" ? "p-4" : "bg-surface-muted/60 p-4 shadow-none"}
    >
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className={approval.status === "pending" ? "text-body font-semibold text-fg" : "text-body font-semibold text-fg-muted"}>
            {approval.title}
          </p>
          <p className="num mt-0.5 text-label text-fg-subtle">
            {p.approvals.requestedBy(approval.requesterName)} · {formatIndianDate(approval.createdAt, locale)}{" "}
            {formatTime(approval.createdAt)}
            {approval.approverName ? ` · ${approval.approverName}` : ""}
          </p>
        </div>
        {approval.status === "approved" ? (
          <StateChip tone="hara" icon={<Check aria-hidden="true" />}>
            {p.approvals.approved}
          </StateChip>
        ) : approval.status === "rejected" ? (
          <StateChip tone="laal" icon={<X aria-hidden="true" />}>
            {p.approvals.rejected}
          </StateChip>
        ) : (
          // A decision waiting on someone, not a clock: Neel, not amber.
          <StateChip tone="neel" icon={<Hourglass aria-hidden="true" />}>
            {p.approvals.pending}
          </StateChip>
        )}
      </div>

      {approval.details ? (
        <p className="mt-2 text-body-sm leading-[20px] whitespace-pre-line text-ink-700">{approval.details}</p>
      ) : null}

      {approval.taskTitle || approval.projectName || approval.documentName ? (
        <p className="mt-2 flex flex-wrap gap-x-3 text-label">
          {approval.taskId && approval.taskTitle ? (
            <Link href={`/kaam/${approval.taskId}`} className="text-neel-700 hover:underline">
              {p.documents.linkedTask}: {approval.taskTitle}
            </Link>
          ) : null}
          {approval.projectId && approval.projectName ? (
            <Link href={`/projects/${approval.projectId}`} className="text-neel-700 hover:underline">
              {p.documents.linkedProject}: {approval.projectName}
            </Link>
          ) : null}
          {approval.documentId && approval.documentName ? (
            <Link href={`/documents/${approval.documentId}`} className="text-neel-700 hover:underline">
              {approval.documentName}
            </Link>
          ) : null}
        </p>
      ) : null}

      {approval.status !== "pending" && approval.decidedByName ? (
        <p className="num mt-2 text-label text-ink-500">
          {p.approvals.decidedBy(approval.decidedByName)}
          {approval.decidedAt ? ` · ${formatIndianDate(approval.decidedAt, locale)} ${formatTime(approval.decidedAt)}` : ""}
          {approval.decisionNote ? ` · ${approval.decisionNote}` : ""}
        </p>
      ) : null}

      {canDecide && approval.status === "pending" ? (
        <div className="mt-4 flex flex-col gap-2 border-t border-line pt-3">
          <label className="text-caption font-semibold text-fg-muted" htmlFor={`note-${approval.id}`}>
            {p.approvals.detailsLabel} <span className="font-normal text-fg-subtle">({p.common.optional})</span>
          </label>
          <input
            id={`note-${approval.id}`}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={500}
            aria-label={p.approvals.detailsLabel}
            className="h-10 rounded-button border border-line-strong bg-surface px-3 text-body-sm focus:border-neel-600 focus:outline-none"
          />
          <div className="flex gap-2">
            <Button size="sm" disabled={pending} onClick={() => decide(true)}>
              <Check aria-hidden="true" />
              {p.approvals.approve}
            </Button>
            <Button size="sm" variant="danger" disabled={pending} onClick={() => decide(false)}>
              <X aria-hidden="true" />
              {p.approvals.reject}
            </Button>
          </div>
          {error ? (
            <p role="alert" data-testid="approval-error" className="text-label text-laal-700">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
