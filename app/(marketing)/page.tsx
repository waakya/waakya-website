import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getViewer } from "@/lib/auth/session";
import { BRAND_NAME } from "@/lib/i18n";
import { Wordmark } from "@/components/waakya/wordmark";
import { AdaptLevels, CustomerLoop, OwnerAttention, TwoBusinesses35, WebsiteStrip } from "./_home/v35-more";
import { BusinessDay, ConversationToWork, HeroChain, ScatterToWork } from "./_home/v35-story";
import "./_home/home.css";

export const metadata: Metadata = {
  title: { absolute: `${BRAND_NAME} · Your entire business. One workspace.` },
  description:
    "Customers, team, operations and the follow-ups nobody has time for, together in one workspace shaped around how your business already works. Work gets an owner, a time and proof; your customer gets a page of their own.",
};

/**
 * The homepage: the V3.5 story, released.
 *
 * One business runs through the whole page (ABC Interiors, Pune) and one
 * calendar runs through every chapter, so nothing here contradicts anything
 * else. The only other business on the page, Omega Builders, appears once,
 * to show the same workspace holding a different trade.
 *
 * Every call to action is real: Sign in and Start go to /login (a new
 * business signs up there), See Waakya opens the product demonstration, and
 * the in-page links go to the chapter they name.
 */
const NAV = [
  { href: "#one-day", label: "What it does" },
  { href: "#adapts", label: "Your business" },
  { href: "#customers", label: "For your customers" },
];

