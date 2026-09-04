"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth/session";
import { getProofStorage } from "@/lib/storage";
import {
  MAX_PROOF_BYTES,
  PROOF_TYPES,
  orgIdFromKey,
  proofKey,
} from "@/lib/storage/keys";
import { getDictionary, type Locale } from "@/lib/i18n";
import { fail, ok, uuidSchema, type ActionResult } from "@/lib/validation";

const requestSchema = z.object({
  taskId: uuidSchema,
  contentType: z.string().min(3).max(80),
  size: z.number().int().positive().max(MAX_PROOF_BYTES),
});

/**
 * Hand the browser a short-lived URL to put one file at.
 *
 * The server chooses the key, so a caller cannot write outside their own org's
 * folder, and the content type has to be one we accept — a proof is a photo or
 * a voice note, never an arbitrary upload.
 */
export async function requestProofUpload(
  input: unknown,
): Promise<ActionResult<{ key: string; url: string; headers: Record<string, string> }>> {
  const viewer = await requireOrg();
  const locale = viewer.org.language;

  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) return fail(errors(locale).tooBig);

  const type = PROOF_TYPES[parsed.data.contentType];
  if (!type) return fail(errors(locale).badType);

  const supabase = await createClient();
  // RLS would refuse a write to another org anyway; this makes the refusal a
  // sentence rather than a storage error.
  const { data: task } = await supabase
    .from("tasks")
    .select("id, org_id")
    .eq("id", parsed.data.taskId)
    .maybeSingle();
  if (!task || task.org_id !== viewer.org.id) return fail(errors(locale).notFound);

  const key = proofKey(viewer.org.id, task.id, randomUUID(), type.extension);

  try {
    const storage = getProofStorage(supabase);
    const signed = await storage.presignUpload(key, parsed.data.contentType);
    return ok({ key, url: signed.url, headers: signed.headers });
  } catch {
    return fail(errors(locale).uploadFailed);
  }
}

const attachSchema = z.object({
  taskId: uuidSchema,
  key: z.string().max(300).optional(),
  contentType: z.string().max(80).optional(),
  body: z.string().trim().max(1000).optional(),
});

/** Record a proof against a task, once it is actually in storage. */
export async function attachProof(input: unknown): Promise<ActionResult> {
  const viewer = await requireOrg();
  const locale = viewer.org.language;

  const parsed = attachSchema.safeParse(input);
  if (!parsed.success) return fail(errors(locale).generic);

  const { taskId, key, contentType, body } = parsed.data;
  if (!key && !body) return fail(errors(locale).nothingToSend);

  // A key must belong to this org, whatever the caller says.
  if (key && orgIdFromKey(key) !== viewer.org.id) {
    return fail(errors(locale).generic);
  }

  const kind = key
    ? (contentType && PROOF_TYPES[contentType]?.kind) || "photo"
    : "text";

  const supabase = await createClient();
  const { error } = await supabase.from("proofs").insert({
    task_id: taskId,
    org_id: viewer.org.id,
    kind,
    url: key ?? null,
    body: body ?? null,
    created_by: viewer.userId,
  });
  if (error) return fail(errors(locale).generic);

  revalidatePath(`/kaam/${taskId}`);
  return ok();
}

function errors(locale: Locale) {
  const shared = getDictionary(locale).common;
  const table = {
    hi: {
      badType: "सिर्फ़ फ़ोटो या आवाज़ भेज सकते हैं।",
      tooBig: "फ़ाइल बहुत बड़ी है। छोटी फ़ोटो भेजिए।",
      notFound: "यह काम नहीं मिला।",
      uploadFailed: "अपलोड नहीं हुआ। फिर से भेजें।",
      nothingToSend: "फ़ोटो लीजिए या कुछ लिखिए।",
      generic: `${shared.somethingWentWrong}। ${shared.tryAgain}।`,
    },
    "hi-Latn": {
      badType: "Sirf photo ya awaaz bhej sakte hain.",
      tooBig: "File bahut badi hai. Chhoti photo bhejiye.",
      notFound: "Yeh kaam nahi mila.",
      uploadFailed: "Upload nahi hua. Phir se bhejein.",
      nothingToSend: "Photo lijiye ya kuch likhiye.",
      generic: `${shared.somethingWentWrong}. ${shared.tryAgain}.`,
    },
    en: {
      badType: "Only a photo or a voice note can be sent.",
      tooBig: "That file is too large. Send a smaller photo.",
      notFound: "That task was not found.",
      uploadFailed: "The upload did not go through. Send it again.",
      nothingToSend: "Take a photo or write something.",
      generic: `${shared.somethingWentWrong}. ${shared.tryAgain}.`,
    },
  } as const;
  return table[locale];
}
