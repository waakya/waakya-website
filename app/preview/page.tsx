import type { Metadata } from "next";
import {
  AlertTriangle,
  Bell,
  Camera,
  Check,
  CheckCheck,
  Clock,
  Eye,
  EyeOff,
  Image as ImageIcon,
  List,
  Mic,
  Phone,
  Play,
  RefreshCw,
  Send,
  Shield,
  Users,
  X,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { StateChip } from "@/components/ui/state-chip";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar } from "@/components/ui/avatar";
import { Mark } from "@/components/vaakya/mark";
import { NayaDot } from "@/components/vaakya/naya-dot";
import { Ticks, type TicksState } from "@/components/vaakya/ticks";
import { PreviewInteractive } from "./preview-interactive";
import { LOCALES, getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Style tile",
  robots: { index: false, follow: false },
};

const TICK_STATES: TicksState[] = [
  "sent",
  "seen",
  "accepted",
  "done",
  "verified",
];

export default async function PreviewPage() {
  const locale = await getLocale();
  const t = getDictionary(locale);

  return (
    <main className="mx-auto max-w-3xl p-4 pb-16">
      <header className="mb-5 flex items-center gap-2">
        <Mark size={28} />
        <h1 className="font-display text-[28px] leading-none font-extrabold text-neel-800">
          Style tile
        </h1>
        <p className="ml-2 text-[13px] text-ink-500">
          Vaakya primitives, kit tokens
        </p>
      </header>

      <div className="grid gap-3">
        <Section title="Buttons" note="One primary per screen. Staff primary is 60px.">
          <div className="flex flex-col gap-3">
            <Button size="staffPrimary">
              <Check strokeWidth={3} />
              {t.actions.dekhLiyaHoJayega}
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button>
                <Send />
                {t.actions.bhejo}
              </Button>
              <Button variant="secondary">
                <Bell />
                {t.actions.yaadDilao}
              </Button>
              <Button variant="outline">
                <Eye />
                {t.actions.dekhein}
              </Button>
              <Button variant="ghost">
                <Mic />
                Phir se bolo
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="danger">
                <X />
                Cancel karo
              </Button>
              <Button variant="dangerSolid">
                <Zap />
                Urgent
              </Button>
              <Button disabled>OTP bhejo</Button>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[13px] text-ink-500">
              <span>Sizes:</span>
              <Button size="sm" variant="outline">
                sm 40
              </Button>
              <Button size="owner" variant="outline">
                owner 48
              </Button>
              <Button size="staff" variant="outline">
                staff 56
              </Button>
            </div>
          </div>
        </Section>

        <Section
          title="The Vaakya ticks"
          note="The normal path, as a glyph you learn once. Haldi is the done tick and nothing else."
        >
          <div className="rounded-card bg-paper-100 p-4">
            <ul className="flex flex-wrap items-end gap-6">
              {TICK_STATES.map((state) => (
                <li key={state} className="flex flex-col items-center gap-2">
                  <Ticks state={state} locale={locale} size={22} />
                  <span className="text-[13px] font-semibold text-ink-700">
                    {t.ticks[state]}
                  </span>
                  <span className="text-[11px] text-ink-400">{state}</span>
                </li>
              ))}
              <li className="flex flex-col items-center gap-2">
                <Ticks state="verified" locale={locale} size={22} animate />
                <span className="text-[13px] font-semibold text-ink-700">
                  {t.ticks.verified}
                </span>
                <span className="text-[11px] text-ink-400">draws on</span>
              </li>
            </ul>
          </div>
          <p className="mt-3 text-[13px] leading-[20px] text-ink-500">
            Grey bars: sent. Neel bars: seen. Grey tick: committed. Haldi tick:
            done, waiting for you. Green: verified. The glyph shows the normal
            path only — exceptions take its place as a chip.
          </p>
          <div className="mt-4">
            <p className="mb-2 text-[13px] font-semibold text-ink-700">
              The same glyph in all three scripts (the accessible name changes):
            </p>
            <ul className="flex flex-wrap gap-4">
              {LOCALES.map((l) => (
                <li key={l} className="flex items-center gap-2">
                  <Ticks state="done" locale={l} size={20} />
                  <span className="text-[13px] text-ink-700">
                    {getDictionary(l).ticks.done}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Section>

        <Section
          title="Chips"
          note="Exceptions and facts, always a word plus an icon. Never Haldi."
        >
          <div className="flex flex-wrap gap-2">
            <StateChip tone="amber" icon={<EyeOff />}>
              {t.chips.dekhaNahi}
            </StateChip>
            <StateChip tone="laal" icon={<Clock />}>
              {t.chips.lateBy("40 min")}
            </StateChip>
            <StateChip tone="laalSolid" icon={<Zap />}>
              {t.chips.urgent}
            </StateChip>
            <StateChip tone="amber" icon={<AlertTriangle />}>
              {t.chips.dikkat}
            </StateChip>
            <StateChip tone="outline" icon={<Clock />}>
              {t.chips.samayMaanga}
            </StateChip>
            <StateChip tone="outline" icon={<Camera />}>
              {t.chips.photoChahiye}
            </StateChip>
            <StateChip tone="neel" icon={<Eye />}>
              {t.chips.verifyBaaki}
            </StateChip>
            <StateChip tone="muted" icon={<X />}>
              {t.chips.cancelled}
            </StateChip>
            <StateChip tone="amber" icon={<Bell />}>
              {t.chips.escalated}
            </StateChip>
            <StateChip tone="muted" icon={<RefreshCw />}>
              {t.chips.reassigned}
            </StateChip>
            <StateChip tone="neelSolid" icon={<Clock />}>
              Aaj 5:00 pm
            </StateChip>
            <StateChip tone="outline">1 ghanta</StateChip>
            <StateChip tone="hara" icon={<CheckCheck />}>
              {t.ticks.verified}
            </StateChip>
          </div>
        </Section>

        <Section title="Cards and rows" note="Needs-you card with inline actions; task row with the glyph.">
          <div className="flex flex-col gap-2.5">
            <Card className="p-3.5">
              <div className="flex gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-tile bg-amber-100 text-amber-700">
                  <EyeOff className="size-6" />
                </span>
                <div className="min-w-0">
                  <p className="text-[17px] leading-[24px] font-bold text-ink-900">
                    Raju ne &lsquo;Sector 62 photos&rsquo; abhi tak nahi dekha
                  </p>
                  <p className="num mt-1 text-[13px] text-ink-500">
                    Bheja 10:02 · 25 min ho gaye · {t.chips.urgent}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm">
                  <Phone />
                  {t.actions.call}
                </Button>
                <Button size="sm" variant="secondary">
                  <Bell />
                  {t.actions.yaadDilao}
                </Button>
              </div>
            </Card>

            <Card className="flex min-h-16 items-center gap-3 p-3.5 shadow-none">
              <Avatar name="Raju" size={40} />
              <div className="min-w-0 flex-1">
                <p className="text-[15px] leading-[20px] font-bold text-ink-900">
                  Sector 62 3BHK ki photos
                </p>
                <p className="num text-[13px] text-ink-500">
                  Raju · {t.ticks.seen} · {t.time.tak("5:00 pm")}
                </p>
              </div>
              <Ticks state="seen" locale={locale} />
            </Card>

            <Card className="flex min-h-16 items-center gap-3 border-neel-200 bg-neel-50 p-3.5 shadow-none">
              <NayaDot />
              <div className="min-w-0 flex-1">
                <p className="text-[15px] leading-[20px] font-bold text-ink-900">
                  Godown stock count
                </p>
                <p className="num text-[13px] text-ink-500">
                  Amit · {t.chips.naya} · {t.time.tak("11:00")}
                </p>
              </div>
              <StateChip tone="laal" icon={<Clock />}>
                {t.chips.lateBy("40 min")}
              </StateChip>
            </Card>
          </div>
        </Section>

        <Section title="Inputs" note="One toggle style, one checkbox style, six OTP boxes.">
          <PreviewInteractive
            proofLabel={t.chips.photoChahiye}
            consentLabel="Main Vaakya ki Privacy Policy se sehmat hoon."
            priorityLabels={[t.priority.normal, t.priority.urgent]}
            sheetTitle="Ho gaya? Proof bhejein"
            sheetPrimary={t.actions.bhejenHoGaya}
            undoLabel={t.actions.undo}
          />
          <div className="mt-4 grid gap-2">
            <Label htmlFor="preview-email">Email</Label>
            <Input id="preview-email" type="email" placeholder="naam@example.com" />
          </div>
        </Section>

        <Section title="Icons and scale" note="Lucide, 2px stroke, on a 24 grid.">
          <ul className="flex flex-wrap gap-4 text-ink-700">
            {[
              [<Mic key="i" />, "mic"],
              [<Phone key="i" />, "phone"],
              [<Bell key="i" />, "bell"],
              [<Check key="i" />, "check"],
              [<CheckCheck key="i" />, "check-check"],
              [<Clock key="i" />, "clock"],
              [<EyeOff key="i" />, "eye-off"],
              [<Eye key="i" />, "eye"],
              [<Camera key="i" />, "camera"],
              [<RefreshCw key="i" />, "swap"],
              [<Send key="i" />, "send"],
              [<Play key="i" />, "play"],
              [<AlertTriangle key="i" />, "alert"],
              [<Users key="i" />, "users"],
              [<Shield key="i" />, "shield"],
              [<Zap key="i" />, "zap"],
              [<List key="i" />, "list"],
              [<ImageIcon key="i" />, "image"],
              [<X key="i" />, "x"],
            ].map(([icon, name]) => (
              <li key={String(name)} className="flex w-16 flex-col items-center gap-1">
                <span className="[&_svg]:size-6">{icon as React.ReactNode}</span>
                <span className="text-[11px] text-ink-400">{name as string}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 grid gap-1 text-[13px] text-ink-700">
            <div>
              <dt className="inline font-semibold">Radius </dt>
              <dd className="num inline text-ink-500">
                card 12 · button 14 · chip 999 · sheet 24 · tile 12
              </dd>
            </div>
            <div>
              <dt className="inline font-semibold">Space </dt>
              <dd className="num inline text-ink-500">
                4 grid · screen padding 16 · card padding 14-16 · row min-height 64
                (owner) 72 (staff)
              </dd>
            </div>
            <div>
              <dt className="inline font-semibold">Targets </dt>
              <dd className="num inline text-ink-500">
                48 owner · 56-60 staff primary · icons 24 on a 44 hit area
              </dd>
            </div>
          </dl>
        </Section>

        <Section title="Type" note="Baloo 2 display only; Inter and Noto Sans Devanagari do the work.">
          <p className="font-display num text-[40px] leading-none font-extrabold text-neel-800">
            8 7 5 4
          </p>
          <p className="mt-2 text-[24px] leading-[30px] font-bold">
            Screen title / task title
          </p>
          <p className="mt-2 text-[17px] leading-[24px] font-semibold">
            Staff body 17/24 — सेक्टर 62 वाले 3BHK की फ़ोटो ले आओ
          </p>
          <p className="mt-2 text-[15px] leading-[20px]">
            Owner body 15/20 — Sector 62 wale 3BHK ki photo le aao
          </p>
          <p className="num mt-2 text-[13px] leading-[18px] text-ink-500">
            Meta 13/18 · 10:02 · 5:00 pm · 40 min
          </p>
        </Section>
      </div>
    </main>
  );
}

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-4">
      <h2 className="text-[20px] leading-[26px] font-bold text-ink-900">
        {title}
      </h2>
      <p className="mt-0.5 mb-3 text-[13px] leading-[18px] text-ink-500">{note}</p>
      {children}
    </Card>
  );
}
