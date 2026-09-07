import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Camera,
  Check,
  Clock,
  ListChecks,
  MessageSquare,
  Phone,
  Send,
  Share2,
  Sparkles,
} from "lucide-react";

import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StateChip } from "@/components/ui/state-chip";
import { Ticks, type TicksState } from "@/components/waakya/ticks";
import { Wordmark } from "@/components/waakya/wordmark";
import { Doodle } from "@/components/waakya/doodle";
import { LanguageSwitch } from "@/components/waakya/language-switch";
import { getLanding } from "@/lib/i18n/landing";
import { brandName, getDictionary, BRAND_NAME } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { getViewer } from "@/lib/auth/session";
import { setLoginLocale } from "@/app/(auth)/login/actions";
import { cn } from "@/lib/utils";
import { BrandText } from "@/components/waakya/brand-text";

export const metadata: Metadata = {
  title: `${BRAND_NAME} — Bolo. Ho jayega.`,
  description:
    "Send work to your team and get it back with a photo. Every task has a deadline, has to be acknowledged, and escalates to you if it is not.",
};

const LADDER: TicksState[] = ["sent", "seen", "accepted", "done", "verified"];

const STEP_ICONS = [Send, Check, Camera];
const FEATURE_ICONS = [Clock, Camera, ListChecks, Calendar];
const WHATSAPP_ICONS = [Send, Share2, Sparkles];
const WHO_ICONS = [Phone, ListChecks, MessageSquare];

/**
 * The landing page (screens/LandingDesktop.png and LandingMobile.png).
 *
 * One tree at every width: the sections stack on a phone and spread on a
 * desktop, using the same tokens and the same components as the product — the
 * ticks glyph here is the real one, not a picture of it.
 *
 * Somebody already signed in has no use for a sales page, so they go straight
 * to their day.
 */