function Chapter({
  eyebrow,
  title,
  say,
  children,
  tint,
  dark,
  id,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  say?: string;
  children?: React.ReactNode;
  tint?: boolean;
  dark?: boolean;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-16 py-14 sm:py-20 ${
        dark ? "bg-[#151a4f] text-white" : tint ? "border-y border-[color:var(--rule)] bg-[#faf7f0]" : ""
      }`}
    >
      <div className="mx-auto max-w-[1180px] px-4 sm:px-8">
        {eyebrow ? (
          <p className="w32-eyebrow" style={dark ? { color: "#b8bdf0" } : undefined}>
            {eyebrow}
          </p>
        ) : null}
        <h2 className="w32-display mt-2 max-w-[22ch] text-[30px] leading-[1.06] sm:text-[42px]">{title}</h2>
        {say ? (
          <p className={`mt-3 max-w-[58ch] text-body sm:text-body-lg ${dark ? "text-white/75" : "text-[color:var(--ink-muted)]"}`}>
            {say}
          </p>
        ) : null}
        {children ? <div className="mt-8 sm:mt-10">{children}</div> : null}
      </div>
    </section>
  );
}

export default async function HomePage() {
  const viewer = await getViewer();
  if (viewer) redirect(viewer.org ? "/aaj" : "/setup");

  return (
    <div className="w35">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-neel-700 focus:shadow"
      >
        Skip to content
      </a>

      {/* ---------------------------------------------------------- nav -- */}
      <header className="mx-auto flex max-w-[1180px] items-center gap-6 px-4 py-3 sm:px-8 sm:py-4">
        <Link href="/" className="inline-flex min-h-11 items-center" aria-label={`${BRAND_NAME} home`}>
          <Wordmark size={22} />
        </Link>
        <nav aria-label="Sections" className="hidden gap-1 text-body-sm font-semibold text-[color:var(--ink-subtle)] md:flex">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="inline-flex min-h-11 items-center px-2 hover:text-neel-700">
              {n.label}
            </a>
          ))}
        </nav>
        <span className="ml-auto flex items-center gap-2 text-body-sm font-semibold sm:gap-4">
          <Link href="/login" className="inline-flex min-h-11 items-center px-2 text-[color:var(--ink-subtle)] hover:text-neel-700">
            Sign in
          </Link>
          <Link href="/demo" className="w32-primary" style={{ minHeight: 44 }}>
            See Waakya
          </Link>
        </span>
      </header>

      <main id="main">
        {/* ------------------------------------------------ 1 · the promise */}
        <section className="w32-heroband">
          <div className="mx-auto max-w-[1180px] px-4 pt-6 pb-10 sm:px-8 sm:pt-12 sm:pb-16">
            <div className="w32-herocopy">
              <p className="w32-eyebrow">Bolo. Ho jayega.</p>
              <h1 className="w32-display mt-3 text-[34px] leading-[1.0] sm:text-[56px] lg:text-[64px]">
                Your entire business.
                <br />
                One workspace.
              </h1>
              <p className="mt-4 max-w-[54ch] text-[16px] leading-[1.5] text-[color:var(--ink-muted)] sm:text-[19px]">
                Customers, team, operations and the follow-ups nobody has time for, together in one workspace,
                shaped around how your business already works.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
                <Link href="/login" className="w32-primary" style={{ minHeight: 48 }}>
                  Start with my business
                </Link>
                <a href="#one-day" className="w32-act font-bold text-neel-700" style={{ minHeight: 44 }}>
                  Watch a business run →
                </a>
              </div>
            </div>

            <p className="w35-kicker mt-8 sm:mt-9">One customer, from her first message to her own page</p>
            <div className="mt-3">
              <HeroChain />
            </div>
          </div>
        </section>

        {/* ------------------------------------------- 2 · why it is painful */}
        <Chapter
          tint
          eyebrow="Monday, 4:40 pm"
          title={<>Nothing is lost. It is just everywhere.</>}
          say="The enquiry is in your website mail, the promise is in a chat, the requirement is on somebody’s phone. By Friday only you know how it joins up, and only if nobody calls."
        >
          <ScatterToWork />
          <p className="w32-sentence mt-6 max-w-[56ch]">
            Waakya does not just collect all of it in one place. It turns it into work that has an owner, a next
            action and a time, which is the part a folder has never done for anyone.
          </p>
        </Chapter>

        {/* -------------------------------------------- 3 · what changes -- */}
        <Chapter
          id="one-day"
          eyebrow="One business · one day"
          title={<>A whole day of work, moving without you in it.</>}
          say="ABC Interiors on Tuesday, 23 September: a new enquiry, a live site, a quotation going out, a customer approving, a vendor confirming. Every beat says which part of the workspace it touched."
        >
          <BusinessDay />
        </Chapter>

        {/* --------------------------------------------- 4 · how work starts */}
        <Chapter
          tint
          eyebrow="How the work starts"
          title={<>Work starts in a conversation. It should not end there.</>}
          say="One sentence anybody would say in a group chat, turned into a commitment with a name and a time on it."
        >
          <ConversationToWork />
        </Chapter>

        {/* ------------------------------------------------ 5 · the owner -- */}
        <Chapter
          eyebrow="Your morning"
          title={<>Know what needs you. The rest keeps moving.</>}
          say="Waakya’s job is to reduce how much of the business has to pass through your head, not to hand you a longer list."
        >
          <OwnerAttention />
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <p className="w32-display text-[24px] leading-tight sm:text-[28px]">
              Four decisions.
              <br />
              Not forty messages.
            </p>
            <p className="w32-sentence">
              Work that is running does not ask for your attention. Work that is stuck, late, or waiting on your word
              comes to the top and says so, in words, not in colours you have to decode.
            </p>
          </div>
        </Chapter>

        {/* --------------------------------------------- 6 · the customer -- */}
        <Chapter
          dark
          id="customers"
          eyebrow="For your customers"
          title={<>Your customer stops asking “kya hua?”</>}
          say="One sequence, from the message they get to the work their answer unblocks. Their experience and your operation are the same system, seen from two sides."
        >
          <div className="rounded-[22px] bg-white p-4 text-[color:var(--ink)] sm:p-7">
            <CustomerLoop />
          </div>
          <div className="mt-9 max-w-[56ch]">
            <h3 className="w32-display text-[24px] leading-tight sm:text-[28px]">
              A customer who can see the work does not need to chase it.
            </h3>
            <p className="mt-3 text-body text-white/75 sm:text-body-lg">
              Fewer calls for your team. Faster approvals for you. And at handover, a customer who watched you do it
              properly, which is how the next job arrives.
            </p>
          </div>
        </Chapter>

        {/* ------------------------------------------- 7 · it fits my trade */}
        <Chapter
          tint
          id="adapts"
          eyebrow="Built around the way you work"
          title={<>One builds offices. One sells flats. Both run on Waakya.</>}
        >
          <TwoBusinesses35 />

          <div className="mt-14 border-t border-[color:var(--rule-strong)] pt-10">
            <h3 className="w32-display text-[24px] sm:text-[30px]">And it keeps going as far as your business does.</h3>
            <div className="mt-7">
              <AdaptLevels />
            </div>
            <p className="w32-display mt-9 max-w-[24ch] text-[22px] leading-tight sm:text-[28px]">
              Your business has its own way of working. Waakya can go with it.
            </p>
          </div>
        </Chapter>

        {/* ----------------------------------------------- 8 · your website */}
        <Chapter
          eyebrow="Your website"
          title={<>Keep your website. Connect the business behind it.</>}
          say="Your site stays your site. What changes is where its enquiries land, and that your customers have somewhere to look afterwards."
        >
          <WebsiteStrip />
        </Chapter>

        {/* ------------------------------------------------------ 9 · close */}
        <section className="bg-[#151a4f] px-4 py-16 text-white sm:px-8 sm:py-24">
          <div className="mx-auto max-w-[1180px]">
            <h2 className="w32-display max-w-[18ch] text-[34px] leading-[1.04] sm:text-[56px]">
              You built the business. You should not have to hold it together.
            </h2>
            <p className="w32-display mt-7 text-[24px] leading-tight sm:text-[32px]" style={{ color: "#b8bdf0" }}>
              Your entire business. One workspace.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link href="/login" className="w32-primary" style={{ background: "#fff", color: "#151a4f", minHeight: 52 }}>
                Start with my business
              </Link>
              <Link href="/demo" className="inline-flex min-h-11 items-center font-bold text-white underline underline-offset-4">
                See the product demonstration
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[color:var(--rule)] bg-[#fbfaf6]">
        <div className="mx-auto grid w-full max-w-[1180px] gap-6 px-4 py-8 sm:grid-cols-[1fr_auto] sm:items-center sm:px-8">
          <div>
            <Wordmark size={20} />
            <p className="mt-2 text-[14px] text-[color:var(--ink-subtle)]">Bolo. Ho jayega.</p>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-8 text-[14px] text-[color:var(--ink-muted)] sm:flex sm:flex-wrap sm:gap-x-6">
            {NAV.map((item) => (
              <a key={item.href} href={item.href} className="inline-flex min-h-11 items-center hover:text-neel-700">
                {item.label}
              </a>
            ))}
            <Link href="/privacy" className="inline-flex min-h-11 items-center hover:text-neel-700">
              Privacy
            </Link>
            <Link href="/login" className="inline-flex min-h-11 items-center hover:text-neel-700">
              Sign in
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
