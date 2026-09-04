"use client";

import * as React from "react";
import { Camera, Check, Pencil, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { getDictionary, type Locale } from "@/lib/i18n";
import { MAX_PROOF_BYTES, PROOF_TYPES } from "@/lib/storage/keys";
import { attachProof, requestProofUpload } from "@/lib/actions/proofs";
import { cn } from "@/lib/utils";

interface Picked {
  id: string;
  file: File;
  preview: string;
}

/**
 * The proof sheet (screens/Proof.png): the camera tile first, thumbnails as
 * they are taken, writing as the alternative, one primary — and the line that
 * says the proof is on record.
 *
 * Files go straight from the phone to storage through a short-lived URL the
 * server signs; they never pass through the app. Voice notes are accepted as
 * an *upload*, which is not voice input — v1 has none.
 */
export function ProofSheet({
  open,
  onOpenChange,
  locale,
  taskId,
  ownerName,
  required,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: Locale;
  taskId: string;
  ownerName: string;
  /** When the owner asked for a photo, finishing without one is not offered. */
  required: boolean;
  /** Called once the proof is stored, to mark the task done. */
  onDone: () => void;
}) {
  const t = getDictionary(locale);
  const [picked, setPicked] = React.useState<Picked[]>([]);
  const [note, setNote] = React.useState("");
  const [writing, setWriting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  function pick(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    const next: Picked[] = [];
    for (const file of Array.from(files)) {
      if (!PROOF_TYPES[file.type]) {
        setError(t.common.somethingWentWrong);
        continue;
      }
      if (file.size > MAX_PROOF_BYTES) {
        setError(t.common.somethingWentWrong);
        continue;
      }
      next.push({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        file,
        preview: URL.createObjectURL(file),
      });
    }
    setPicked((current) => [...current, ...next]);
  }

  async function send() {
    setError(null);
    setBusy(true);
    try {
      for (const item of picked) {
        const signed = await requestProofUpload({
          taskId,
          contentType: item.file.type,
          size: item.file.size,
        });
        if (!signed.ok) {
          setError(signed.message);
          return;
        }

        const put = await fetch(signed.data.url, {
          method: "PUT",
          headers: signed.data.headers,
          body: item.file,
        });
        if (!put.ok) {
          setError(t.actions.retry);
          return;
        }

        const attached = await attachProof({
          taskId,
          key: signed.data.key,
          contentType: item.file.type,
        });
        if (!attached.ok) {
          setError(attached.message);
          return;
        }
      }

      if (note.trim()) {
        const attached = await attachProof({ taskId, body: note.trim() });
        if (!attached.ok) {
          setError(attached.message);
          return;
        }
      }

      for (const item of picked) URL.revokeObjectURL(item.preview);
      setPicked([]);
      setNote("");
      onDone();
    } finally {
      setBusy(false);
    }
  }

  const hasSomething = picked.length > 0 || note.trim().length > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetTitle>{t.proof.title}</SheetTitle>
        <SheetDescription>{t.proof.help(ownerName)}</SheetDescription>

        <div className="mt-4 flex items-center gap-3 overflow-x-auto pb-1">
          <label
            className={cn(
              "flex size-24 shrink-0 cursor-pointer flex-col items-center justify-center gap-1",
              "rounded-card border-2 border-dashed border-neel-300 bg-neel-50 text-neel-700",
            )}
          >
            <Camera className="size-7" aria-hidden="true" />
            <span className="text-[13px] font-semibold">{t.proof.takePhoto}</span>
            <input
              type="file"
              accept="image/*,audio/*"
              capture="environment"
              multiple
              className="sr-only"
              onChange={(event) => pick(event.target.files)}
            />
          </label>

          {picked.map((item) => (
            <span key={item.id} className="relative size-24 shrink-0">
              {item.file.type.startsWith("audio/") ? (
                <span className="flex size-24 items-center justify-center rounded-card bg-paper-200 text-[13px] font-semibold text-ink-700">
                  {t.proof.voiceNote}
                </span>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element --
                   a local object URL, not a served asset. */
                <img
                  src={item.preview}
                  alt=""
                  className="size-24 rounded-card object-cover"
                />
              )}
              <span className="absolute -top-1.5 -right-1.5 flex size-6 items-center justify-center rounded-full bg-hara-600 text-white">
                <Check className="size-4" strokeWidth={3} aria-hidden="true" />
              </span>
            </span>
          ))}

          {picked.length > 0 ? (
            <span className="num shrink-0 text-[15px] text-ink-500">
              {t.proof.photoCount(picked.length)}
            </span>
          ) : null}
        </div>

        {writing ? (
          <textarea
            autoFocus
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={t.proof.writePlaceholder}
            aria-label={t.proof.write}
            className="mt-3 w-full rounded-button border-2 border-paper-200 bg-paper-0 p-3 text-[17px] text-ink-900 outline-none placeholder:text-ink-400 focus:border-neel-600"
          />
        ) : (
          <Button
            variant="outline"
            size="staff"
            className="mt-3 w-full"
            onClick={() => setWriting(true)}
          >
            <Pencil />
            {t.proof.write}
          </Button>
        )}

        {error ? (
          <p
            role="alert"
            className="mt-3 rounded-card bg-laal-100 px-3 py-2 text-[15px] leading-[20px] text-laal-700"
          >
            {error}
          </p>
        ) : null}

        <Button
          size="staffPrimary"
          className="mt-4"
          disabled={busy || (required && !hasSomething)}
          onClick={send}
        >
          <Send />
          {busy ? t.proof.uploading : t.proof.send}
        </Button>

        {!required ? (
          <Button
            variant="ghost"
            className="mt-2 w-full"
            disabled={busy}
            onClick={onDone}
          >
            {t.proof.skip}
          </Button>
        ) : null}

        <p className="mt-3 text-center text-[13px] text-ink-400">
          {t.proof.onRecord}
        </p>
      </SheetContent>
    </Sheet>
  );
}
