/**
 * Custom-domain rules that need no network: what a hostname may look like,
 * which hosts are Waakya's own, and how the verification record reads.
 * Pure, unit-tested.
 */
export const HOSTNAME = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/;

export function normalizeHostname(input: string): string | null {
  const host = input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/:\d+$/, "");
  if (host.length > 253 || !HOSTNAME.test(host)) return null;
  if (host.endsWith(".waakya.com") || host === "waakya.com") return null;
  return host;
}

/** The TXT record name and value the business adds at its DNS provider. */
export function verificationRecord(hostname: string, token: string): { name: string; value: string } {
  return { name: `_waakya-verify.${hostname}`, value: `waakya-verify=${token}` };
}

/** Does any TXT answer carry the expected token? DNS providers may split or quote values. */
export function txtSatisfies(answers: readonly string[][], token: string): boolean {
  const expected = `waakya-verify=${token}`;
  return answers.some((chunks) => chunks.join("").trim().replace(/^"|"$/g, "") === expected);
}

/** Hosts the platform itself answers on, which never resolve to a tenant. */
export function isPlatformHost(host: string, siteUrl: string): boolean {
  const own = (() => {
    try {
      return new URL(siteUrl).hostname.toLowerCase();
    } catch {
      return "";
    }
  })();
  const h = host.toLowerCase().replace(/:\d+$/, "");
  return h === own || h === `www.${own}` || h === "localhost" || h === "127.0.0.1" || h.endsWith(".vercel.app") || h.endsWith(".localhost");
}
