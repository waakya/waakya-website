import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CalendarCheck,
  CheckSquare,
  FileText,
  Home,
  MessageSquare,
  ShieldCheck,
  SquareCheckBig,
} from "lucide-react";

import { getViewer } from "@/lib/auth/session";
import { BRAND_NAME } from "@/lib/i18n";
import { buttonVariants } from "@/components/ui/button";
import { Wordmark } from "@/components/waakya/wordmark";
import { Annotation, Illustration } from "@/components/waakya/illustrations";
import { Bubble, Composer, DocCard, Frame, Stamp, TaskCard } from "./_components/mock";
import { Walkthrough } from "./_components/walkthrough";

export const metadata: Metadata = {
  title: `${BRAND_NAME} — Every conversation. A clear next step.`,
  description:
    "Bring your team's conversations and everyday work together: tasks, proof, documents, attendance and approvals. From the first message to the final review.",
};

const STEPS = [
  { icon: MessageSquare, title: "Talk", text: "Bring your team together" },
  { icon: CheckSquare, title: "Assign", text: "Turn messages into work" },
  { icon: FileText, title: "Execute", text: "Get work done" },
  { icon: ShieldCheck, title: "Prove", text: "Keep a clear record" },
];

/**
 * The website. Expressive headings in Baloo 2, the product itself in Inter, and
 * only what Phase 1 really does: one business and its team.
 */
