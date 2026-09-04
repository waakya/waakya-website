# Blockers — things only the owner can provide

Each item is skipped rather than faked, and everything around it keeps
building. Nothing here stops the rest of the run.

| # | Blocked on | Needed for | What happens meanwhile |
|---|---|---|---|
| B1 | `SUPABASE_SERVICE_ROLE_KEY` | Two things: the SLA/escalation job across every org, **and `npm run dev:login`**, which is the way to sign in without an inbox. Dashboard → Project Settings → API keys → `service_role` → Reveal. | `createAdminClient()` returns `null` and the SLA route says so rather than crashing; an owner can still run a tick for their own business. `dev:login` prints exactly where to get the key. |
| B2 | `RESEND_API_KEY` (+ a verified sender) | Real email notifications. | `notify()` still writes the in-app notification row and logs the email it would have sent. Wiring is complete; only delivery is off. |
| B3 | Cloudflare R2 credentials (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`) | Proof photos in the intended production bucket. | **Built and working** on a private Supabase Storage bucket (`proofs`), scoped by org membership of the key's first path segment. Setting the three R2 variables switches driver with no code change — `storageDriverName()` reports which is live. The Supabase ceiling is 1 GB, which is the only reason to move. |
| B4 | Real inbox delivery for email OTP | Signing in as a human, end to end. | Supabase's built-in mailer sends the code (a few per hour). The e2e cannot wait on an inbox, so it uses the dev-only `/api/test-login` against the two seeded users in `supabase/seed-e2e.sql`. |
| B6 | `CRON_SECRET` + a deployed URL | Running the SLA job on a schedule for every business. Generate with `openssl rand -hex 32`, set it in Vercel and in the Edge Function's secrets. | The job is complete and tested. A signed-in owner can run a tick for their own business from the inbox ("Abhi jaanchein"), which is how the e2e exercises it. |
| B5 | MSG91 account + DLT registration | Phone OTP, the eventual real sign-in. Out of v1 scope by design (STACK.md). | Email OTP ships. `activeAuthProvider()` in `lib/auth/provider.ts` is the single swap point. |

## Signing in right now

Until B2 lands there is no inbox, so the OTP code has nowhere to arrive.

```bash
# once: paste SUPABASE_SERVICE_ROLE_KEY into .env.local
npm run dev:login                       # owner@vaakya.test
npm run dev:login -- staff@vaakya.test
```

It prints a URL. Paste it into the browser and you are signed in. The link is
single-use and expires; it goes through the app's own `/auth/confirm` route so
the session lands in cookies, which a link straight to Supabase would not do.

## Notes

- **B4 detail.** Supabase's built-in SMTP is rate-limited to a handful of
  messages per hour and is not for production. Point Supabase at Resend as a
  custom SMTP provider once B2 lands, and the same OTP screen becomes
  production-ready with no code change.
- **`ALLOW_TEST_LOGIN` must never be set in Vercel.** `/api/test-login` also
  refuses to exist when `NODE_ENV=production`, so both guards must fail before
  it is reachable.