export default async function LandingPage() {
  const viewer = await getViewer();
  if (viewer) redirect(viewer.org ? "/aaj" : "/setup");

  const locale = await getLocale();
  const t = getDictionary(locale);
  const c = getLanding(locale);
  const brand = brandName(locale);

  return (
    <div className="flex min-h-dvh flex-col">
      {/* ---------------------------------------------------------------- nav */}
      <header className="sticky top-0 z-40 border-b border-paper-200 bg-paper-50/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-6 px-4 py-3 lg:px-8">
          <Link href="/" aria-label={BRAND_NAME}>
            <Wordmark size={24} />
          </Link>

          <nav className="hidden flex-1 items-center gap-6 md:flex">
            <NavLink href="#how">{c.navHow}</NavLink>
            <NavLink href="#who">{c.navWho}</NavLink>
            <NavLink href="#price">{c.navPrice}</NavLink>
            <NavLink href="#faq">{c.navFaq}</NavLink>
          </nav>

          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <span className="hidden lg:block">
              <LanguageSwitch value={locale} onChange={setLoginLocale} />
            </span>
            <Link
              href="/login"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              {c.navLogin}
            </Link>
            <Link href="/login" className={buttonVariants({ size: "sm" })}>
              {c.heroCta}
            </Link>
          </div>
        </div>
      </header>

      {/* -------------------------------------------------------------- hero */}
      <section className="relative overflow-hidden">
        <Doodle className="pointer-events-none absolute inset-0" />
        <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-chip border border-paper-200 bg-paper-0 px-3 py-1.5 text-[13px] font-semibold text-ink-700">
              {c.heroBadge}
            </p>
            <h1 className="font-display mt-5 text-[44px] leading-[1.05] font-extrabold text-neel-800 lg:text-[64px]">
              {c.heroTitle}
            </h1>
            <p className="mt-4 max-w-lg text-[17px] leading-[26px] text-ink-700 lg:text-[19px] lg:leading-[30px]">
              {c.heroLead}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/login"
                className={buttonVariants({ size: "staff", className: "shadow-mic" })}
              >
                {c.heroCta}
                <ArrowRight />
              </Link>
              <Link
                href="#how"
                className={buttonVariants({ variant: "outline", size: "staff" })}
              >
                {c.heroCtaSecondary}
              </Link>
            </div>

            <p className="mt-4 text-[13px] text-ink-500">{c.heroNote}</p>
          </div>

          {/* A real task row and a real staff screen, built from the product's
              own components rather than drawn — what you see is what ships. */}
          <div className="relative">
            <Card className="mx-auto max-w-sm rounded-sheet p-5 shadow-float">
              <p className="text-[13px] font-semibold text-ink-500">
                {t.lists.aajHeading}
              </p>
              <ul className="mt-3 flex flex-col gap-2">
                <HeroRow
                  title="Sector 62 3BHK ki photos"
                  meta="Raju · 5:00 pm"
                  chip={
                    <StateChip tone="amber" icon={<Clock />}>
                      {t.chips.dekhaNahi}
                    </StateChip>
                  }
                />
                <HeroRow
                  title="Godown stock count"
                  meta="Amit · 11:00"
                  chip={
                    <StateChip tone="laal" icon={<Clock />}>
                      {t.chips.lateBy("40 min")}
                    </StateChip>
                  }
                  late
                />
                <HeroRow
                  title="Sharma ji ko call"
                  meta={`Pooja · ${t.stepper.hoGaya}`}
                  chip={<Ticks state="done" locale={locale} />}
                />
                <HeroRow
                  title="Site board ki photo"
                  meta={`Raju · ${t.stepper.verified}`}
                  chip={<Ticks state="verified" locale={locale} />}
                />
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ ladder */}
      <section className="border-y border-paper-200 bg-paper-0">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 lg:px-8 lg:py-16">
          <h2 className="text-[24px] leading-tight font-bold text-neel-800 lg:text-[28px]">
            {c.ladderTitle}
          </h2>
          <p className="mt-2 max-w-2xl text-[15px] leading-[24px] text-ink-500">
            {c.ladderLead}
          </p>

          <ul className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
            {LADDER.map((state, index) => (
              <li key={state} className="flex flex-col items-center gap-2 text-center">
                <Ticks state={state} locale={locale} size={28} />
                <span className="text-[17px] font-bold text-ink-900">
                  {c.ladder[index].word}
                </span>
                <span className="text-[13px] text-ink-500">
                  {c.ladder[index].note}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ----------------------------------------------------------- problem */}
      <Section title={c.problemTitle} lead={c.problemLead}>
        <ul className="grid gap-4 md:grid-cols-3">
          {c.problems.map((problem) => (
            <li key={problem.title}>
              <Card className="h-full p-5">
                <h3 className="text-[17px] font-bold text-ink-900">
                  {problem.title}
                </h3>
                <p className="mt-2 text-[15px] leading-[24px] text-ink-500">
                  {problem.body}
                </p>
              </Card>
            </li>
          ))}
        </ul>
        <p className="mt-5 rounded-card bg-neel-50 px-4 py-3 text-[15px] leading-[24px] text-neel-800">
          <BrandText text={c.problemFooter(brand)} brand={brand} />
        </p>
      </Section>

      {/* ------------------------------------------------------------- steps */}
      <section id="how" className="border-y border-paper-200 bg-paper-0">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 lg:px-8 lg:py-20">
          <h2 className="text-[24px] leading-tight font-bold text-neel-800 lg:text-[32px]">
            {c.stepsTitle}
          </h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {c.steps.map((step, index) => {
              const Icon = STEP_ICONS[index];
              return (
                <li key={step.title}>
                  <span className="flex size-11 items-center justify-center rounded-tile bg-neel-600 text-white">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="num mt-4 text-[19px] font-bold text-ink-900">
                    {index + 1}. {step.title}
                  </h3>
                  <p className="mt-2 text-[15px] leading-[24px] text-ink-500">
                    {step.body}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* ---------------------------------------------------------- features */}
      <Section title={c.featuresTitle}>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {c.features.map((feature, index) => {
            const Icon = FEATURE_ICONS[index];
            return (
              <li key={feature.title}>
                <Card className="h-full p-5">
                  <Icon className="size-6 text-neel-600" aria-hidden="true" />
                  <h3 className="mt-3 text-[17px] font-bold text-ink-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-[15px] leading-[24px] text-ink-500">
                    {feature.body}
                  </p>
                </Card>
              </li>
            );
          })}
        </ul>
      </Section>

      {/* ---------------------------------------------------------- whatsapp */}
      <section className="bg-neel-800 text-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 lg:px-8 lg:py-20">
          <h2 className="font-display max-w-2xl text-[28px] leading-tight font-extrabold lg:text-[40px]">
            {c.whatsappTitle}
          </h2>
          <p className="mt-3 text-[17px] text-white/70">
            <BrandText text={c.whatsappLead(brand)} brand={brand} />
          </p>

          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {c.whatsapp.map((item, index) => {
              const Icon = WHATSAPP_ICONS[index];
              return (
                <li
                  key={item.title}
                  className="rounded-card bg-white/10 p-5 backdrop-blur"
                >
                  <Icon className="size-6 text-white" aria-hidden="true" />
                  <h3 className="mt-3 flex flex-wrap items-center gap-2 text-[17px] font-bold">
                    {item.title}
                    {item.soon ? (
                      <span className="rounded-chip bg-white/20 px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase">
                        {c.soonLabel}
                      </span>
                    ) : null}
                  </h3>
                  <p className="mt-2 text-[15px] leading-[24px] text-white/70">
                    {item.body}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* --------------------------------------------------------------- who */}
      <Section id="who" title={c.whoTitle} lead={c.whoLead}>
        <ul className="grid gap-4 md:grid-cols-3">
          {c.who.map((who, index) => {
            const Icon = WHO_ICONS[index];
            return (
              <li key={who.title}>
                <Card className="flex h-full flex-col p-5">
                  <Icon className="size-6 text-neel-600" aria-hidden="true" />
                  <h3 className="mt-3 text-[17px] font-bold text-ink-900">
                    {who.title}
                  </h3>
                  <p className="mt-2 flex-1 text-[15px] leading-[24px] text-ink-500">
                    {who.body}
                  </p>
                  <p className="mt-4 rounded-card bg-paper-100 px-3 py-2 text-[15px] leading-[22px] text-ink-700 italic">
                    {who.quote}
                  </p>
                </Card>
              </li>
            );
          })}
        </ul>
      </Section>

      {/* ------------------------------------------------------------- price */}
      <section id="price" className="border-y border-paper-200 bg-paper-0">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 lg:px-8 lg:py-20">
          <h2 className="text-[24px] leading-tight font-bold text-neel-800 lg:text-[32px]">
            {c.priceTitle}
          </h2>
          <p className="mt-2 text-[15px] text-ink-500">{c.priceLead}</p>

          <ul className="mt-8 grid gap-5 md:grid-cols-2 lg:max-w-3xl">
            {c.plans.map((plan, index) => {
              const featured = index === 1;
              return (
                <li key={plan.name}>
                  <div
                    className={cn(
                      "flex h-full flex-col rounded-card border p-6",
                      featured
                        ? "border-neel-600 bg-neel-600 text-white"
                        : "border-paper-200 bg-paper-0",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3
                        className={cn(
                          "text-[19px] font-bold",
                          featured ? "text-white" : "text-ink-900",
                        )}
                      >
                        {plan.name}
                      </h3>
                      {plan.badge ? (
                        <span
                          className={cn(
                            "rounded-chip px-2 py-0.5 text-[11px] font-semibold",
                            featured
                              ? "bg-white/20 text-white"
                              : "bg-amber-100 text-amber-700",
                          )}
                        >
                          {plan.badge}
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-4 flex items-baseline gap-1">
                      <span
                        className={cn(
                          "num font-display text-[40px] leading-none font-extrabold",
                          featured ? "text-white" : "text-neel-800",
                        )}
                      >
                        ₹{plan.price}
                      </span>
                      <span
                        className={cn(
                          "text-[15px]",
                          featured ? "text-white/70" : "text-ink-500",
                        )}
                      >
                        / {plan.per}
                      </span>
                    </p>

                    <ul className="mt-5 flex flex-1 flex-col gap-2">
                      {plan.features.map((feature) => (
                        <li
                          key={feature}
                          className={cn(
                            "flex items-start gap-2 text-[15px] leading-[22px]",
                            featured ? "text-white/90" : "text-ink-700",
                          )}
                        >
                          <Check
                            className={cn(
                              "mt-0.5 size-4 shrink-0",
                              featured ? "text-white" : "text-hara-600",
                            )}
                            strokeWidth={3}
                            aria-hidden="true"
                          />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <Link
                      href="/login"
                      className={cn(
                        buttonVariants({ size: "block" }),
                        "mt-6",
                        featured && "bg-white text-neel-700 hover:bg-white/90",
                      )}
                    >
                      {plan.cta}
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-[13px] text-ink-500">{c.priceNote}</p>
        </div>
      </section>

      {/* --------------------------------------------------------------- faq */}
      <Section id="faq" title={c.faqTitle}>
        <ul className="flex max-w-3xl flex-col gap-2">
          {c.faq.map((item) => (
            <li key={item.q}>
              <details className="group rounded-card border border-paper-200 bg-paper-0 p-4">
                <summary className="flex min-h-tap cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-bold text-ink-900">
                  {item.q}
                  <span
                    aria-hidden="true"
                    className="text-ink-400 transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-2 text-[15px] leading-[24px] text-ink-500">
                  {item.a}
                </p>
              </details>
            </li>
          ))}
        </ul>
      </Section>

      {/* ---------------------------------------------------------- final CTA */}
      <section className="px-4 pb-14 lg:px-8">
        <div className="relative mx-auto w-full max-w-6xl overflow-hidden rounded-sheet bg-neel-700 px-6 py-12 text-white lg:px-12 lg:py-16">
          <Doodle className="pointer-events-none absolute inset-0" />
          <div className="relative">
            <h2 className="font-display max-w-2xl text-[28px] leading-tight font-extrabold lg:text-[40px]">
              {c.finalTitle}
            </h2>
            <p className="mt-3 max-w-xl text-[17px] leading-[26px] text-white/70">
              {c.finalLead}
            </p>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ size: "staff" }),
                "mt-6 bg-white text-neel-700 hover:bg-white/90",
              )}
            >
              {c.finalCta}
              <ArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ footer */}
      <footer className="border-t border-paper-200 bg-paper-0">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-4 px-4 py-6 lg:px-8">
          <Wordmark size={20} />
          <p className="text-[13px] text-ink-500">{c.footerTagline}</p>
          <div className="ml-auto flex items-center gap-4">
            <Link
              href="/privacy"
              className="text-[13px] font-semibold text-ink-700 hover:underline"
            >
              {c.footerPrivacy}
            </Link>
            <Link
              href="/login"
              className="text-[13px] font-semibold text-ink-700 hover:underline"
            >
              {c.footerLogin}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-[15px] font-semibold text-ink-700 hover:text-neel-700"
    >
      {children}
    </Link>
  );
}

function Section({
  id,
  title,
  lead,
  children,
}: {
  id?: string;
  title: string;
  lead?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id}>
      <div className="mx-auto w-full max-w-6xl px-4 py-12 lg:px-8 lg:py-20">
        <h2 className="text-[24px] leading-tight font-bold text-neel-800 lg:text-[32px]">
          {title}
        </h2>
        {lead ? (
          <p className="mt-2 max-w-2xl text-[15px] leading-[24px] text-ink-500">
            {lead}
          </p>
        ) : null}
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}

function HeroRow({
  title,
  meta,
  chip,
  late,
}: {
  title: string;
  meta: string;
  chip: React.ReactNode;
  late?: boolean;
}) {
  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-card border border-paper-200 p-3",
        late ? "border-laal-100 bg-laal-100/40" : "bg-paper-0",
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] leading-tight font-bold text-ink-900">
          {title}
        </span>
        <span className="num block text-[13px] text-ink-500">{meta}</span>
      </span>
      {chip}
    </li>
  );
}