export default async function LandingPage() {
  const viewer = await getViewer();
  if (viewer) redirect(viewer.org ? "/aaj" : "/setup");

  const heading = "font-display font-extrabold tracking-[-0.01em] text-neel-900";

  return (
    <div className="flex min-h-dvh flex-col bg-[#fbfaf6] text-ink-900">
      {/* --------------------------------------------------------------- nav */}
      <header className="sticky top-0 z-40 border-b border-[#ecebe4] bg-[#fbfaf6]/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-6 px-4 py-3 lg:px-8">
          <Link href="/" aria-label={BRAND_NAME}>
            <Wordmark size={24} />
          </Link>
          <nav className="hidden flex-1 items-center justify-center gap-8 text-[14px] font-medium text-ink-700 md:flex">
            <a href="#product" className="hover:text-neel-700">Product</a>
            <a href="#how" className="hover:text-neel-700">How it works</a>
            <a href="#businesses" className="hover:text-neel-700">For businesses</a>
          </nav>
          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Sign in
            </Link>
            <Link href="/login" className={buttonVariants({ size: "sm" })}>
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ------------------------------------------------------------ hero */}
        <section id="product" className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 pt-12 pb-10 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:pt-20">
          <div>
            <h1 className={`${heading} text-[42px] leading-[1.02] sm:text-[54px] lg:text-[60px]`}>
              Every conversation.
              <br />A clear next step.
            </h1>
            <p className="mt-5 max-w-md text-[17px] leading-[27px] text-ink-700">
              Bring your team&apos;s conversations and everyday work together. From the first
              message to the final review.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/login" className={buttonVariants({ size: "owner" })}>
                Get started
                <ArrowRight aria-hidden="true" />
              </Link>
              <a href="#how" className={buttonVariants({ variant: "outline", size: "owner" })}>
                See how it works
              </a>
            </div>
            <p className="mt-8 flex flex-wrap gap-x-6 gap-y-1 text-[11.5px] font-semibold tracking-[0.18em] text-ink-400 uppercase">
              <span>Conversations</span>
              <span>People</span>
              <span>Work</span>
              <span>Progress</span>
            </p>
          </div>

          <Frame title="Waakya · UrbanNest Interiors">
            <div className="grid md:grid-cols-[150px_1fr_190px]">
              <aside className="hidden flex-col gap-1 border-r border-[#eceef6] p-3 md:flex">
                {[
                  [Home, "Today"],
                  [MessageSquare, "Conversations"],
                  [SquareCheckBig, "Work"],
                  [FileText, "Documents"],
                  [CalendarCheck, "Attendance"],
                ].map(([Icon, label], i) => {
                  const I = Icon as typeof Home;
                  return (
                    <span
                      key={label as string}
                      className={
                        i === 1
                          ? "flex items-center gap-2 rounded-[8px] bg-neel-50 px-2 py-1.5 text-[12px] font-semibold text-neel-700"
                          : "flex items-center gap-2 px-2 py-1.5 text-[12px] text-ink-500"
                      }
                    >
                      <I className="size-3.5" aria-hidden="true" />
                      {label as string}
                    </span>
                  );
                })}
              </aside>
              <div className="flex flex-col gap-3 p-4">
                <div>
                  <p className="text-[13px] font-semibold text-ink-900">Office renovation · Project team</p>
                  <p className="text-[11.5px] text-ink-400">Priya, Rahul and 3 others</p>
                </div>
                <Bubble initials="PS" name="Priya" time="11:24 AM" text="Rahul, send the revised quotation by 5 PM." highlight />
                <Bubble initials="RS" name="Rahul" time="11:26 AM" text="Got it. I'll share the revised quotation by 5 PM." />
                <Composer />
              </div>
              <div className="flex flex-col gap-2.5 border-t border-[#eceef6] p-4 md:border-t-0 md:border-l">
                <p className="text-[11px] font-semibold tracking-wide text-ink-400 uppercase">Linked work</p>
                <TaskCard title="Revised quotation" who="Rahul" due="Today · 5 PM" />
                <DocCard name="Quotation v2" meta="PDF · 1.8 MB" state="Awaiting approval" />
              </div>
            </div>
          </Frame>
        </section>

        {/* ---------------------------------------------------------- steps */}
        <section className="border-y border-[#ecebe4] bg-white">
          <ol className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-7 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <li key={step.title} className="flex items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-[10px] border border-neel-100 bg-neel-50">
                    <Icon className="size-5 text-neel-700" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[15px] font-bold text-neel-900">{step.title}</span>
                    <span className="block text-[13.5px] text-ink-500">{step.text}</span>
                  </span>
                  {i < STEPS.length - 1 ? (
                    <ArrowRight className="ml-auto hidden size-4 text-ink-300 lg:block" aria-hidden="true" />
                  ) : null}
                </li>
              );
            })}
          </ol>
        </section>

        {/* ---------------------------------------------------- walkthrough */}
        <section id="how" className="mx-auto w-full max-w-6xl px-4 py-16 lg:px-8 lg:py-20">
          <div className="text-center">
            <h2 className={`${heading} text-[34px] leading-[1.08] sm:text-[42px]`}>See the work move forward.</h2>
            <p className="mt-2 text-[16px] text-ink-500">One quotation. Four clear steps.</p>
          </div>
          <div className="mt-8">
            <Walkthrough />
          </div>
        </section>

        {/* ------------------------------------------------- team workspace */}
        <section className="border-y border-[#ecebe4] bg-white">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
            <div>
              <p className="text-[11.5px] font-semibold tracking-[0.16em] text-neel-700 uppercase">One workspace</p>
              <h2 className={`${heading} mt-2 text-[34px] leading-[1.06] sm:text-[40px]`}>
                Your team.
                <br />
                One place to move work forward.
              </h2>
              <p className="mt-4 max-w-md text-[16px] leading-[25px] text-ink-700">
                Conversations, tasks, documents, attendance and approvals stay together, so
                nobody has to ask where anything is.
              </p>
              <a href="#how" className="mt-4 inline-flex items-center gap-1.5 text-[14.5px] font-semibold text-neel-700">
                See it in action <ArrowRight className="size-4" aria-hidden="true" />
              </a>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Frame title="Conversations">
                <div className="flex flex-col gap-2.5 p-3">
                  <Bubble initials="VS" name="Vikram" time="9:12 AM" text="Site photos from Sector 76 are up." />
                  <Bubble initials="NV" name="Neha" time="9:15 AM" text="Thanks. Adding them to the project." />
                </div>
              </Frame>
              <Frame title="Work">
                <div className="flex flex-col gap-2 p-3">
                  <TaskCard title="Upload site photos" who="Vikram" due="Done" state="Verified" tone="hara" />
                  <TaskCard title="Confirm electrical layout" who="Neha" due="Tomorrow" state="Accepted" />
                </div>
              </Frame>
              <Frame title="Attendance">
                <ul className="flex flex-col gap-2 p-3 text-[12.5px]">
                  <li className="flex justify-between"><span className="font-semibold">Rahul Sharma</span><span className="text-ink-500">In · 9:41 AM</span></li>
                  <li className="flex justify-between"><span className="font-semibold">Neha Verma</span><span className="text-ink-500">On leave</span></li>
                  <li className="flex justify-between"><span className="font-semibold">Priya Kapoor</span><span className="text-ink-500">9:32 – 6:07 PM</span></li>
                </ul>
              </Frame>
              <Frame title="Approvals">
                <div className="flex flex-col gap-2 p-3">
                  <DocCard name="Vendor comparison" meta="Requested by Priya" state="Pending" />
                  <Stamp text="Leave approved · Neha" />
                </div>
              </Frame>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------ clear finish */}
        <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <p className="text-[11.5px] font-semibold tracking-[0.16em] text-neel-700 uppercase">Clear closure</p>
            <h2 className={`${heading} mt-2 text-[34px] leading-[1.06] sm:text-[40px]`}>
              Good work deserves
              <br />a clear finish.
            </h2>
            <p className="mt-4 max-w-md text-[16px] leading-[25px] text-ink-700">
              Submit proof. Review it. Keep a record everyone can follow.
            </p>
          </div>
          <Frame title="Revised quotation">
            <div className="grid gap-4 p-4 md:grid-cols-[1.1fr_0.9fr]">
              <div className="flex flex-col gap-3">
                <TaskCard title="Revised quotation" who="Rahul" due="Today · 5 PM" state="In progress" />
                <p className="text-[11px] font-semibold tracking-wide text-ink-400 uppercase">Attached document</p>
                <DocCard name="Quotation-v2.pdf" meta="1.8 MB" />
              </div>
              <div className="rounded-[10px] border border-[#eceef6] bg-[#fafbfe] p-3">
                <p className="text-[12.5px] font-semibold text-ink-900">To verify</p>
                <p className="mt-1.5 text-[12px] leading-[18px] text-ink-500">
                  Review the submitted quotation and confirm once everything looks good.
                </p>
                <span className="mt-3 block rounded-[8px] bg-neel-600 py-2 text-center text-[12.5px] font-semibold text-white">
                  Verify completion
                </span>
                <span className="mt-2 block text-center text-[12px] font-semibold text-neel-700">Request changes</span>
              </div>
            </div>
          </Frame>
        </section>

        {/* ------------------------------------------------------ businesses */}
        <section id="businesses" className="border-t border-[#ecebe4] bg-white">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 lg:px-8">
            <h2 className={`${heading} text-center text-[30px] leading-[1.1] sm:text-[36px]`}>
              Made for the way your business works.
            </h2>
            <ul className="mt-10 grid gap-8 md:grid-cols-3">
              {[
                { art: "team" as const, title: "Service teams", text: "Coordinate everyday field and office work.", eg: "Interiors, construction, facilities" },
                { art: "laptop" as const, title: "Agencies", text: "Manage conversations, deliverables and approvals.", eg: "Design, marketing, events" },
                { art: "handoff" as const, title: "Small businesses", text: "Keep teams, documents and work organised.", eg: "Professional services, distribution, retail" },
              ].map((item) => (
                <li key={item.title} className="flex gap-4">
                  <Illustration name={item.art} className="h-20 w-28 shrink-0" />
                  <div>
                    <p className="text-[16px] font-bold text-neel-900">{item.title}</p>
                    <p className="mt-1 text-[14px] leading-[20px] text-ink-700">{item.text}</p>
                    <p className="mt-1 text-[12.5px] text-ink-400">e.g. {item.eg}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ------------------------------------------------------------ CTA */}
        <section className="bg-neel-50">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-8 px-4 py-14 lg:grid-cols-[1fr_auto_1fr] lg:px-8">
            <div>
              <h2 className={`${heading} text-[34px] leading-[1.04] sm:text-[42px]`}>
                Less chasing.
                <br />
                More moving forward.
              </h2>
              <p className="mt-2 text-[15.5px] text-ink-700">Conversations into progress for growing businesses.</p>
            </div>
            <Link href="/login" className={buttonVariants({ size: "staff" })}>
              Get started
              <ArrowRight aria-hidden="true" />
            </Link>
            <div className="relative hidden justify-end lg:flex">
              <Annotation text="Ideas to progress together." className="absolute -top-6 left-2" />
              <Illustration name="conversation" className="h-40 w-auto" />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#ecebe4] bg-[#fbfaf6]">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-4 py-6 lg:px-8">
          <Wordmark size={20} />
          <p className="text-[13px] text-ink-500">Conversations to progress.</p>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-ink-700 sm:ml-auto">
            <a href="#product">Product</a>
            <a href="#how">How it works</a>
            <a href="#businesses">For businesses</a>
            <Link href="/privacy">Privacy</Link>
            <Link href="/login">Sign in</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
