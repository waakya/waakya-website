import "server-only";

import { S3Client } from "@aws-sdk/client-s3";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

/**
 * Where proof photos live.
 *
 * Cloudflare R2 is the intended home: 10 GB and no egress charge, against
 * Supabase Storage's 1 GB (STACK.md). Both are private — a file is only ever
 * reached through a short-lived signed URL — so which one is in use is an
 * environment question, not a design one, and the caller never knows.
 */
export interface ProofStorage {
  readonly driver: "r2" | "supabase";
  /** A URL the browser can PUT the file straight to. */
  presignUpload(
    key: string,
    contentType: string,
  ): Promise<{ url: string; headers: Record<string, string> }>;
  /** A short-lived URL for looking at it. */
  presignDownload(key: string, seconds?: number): Promise<string | null>;
}

/** How long a link to a proof stays alive. Long enough to look, not to share. */
export const PROOF_URL_TTL_SECONDS = 300;

export function storageDriverName(): "r2" | "supabase" {
  return r2Config() ? "r2" : "supabase";
}

/**
 * The Supabase client is only used by the fallback driver, but it is always
 * required so the caller does not have to know which driver it will get.
 */
export function getProofStorage(
  supabase: SupabaseClient<Database>,
): ProofStorage {
  const config = r2Config();
  return config ? r2Storage(config) : supabaseStorage(supabase);
}

interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}

function r2Config(): R2Config | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) return null;
  return { accountId, accessKeyId, secretAccessKey, bucket };
}

function r2Storage(config: R2Config): ProofStorage {
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  return {
    driver: "r2",
    async presignUpload(key, contentType) {
      const url = await getSignedUrl(
        client,
        new PutObjectCommand({
          Bucket: config.bucket,
          Key: key,
          ContentType: contentType,
        }),
        { expiresIn: 60 },
      );
      return { url, headers: { "content-type": contentType } };
    },
    async presignDownload(key, seconds = PROOF_URL_TTL_SECONDS) {
      return getSignedUrl(
        client,
        new GetObjectCommand({ Bucket: config.bucket, Key: key }),
        { expiresIn: seconds },
      );
    },
  };
}

/**
 * The fallback. The bucket is private and its policies scope every read and
 * write to membership of the org named in the key, so this is correct — it
 * just has a 1 GB ceiling, which is why R2 is the destination.
 */
function supabaseStorage(supabase: SupabaseClient<Database>): ProofStorage {
  const bucket = "proofs";

  return {
    driver: "supabase",
    async presignUpload(key, contentType) {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUploadUrl(key);
      if (error || !data) throw new Error("upload_url_failed");
      return {
        // Supabase signs the token into the URL; the browser PUTs to it.
        url: data.signedUrl,
        headers: { "content-type": contentType },
      };
    },
    async presignDownload(key, seconds = PROOF_URL_TTL_SECONDS) {
      const { data } = await supabase.storage
        .from(bucket)
        .createSignedUrl(key, seconds);
      return data?.signedUrl ?? null;
    },
  };
}
