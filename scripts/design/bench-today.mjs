/**
 * Like-for-like server benchmark of Today (V2 vs V3). One server at a time,
 * same local stack and data, same people:
 *
 *   BASE=http://localhost:3300 LABEL=v3 node scripts/design/bench-today.mjs
 *
 * For each person: sign in (development route), 3 warm-up loads (dev
 * compiles on first hit), then 15 timed loads of the whole HTML response.
 * Prints median / p90 / min and response size; appends to
 * docs/design-v3/bench-today.json. Localhost only.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { request } from "@playwright/test";

const BASE = process.env.BASE ?? "http://localhost:3300";
const LABEL = process.env.LABEL ?? BASE;
const ROUTE = process.env.ROUTE ?? "/aaj";
if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(BASE)) throw new Error("Local only.");
const PEOPLE = (process.env.PEOPLE ?? "priya@sharma.test,rahul@sharma.test,owner@busy.test").split(",");
const RUNS = Number(process.env.RUNS ?? 15);

const q = (xs, p) => [...xs].sort((a, b) => a - b)[Math.min(xs.length - 1, Math.floor(p * xs.length))];
const results = [];
for (const email of PEOPLE) {
  const ctx = await request.newContext({ baseURL: BASE });
  const login = await ctx.post("/api/test-login", { data: { email, password: "waakya-design-pass" } });
  if (!login.ok()) {
    results.push({ label: LABEL, email, error: `login ${login.status()}` });
    continue;
  }
  for (let i = 0; i < 3; i++) await (await ctx.get(ROUTE)).body();
  const times = [];
  let bytes = 0;
  for (let i = 0; i < RUNS; i++) {
    const t0 = performance.now();
    const res = await ctx.get(ROUTE);
    const body = await res.body();
    times.push(performance.now() - t0);
    bytes = body.length;
    if (!res.ok()) throw new Error(`${email} ${ROUTE} → ${res.status()}`);
  }
  const row = {
    label: LABEL,
    route: ROUTE,
    email,
    runs: RUNS,
    medianMs: Math.round(q(times, 0.5)),
    p90Ms: Math.round(q(times, 0.9)),
    minMs: Math.round(Math.min(...times)),
    htmlKB: Math.round(bytes / 1024),
    at: new Date().toISOString(),
  };
  results.push(row);
  console.log(JSON.stringify(row));
  await ctx.dispose();
}
const file = "docs/design-v3/bench-today.json";
const all = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : [];
writeFileSync(file, JSON.stringify([...all, ...results], null, 1));
