import type { Metadata } from "next";

import { requireOrg, canManage } from "@/lib/auth/session";
import { shellFor } from "@/lib/auth/shell";
import { createClient } from "@/lib/supabase/server";
import { getPhase1 } from "@/lib/i18n/phase1";
import { listApprovals, waitingOn } from "@/lib/approvals/queries";
import { getOrgMembers } from "@/lib/org/members";
import { AppShell } from "@/components/waakya/app-shell";
import { Illustration } from "@/components/waakya/illustrations";
import { ApprovalCard } from "./approval-card";
import { RequestApproval } from "./request-approval";

export const metadata: Metadata = { title: "Approvals" };

export default async function ApprovalsPage() {
  const viewer = await requireOrg();
  const shell = await shellFor(viewer);
  const p = getPhase1(shell.locale);
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
    <AppShell {...shell}>
      <main className="flex-1 p-4 pb-8">
        <h1 className="text-[24px] leading-[30px] font-bold text-ink-900">{p.approvals.title}</h1>
        <p className="mt-0.5 text-[15px] leading-[20px] text-ink-500">{p.approvals.subtitle}</p>

        <div className="mt-5">
          <RequestApproval
            locale={shell.locale}
            approvers={approvers}
            projects={projects ?? []}
            documents={documents ?? []}
          />
        </div>

        {approvals.length === 0 ? (
          <div className="mt-8 flex flex-col items-center rounded-card border border-dashed border-paper-300 px-6 py-10 text-center">
            <Illustration name="review" className="h-32 w-auto" />
            <p className="mt-4 font-display text-[22px] font-bold text-ink-900">{p.approvals.empty}</p>
            <p className="mt-1 text-[15px] text-ink-500">{p.approvals.emptyHelp}</p>
          </div>
        ) : (
          sections.map((section) =>
            section.items.length ? (
              <section key={section.key} className="mt-6">
                <h2 className="mb-2 text-[13px] font-semibold text-ink-700">
                  {section.title} <span className="num font-normal text-ink-400">{section.items.length}</span>
                </h2>
                <ul aria-label={section.title} className="flex flex-col gap-2">
                  {section.items.map((approval) => (
                    <li key={approval.id}>
                      <ApprovalCard locale={shell.locale} approval={approval} canDecide={section.act} />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null,
          )
        )}
      </main>
    </AppShell>
  );
}
