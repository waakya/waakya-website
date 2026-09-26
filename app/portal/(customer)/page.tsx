import Link from "next/link";
import { redirect } from "next/navigation";

import { getLocale } from "@/lib/i18n/server";
import { getPortal } from "@/lib/i18n/portal";
import { requireCustomer } from "@/lib/portal/principal";
import { EmptyState, ListSurface } from "@/components/waakya/page";

/** One project goes straight to its page; several are listed. */
export default async function PortalHome() {
  const principal = await requireCustomer();
  const locale = await getLocale();
  const t = getPortal(locale).portal;
  const projects = principal.businesses.flatMap((b) => b.projects.map((p) => ({ ...p, orgName: b.orgName })));
  if (projects.length === 1) redirect(`/portal/projects/${projects[0].id}`);
  return (
    <main className="p-4">
      <h1 className="text-title font-bold text-fg">{t.yourProjects}</h1>
      {projects.length === 0 ? (
        <EmptyState className="mt-6" title={t.noProjects} body={t.noProjectsHelp} />
      ) : (
        <ListSurface className="mt-4">
          {projects.map((p) => (
            <li key={p.id}>
              <Link href={`/portal/projects/${p.id}`} className="flex min-h-tap items-center gap-3 px-4 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block text-body font-semibold text-fg">{p.name}</span>
                  <span className="block text-caption text-fg-subtle">{p.orgName}</span>
                </span>
              </Link>
            </li>
          ))}
        </ListSurface>
      )}
    </main>
  );
}
