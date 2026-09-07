# Waakya — GitHub + Deploy to waakya.com (do-this checklist)

Your git repo is this `app/` folder. `.env.local` is gitignored — keep it that way.
One thing to know up front: the **no-login dev bypass only works locally** (it's refused in production
by design). On the live site you log in for real with email OTP — so you'll use your own real email to
get a code. That's why Resend (or Supabase's built-in mailer) matters for the deploy.

## 1. Push to GitHub
1. Create a new **private** repo on github.com (e.g. `waakya`), empty (no README).
2. In Cursor's terminal:
   ```bash
   cd ~/Desktop/waakya/app
   git add -A && git commit -m "chore: pre-deploy" || true
   git branch -M main
   git remote add origin https://github.com/<you>/waakya.git
   git push -u origin main
   ```
   (Or use Cursor's Source Control panel / GitHub Desktop.)
3. Confirm on GitHub that **no `.env.local`** was pushed (only `.env.example`).

## 2. Get the production keys (~20 min)
4. **Supabase** → Project Settings → API keys → copy `service_role` (this is `SUPABASE_SERVICE_ROLE_KEY`).
5. **Resend** → create account → API Keys → copy key. To start you can send from `onboarding@resend.dev`;
   verify your own domain later for `no-reply@waakya.com`.
6. **Cloudflare R2** (optional now — app falls back to Supabase storage) → create bucket `waakya-proofs`
   → create an R2 API token → gives `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`.
7. Generate the cron secret:
   ```bash
   openssl rand -hex 32
   ```
   Save it as `CRON_SECRET`.

## 3. Deploy to Vercel
8. vercel.com → **Add New → Project** → import your GitHub repo. Framework: Next.js (auto).
9. In the project's **Environment Variables**, add (Production):
   ```
   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, RESEND_FROM
   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET   (skip if not using R2 yet)
   CRON_SECRET
   NEXT_PUBLIC_SITE_URL = https://waakya.com
   ```
   **Do NOT add `ALLOW_TEST_LOGIN` or `DEV_DISABLE_AUTH`** — those are local-only and must never be in Vercel.
10. Deploy. Confirm the build succeeds and the `*.vercel.app` URL loads.

## 4. Wire the backend for production
11. **Supabase → Authentication → SMTP:** point it at **Resend** (built-in mailer is a few emails/hour,
    not for production). Also set **Site URL** and redirect URLs to `https://waakya.com`.
12. **SLA job:** done by migration `0014_sla_schedule.sql` (pg_cron + pg_net, every 5 min). The two Vault
    secrets `sla_tick_url` and `cron_secret` are set on the project; rotate `CRON_SECRET` in both places
    together. (Vercel Cron is Hobby-limited to once a day; on Pro a `vercel.json` cron can replace this.)
13. Turn on **leaked-password protection** in Supabase Auth (linter flags it; costs nothing).

## 5. Point waakya.com at Vercel
14. Vercel → project → **Domains** → add `waakya.com` (and `www.waakya.com`).
15. At your domain registrar, add the DNS records Vercel shows (usually an `A` record to Vercel's IP and a
    `CNAME` for `www`). Wait for SSL to go green.
16. Confirm `https://waakya.com` loads the landing page.

## 6. Verify on the live site
17. Sign in with **your real email** → you get an OTP → land on the dashboard.
18. Run the core loop: create a task → (as staff) Dekh liya → Ho jayega → Ho gaya → (as owner) Verify.
19. Upload a proof photo; check it stores (Supabase bucket, or R2 if configured).
20. Trigger one SLA tick and confirm a reminder/escalation appears.
21. Before real customers: **delete the three `@waakya.test` users + the demo org** from production.

## 7. Before you charge anyone (not yet, but note it)
22. Move **Vercel → Pro** ($20/mo) — Hobby forbids commercial use.
23. Move **Supabase → Pro** ($25/mo) — free tier has no backups and pauses after 7 days idle.
24. Then: MSG91 + DLT for phone OTP, the real-device pass, and the WhatsApp/digest growth loop.

## Not blocking, but pending
- "Aapke liye" shows 5 of many — add paging before pilots see a full day.
