/**
 * Where to land after sign-in, when the request names somewhere.
 *
 * Same-site paths only. An open redirect on a sign-in route would turn a
 * login link into a way to land someone on another site already
 * authenticated, so anything that is not a plain path on this site is
 * dropped: absolute URLs, protocol-relative `//host`, and `/\host`, which
 * some browsers read as a host.
 */
export function safeNextPath(next: unknown): string | null {
  if (typeof next !== "string") return null;
  if (next.length > 512) return null;
  return /^\/[^/\\]/.test(next) || next === "/" ? next : null;
}
