import { Camera, FileText, Volume2 } from "lucide-react";

import { getDictionary, type Locale } from "@/lib/i18n";
import { formatTime } from "@/lib/tasks/time";
import type { ProofItem } from "@/lib/tasks/proofs";

/**
 * What was actually sent, so "ho gaya" is a fact rather than a claim.
 *
 * Each link is signed and short-lived; the object key never reaches the
 * browser, so a proof cannot be shared by copying a URL out of the page for
 * longer than a few minutes.
 */
export function ProofList({
  locale,
  proofs,
}: {
  locale: Locale;
  proofs: ProofItem[];
}) {
  const t = getDictionary(locale);
  if (proofs.length === 0) return null;

  return (
    <section className="mt-6">
      <h3 className="mb-2 flex items-center gap-1.5 text-[13px] leading-[18px] font-semibold text-ink-700">
        <Camera className="size-4" aria-hidden="true" />
        {t.proof.heading}
      </h3>

      <ul className="flex flex-col gap-2">
        {proofs.map((proof) => (
          <li
            key={proof.id}
            className="rounded-card border border-paper-200 bg-paper-0 p-3"
          >
            {proof.url && proof.kind === "photo" ? (
              /* eslint-disable-next-line @next/next/no-img-element --
                 a short-lived signed URL, which next/image cannot optimise
                 and should not cache. */
              <img
                src={proof.url}
                alt={t.proof.photoAlt(proof.byName)}
                className="max-h-64 w-full rounded-[8px] object-cover"
              />
            ) : null}

            {proof.url && proof.kind === "voice" ? (
              <span className="flex items-center gap-2 text-[15px] text-ink-900">
                <Volume2 className="size-5 text-neel-600" aria-hidden="true" />
                <audio controls src={proof.url} className="w-full">
                  {t.proof.voiceNote}
                </audio>
              </span>
            ) : null}

            {proof.body ? (
              <p className="flex items-start gap-2 text-[15px] leading-[20px] text-ink-900">
                <FileText
                  className="mt-0.5 size-4 shrink-0 text-ink-400"
                  aria-hidden="true"
                />
                {proof.body}
              </p>
            ) : null}

            <p className="num mt-1.5 text-[13px] text-ink-500">
              {t.proof.byAt(proof.byName, formatTime(proof.at))}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
