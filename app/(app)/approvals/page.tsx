import type { Metadata } from "next";

import { requireOrg, canManage } from "@/lib/auth/session";
import { shellFor } from "@/lib/auth/shell";
import { createClient } from "@/lib/supabase/server";
import { getPhase1 } from "@/lib/i18n/phase1";
import { getDesign } from "@/lib/i18n/design";
import { listApprovals, waitingOn } from "@/lib/approvals/queries";
import { getOrgMembers } from "@/lib/org/members";
import { AppShell } from "@/components/waakya/app-shell";
import { PageHeader } from "@/components/waakya/page";
import { Illustration } from "@/components/waakya/illustrations";
import { ApprovalCard } from "./approval-card";
import { RequestApproval } from "./request-approval";
import { RevealGroup, RevealToggle } from "@/components/waakya/reveal";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Approvals" };

export default async function ApprovalsPage() {
  const viewer = await requireOrg();
  const shell = await shellFor(viewer);
  const p = getPhase1(shell.locale);
  const d = getDesign(shell.locale);
  const manages = canManage(viewer.role);
  const supabase = await createClient();

  const [approvals, members, { data: projects }, { data: documents }] = await Promise.all([
    listApprovals(viewer.org.id),
    getOrgMembers(viewer.org.id),
    supabase.from("projects").select("id, name").eq("org_id", viewer.org.id).order("updated_at", { ascending: false }).limit(50),
    supabase.from("documents").select("id, name").eq("org_id", viewer.org.id).is("message_id", null).order("created_at", { ascending: false }).limit(50),
  ]);

  const waiting = waitingOn(approvals, viewer.userId, manages);
  const waitingIds = new Set(waiting.map((approval) => approval.id));
  const mine = approvals.filter((approval) => approval.requestedBy === viewer.userId);
  const decided = approvals.filter(
    (approval) => approval.status !== "pending" && approval.requestedBy !== viewer.userId,
  );

  const approvers = members
    .filter((member) => member.userId !== viewer.userId && ["owner", "admin", "manager"].includes(member.role))
    .map((member) => ({ id: member.userId, name: member.name }));

  const sections = [
    { key: "waiting", title: p.approvals.waiting, items: waiting, act: true },
    { key: "mine", title: p.approvals.mine, items: mine, act: false },
    { key: "decided", title: p.approvals.decided, items: decided.filter((a) => !waitingIds.has(a.id)).slice(0, 20), act: false },
  ];

  return (
    <AppShell {...shell} width="list">
      <main className="flex-1 p-4 pb-8 lg:px-0">
        <PageHeader title={p.approvals.title} description={p.approvals.subtitle} />

        <div className="mt-5">
          <RequestApproval
            locale={shell.locale}
            approvers={approvers}
            projects={projects ?? []}
            documents={documents ?? []}
          />
        </div>

        {approvals.length === 0 ? (
          <div className="mt-8 flex flex-col items-center rounded-card border border-dashed border-line-strong px-6 py-10 text-center">
            <Illustration name="review" className="h-28 w-auto" />
            <p className="mt-4 text-title-sm font-bold text-fg">{p.approvals.empty}</p>
            <p className="mt-1 max-w-sm text-body text-fg-subtle">{p.approvals.emptyHelp}</p>
          </div>
        ) : (
          sections.map((section) =>
            section.items.length ? (
              // Decisions waiting on you all show; your own requests and what
              // was decided show the latest five, the rest one tap away.
              <RevealGroup as="section" key={section.key} id={`approvals-${section.key}`} className="group/older mt-8">
                <h2 className="mb-3 text-body font-bold text-fg">
                  {section.title} <span className="num font-normal text-fg-subtle">{section.items.length}</span>
                </h2>
                <ul id={`approvals-${section.key}`} aria-label={section.title} className="flex flex-col gap-2">
                  {section.items.map((approval, index) => (
                    <li key={approval.id} id={`approval-${approval.id}`} className={cn("scroll-mt-20 rounded-card target:ring-2 target:ring-neel-600 target:ring-offset-2", !section.act && index >= 5 && "hidden group-data-[open=true]/older:block")}>
                      <ApprovalCard locale={shell.locale} approval={approval} canDecide={section.act} />
                    </li>
                  ))}
                </ul>
                {!section.act && section.items.length > 5 ? (
                  <RevealToggle className="mt-1 text-label font-semibold text-neel-700" more={d.v3.showAll(section.items.length)} less={d.v3.showLess} />
                ) : null}
              </RevealGroup>
            ) : null,
          )
        )}
      </main>
    </AppShell>
  );
}
