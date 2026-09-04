import { z } from "zod";
import { LOCALES } from "@/lib/i18n";

/** Shared field schemas, so one rule is written once. */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(254)
  .email();

export const otpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "OTP is six digits");

/** E.164 for India, entered as ten digits. Used when phone OTP lands. */
export const indianPhoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s-]/g, ""))
  .pipe(z.string().regex(/^(?:\+91)?[6-9]\d{9}$/, "Enter a 10-digit number"));

export const localeSchema = z.enum(LOCALES);

export const uuidSchema = z.string().uuid();

/**
 * Every server action returns this shape. `message` is already in the user's
 * language and says what to do next — it is never an internal error string.
 */
export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; message: string; field?: string };

export function ok(): ActionResult<undefined>;
export function ok<T>(data: T): ActionResult<T>;
export function ok<T>(data?: T): ActionResult<T | undefined> {
  return { ok: true, data };
}

export function fail(message: string, field?: string): ActionResult<never> {
  return { ok: false, message, field };
}
