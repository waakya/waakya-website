"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type Locale } from "@/lib/i18n";
import { getPhase1 } from "@/lib/i18n/phase1";
import { requestApproval } from "@/lib/actions/approvals";

const SELECT = "mt-1 h-11 w-full rounded-button border border-paper-200 bg-paper-0 px-3 text-[15px]";

export function RequestApproval({
  locale,
  approvers,
  projects,
  documents,
}: {
  locale: Locale;
  approvers: { id: string; name: string }[];
  projects: { id: string; name: string }[];
  documents: { id: string; name: string }[];
}) {
  const p = getPhase1(locale);
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [details, setDetails] = React.useState("");
  const [approver, setApprover] = React.useState("");
  const [project, setProject] = React.useState("");
  const [documentId, setDocumentId] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await requestApproval({
        title,
        details,
        approverId: approver || null,
        projectId: project || null,
        documentId: documentId || null,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setOpen(false);
      setTitle("");
      setDetails("");
      router.refresh();
    });
  }

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Plus aria-hidden="true" />
        {p.approvals.request}
      </Button>
    );
  }

  return (
    <Card className="p-4">
      <form onSubmit={submit} noValidate className="flex flex-col gap-3">
        <div>
          <Label htmlFor="approval-title">{p.approvals.titleLabel}</Label>
          <Input id="approval-title" className="mt-1" value={title} maxLength={160} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="approval-details">
            {p.approvals.detailsLabel} ({p.common.optional})
          </Label>
          <textarea
            id="approval-details"
            rows={3}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className="mt-1 w-full rounded-button border border-paper-200 bg-paper-0 px-3 py-2 text-[15px] outline-none focus:border-neel-600"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label htmlFor="approval-approver">{p.approvals.approverLabel}</Label>
            <select id="approval-approver" className={SELECT} value={approver} onChange={(e) => setApprover(e.target.value)}>
              <option value="">{p.approvals.anyManager}</option>
              {approvers.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="approval-project">{p.documents.linkedProject}</Label>
            <select id="approval-project" className={SELECT} value={project} onChange={(e) => setProject(e.target.value)}>
              <option value="">{p.common.none}</option>
              {projects.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="approval-document">{p.documents.title}</Label>
            <select id="approval-document" className={SELECT} value={documentId} onChange={(e) => setDocumentId(e.target.value)}>
              <option value="">{p.common.none}</option>
              {documents.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        {error ? (
          <p role="alert" data-testid="request-error" className="rounded-card bg-laal-100 px-3 py-2 text-[14px] text-laal-700">
            {error}
          </p>
        ) : null}
        <div className="flex gap-2">
          <Button type="submit" disabled={pending || title.trim().length < 2}>
            {pending ? p.common.loading : p.approvals.request}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            {p.common.cancel}
          </Button>
        </div>
      </form>
    </Card>
  );
}
