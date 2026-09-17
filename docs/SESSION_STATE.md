# Waakya — session state (17 Sep 2026)

## Production
- https://waakya.com → Vercel project `waakya` (team_Um3La59sNDmURuG1DZVbS4Y3), deployment `waakya-bj3ni5c5u`, commit `3032dcf`.
- Supabase production: `krdmzjjmbrphzcuotfgz` (migrations 0001–0020). `uobhyxelmdissxsdzznq` is a frozen archive: never migrate, modify or delete.
- Deploy: `git archive <commit>` into a clean folder, copy `.vercel/project.json`, run `npx vercel deploy --prod --yes --scope team_Um3La59sNDmURuG1DZVbS4Y3`.
- Fast working copy: `/private/tmp/wk-build` (the iCloud Desktop repo is slow). Sync back with rsync, excluding node_modules/.next/.git/.vercel/supabase/.temp/.env*.
- Tokens: `../.env.tokens` and `.env.local`. Never print them.

## Verification assets
- Local: `npm run lint`, `npx vitest run` (231), `npx playwright test` (68, uses `next dev` + ALLOW_TEST_LOGIN locally only).
- Production: `npx playwright test -c playwright.prod.config.ts` (10 checks: creates QA users via admin API and a "QA Cutover <run>" business).
- To sign a persona into waakya.com in a browser tool: create a QA user via the admin API, sign in with a password through @supabase/ssr, and set the `sb-krdmzjjmbrphzcuotfgz-auth-token` cookies plus `waakya_lang=en` on waakya.com.

## MCP tooling (verified 17 Sep)
- `playwright` (@playwright/mcp, user scope): navigate and snapshot on waakya.com work.
- `chrome-devtools` (chrome-devtools-mcp, user scope): console and network inspection work (0 errors, 0 failed requests on /).
- Figma: claude.ai connector, `whoami` works. No Waakya Figma file has been shared yet.

## Current brief (UX/positioning phase), in order
1. Multi-agent audit on REAL production (owner + team member, desktop + 390px) with agents A–G: owner, product UX, visual design, marketing/copy, mobile, browser quality, discoverability.
2. Write `docs/WAAKYA_BUSINESS_UX_AUDIT.md` (P0/P1/P2; each issue: PAGE, PERSONA, PROBLEM, WHY IT MATTERS, SCREENSHOT/OBSERVATION, PROPOSED FIX) and `docs/WAAKYA_CUSTOMER_JOURNEY_AUDIT.md` (visitor, new owner, daily owner, employee, mobile).
3. Then autonomously: prioritize → redesign → implement → test → visual QA → build → deploy → re-audit production with the MCPs.
- Positioning: "THE NEW ERA OF BUSINESS COMMUNICATION." / "ALL YOUR BUSINESS WORK. ONE WORKSPACE." Story: Conversation → Commitment → Execution → Proof → Record; loop: Talk → Assign → Execute → Prove. Show the Phase-1 ecosystem (Conversations, Work, Projects, Documents, Templates, Attendance, Leave, Holidays, Approvals, Team, Search, Notifications) working together, not as a wall of feature cards.
- Visual language: Baloo 2 headings, Inter UI, warm ivory, royal blue, deep navy, restrained yellow, thin blue-grey borders, subtle shadows, line-art illustrations, sparing handwritten annotations. Avoid generic AI SaaS looks, gradients, glassmorphism, card/pill overload, Trello/ERP/WhatsApp-clone looks.
- No new functionality outside Phase 1.
