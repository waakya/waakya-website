# F — Browser quality audit (logged-out surfaces)

Auditor: Agent F. Date: 2026-09-17. Target: https://waakya.com (prod, Vercel bom1).
Tools: Chrome DevTools MCP (performance trace, Lighthouse, console, network, a11y snapshot, evaluate_script) plus `curl -D -` for response headers.
Mobile emulation: 390x844 DPR 2, mobile+touch, 4x CPU, Fast 4G. Desktop: 1440x900, no throttling.
Scope: `/`, `/login`, `/demo`, `/privacy`, `/join/<dummy token>`, `/aaj` redirect, `/does-not-exist`. No sign-in, no forms submitted, no consent boxes ticked.
Note: traces ran after one earlier load, so TTFB in traces (25–34 ms) reflects a warm connection. Cold `curl` TTFB is listed separately in the Measurements table.

## P0

No P0 issues measured. Every logged-out page loads, nothing crashes, the console has no errors, and no request fails. The authenticated captures are also free of errors (see the last section).

## P1

### No security headers besides HSTS (no CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy, X-Content-Type-Options)
- PAGE: All documents (`/`, `/login`, `/demo`, `/privacy`, `/join/*`, 404, `/aaj` 307)
- PERSONA: Everyone. The main risk is to owners and staff signing in on `/login` and `/join/*`.
- PROBLEM: The response headers on every document are only `strict-transport-security: max-age=63072000`, `cache-control`, `x-powered-by: Next.js` and Vercel ids. There is no `Content-Security-Policy`, no `X-Frame-Options` or `frame-ancestors`, no `Referrer-Policy`, no `Permissions-Policy` and no `X-Content-Type-Options: nosniff`. HSTS also lacks `includeSubDomains; preload`.
- WHY IT MATTERS: Another site can put `/login` (Google sign-in, email OTP) and `/join/<token>` in an iframe, which enables clickjacking. Without a CSP, any XSS in user-written content (task titles, messages) has no second line of defence. Without a Referrer-Policy, the browser uses its default. For `/join/<token>` URLs, only the origin should ever leave the site. `x-powered-by` tells attackers which framework is running.
- SCREENSHOT/OBSERVATION: `get_network_request` reqid=1 on `/login` listed these response headers: age, cache-control, content-encoding, content-type, date, link (preloads), server: Vercel, strict-transport-security: max-age=63072000, vary, x-matched-path, x-powered-by: Next.js, x-vercel-cache, x-vercel-id. `curl -D -` showed the same set on `/`, `/demo`, `/privacy`, `/join/000…`, `/does-not-exist` and `/aaj`.
- PROPOSED FIX: Add a `headers()` block in `next.config`, or set the headers in middleware for all routes: `X-Frame-Options: DENY` plus CSP `frame-ancestors 'none'`; `Referrer-Policy: strict-origin-when-cross-origin` (or `no-referrer` on `/join/*`); `X-Content-Type-Options: nosniff`; `Permissions-Policy: camera=(self), microphone=(self), geolocation=(self)` (loosen only for the features attendance and voice actually use); `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`. Start with a nonce-based CSP in `Content-Security-Policy-Report-Only` mode that allows self, Supabase, and Google accounts, then enforce it. Set `poweredByHeader: false`.

### Primary buttons have no visible keyboard focus indicator
- PAGE: `/` (header "Sign in", 3x "Get started", "See how it works"). `/login` ("Continue with Google", "Send code").
- PERSONA: Keyboard and switch-access users, and desktop owners who tab through the sign-in form.
- PROBLEM: These buttons use the Button variant with `outline-none` and no `focus-visible:` ring. With `:focus-visible` true, and after waiting 600 ms for transitions to finish, outline, box-shadow, border, background, text colour and text decoration are all identical to the unfocused state. Nav links, the language toggle and the landing's mock-UI buttons do show a 2px solid outline, so the problem is limited to this one button style.
- WHY IT MATTERS: The two most important actions on the site, sign-up and sign-in, give no sign of which one has focus. This fails WCAG 2.4.7 (Focus Visible). Lighthouse does not test for it, which is why accessibility still scores 95–96.
- SCREENSHOT/OBSERVATION: The `evaluate_script` focus sweep on `/` (1440px) found 22 focusable elements, 5 of them with no ring. "Get started", unfocused: border rgb(255,255,255), shadow none, bg rgb(53,65,196). Focused: exactly the same, outline-style none. Class list contains `outline-none … transition-colors` and no `focus-visible:` utility. On `/login`, "Continue with Google" is border rgb(230,225,214) / shadow none / outline none when focused, and "Send code" is bg rgb(53,65,196) / outline none. The email input does get a focus border (rgb(53,65,196)), which is correct.
- PROPOSED FIX: Add `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neel-600` to the shared Button base class. On solid blue buttons, use a white inner ring plus a blue outer ring (`focus-visible:ring-2 ring-white ring-offset-2 ring-offset-neel-600`). Then add a Playwright check that tabs to each button and asserts a non-`none` outline or box-shadow.

### Unknown routes show the unbranded default Next.js 404 with no way back
- PAGE: https://waakya.com/does-not-exist (also `/tasks`, `/team`, `/robots.txt`, `/sitemap.xml`)
- PERSONA: A visitor or staff member following an old, mistyped or shared link, often on mobile after a WhatsApp forward.
- PROBLEM: The status code (404) is correct, but the page is the framework default: a black screen with "404 | This page could not be found." in the system font. It has no logo, no link to home or sign-in, and no Hindi or Hinglish copy. The `<title>` is "Waakya — Bolo. Ho jayega.", which doesn't say "not found". The page still preloads all 4 brand font files and uses none of them.
- WHY IT MATTERS: The page is a dead end and looks unlike the warm cream brand, so it can read as a broken or phishing site. Mobile users have no link to follow and must retype the URL. It also downloads 319 KB of unused fonts.
- SCREENSHOT/OBSERVATION: Mobile screenshot: full black background, white "404 | This page could not be found." centred, nothing else. evaluate_script: `links: []`, `h1: "404"`, body bg rgb(0,0,0), font `system-ui…`. The console showed 4 warnings: "resource …woff2 was preloaded using link preload but not used within a few seconds" (all 4 font files). curl: `HTTP/2 404`, 10.4 KB HTML.
- PROPOSED FIX: Add `app/not-found.tsx` using the brand shell (cream background, logo mark, "Yeh page nahi mila / This page doesn't exist", buttons for "Go to home" and "Sign in", plus the language toggle) and set `metadata.title = "Page not found · Waakya"`. Add `app/robots.ts` and `app/sitemap.ts` so those two URLs return real files instead of the 404 page.

### English-only pages download 236–269 KB of Devanagari and Baloo fonts (about 45% of page weight)
- PAGE: `/`, `/login`, `/demo`, 404 (all routes preload the same 4 fonts through the `Link:` header)
- PERSONA: A visitor or new owner on a mid-range Android phone on Indian mobile data.
- PROBLEM: The root layout preloads all four font files on every route. They are Inter Latin (48 KB), Baloo 2 Latin (33 KB), Baloo 2 Devanagari (115 KB) and Noto Sans Devanagari (121 KB). The landing page has no Devanagari text (regex `[ऀ-ॿ]` finds 0 matches), but it still downloads both Devanagari files. Noto Devanagari stays `unloaded` there, so its preload is pure waste. `/login` never uses Baloo 2 (the logo is an SVG), yet it downloads 148 KB of Baloo. Its 121 KB Noto file renders a single word, "हिंदी", in the language toggle.
- WHY IT MATTERS: Fonts are the largest item on every page, bigger than all the JS combined. Preloads download at high priority and compete with the LCP and hydration scripts on slow networks. Data costs matter to this audience.
- SCREENSHOT/OBSERVATION: Landing desktop, cold load: 20 requests, 521 KB transferred. By type: woff2 319 KB (61%), JS 171 KB, CSS 13 KB, doc 13.9 KB. The largest resource is `e92fa6ab…woff2` (Noto Devanagari, 121 KB). `document.fonts` after load: Inter 400/500/600/700 and Baloo 2 800 (Latin plus Devanagari subset) loaded, Noto Devanagari not loaded. `/login` cold load: 21 requests, 548 KB, fonts 319 KB. Loaded faces are Inter 400/600/700 and Noto Devanagari 600, with Baloo 2 `unloaded`. The CSS maps `3c30d2e0` to Baloo 2 U+900-97F and `e92fa6ab` to Noto Devanagari U+900-97F.
- PROPOSED FIX: Set `preload: false` on the Devanagari faces in `next/font` (and on Baloo 2 everywhere except `/` and `/demo`). `unicode-range` then fetches them only when Devanagari glyphs actually appear, such as in Hindi mode. Alternatively, preload Devanagari only when the locale cookie is `hi`. Consider subsetting Noto Devanagari to the weights actually used (only 600 is used on `/login`). Check which character pulls in the Baloo Devanagari subset on `/` (probably a shared-range glyph such as U+200C, U+25CC or U+2013) and remove it from that face's range.

### No Open Graph or Twitter card tags on any page
- PAGE: `/` (also `/login`, `/demo`, `/join/*`)
- PERSONA: An owner sharing the waakya.com link with other owners on WhatsApp, or sharing a `/join/<token>` invite with staff.
- PROBLEM: Pages have zero `og:*` and `twitter:*` meta tags and no `<link rel="canonical">`. `/opengraph-image` returns 404.
- WHY IT MATTERS: In India, most sharing, including every staff invite, happens through WhatsApp. Without OG tags, the chat preview is bare text or a guess, with no brand image or tagline. An invite link that looks unbranded is less likely to be tapped and more likely to look like spam.
- SCREENSHOT/OBSERVATION: evaluate_script `document.querySelectorAll('meta[property^="og:"],meta[name^="twitter:"]').length` returned 0 on `/`, `/login` and `/demo`. `curl https://waakya.com/opengraph-image` returned 404. There is a meta description, but it differs by route: English on `/` ("Bring your team's conversations…") and Hinglish on `/login` and `/privacy` ("Kaam bhejo, dekha jaaye, ho jaaye…").
- PROPOSED FIX: Set `metadataBase: new URL('https://waakya.com')` plus `openGraph` (title, description, siteName, locale `en_IN`, type website) and `twitter: { card: 'summary_large_image' }` in the root layout. Add `app/opengraph-image.tsx` (1200x630 brand card). For `/join/[token]`, add a static "You've been invited to a team on Waakya" OG title that doesn't reveal the business name unless that is intended. Add `alternates.canonical` to `/`.

## P2

### Demo section dots are 6x6 px tap targets; demo controls are 32x32 px
- PAGE: `/demo`
- PERSONA: A visitor on mobile trying the demo.
- PROBLEM: The 11 "Go to <section>" buttons measure 6x6 px (the active one is 24x6 px). Previous, Next, Reset and Fullscreen are each 32x32 px.
- WHY IT MATTERS: The dots fail WCAG 2.5.8 (24 px minimum) and are nearly impossible to hit with a thumb. Lighthouse flags `target-size` on both mobile and desktop.
- SCREENSHOT/OBSERVATION: Lighthouse `/demo` mobile and desktop: Accessibility 91, `target-size` failed: "Target has insufficient size (6px by 6px, should be at least 24px by 24px)". evaluate_script button rects: `["Go to The problem",6,6]` …, `["Next section",32,32]`.
- PROPOSED FIX: Keep the 6 px visual dot but wrap it in a 24x24 px (ideally 44x44) transparent hit area, using padding plus a negative margin, or `::before` with `inset:-9px`. Raise the prev and next buttons to 44x44 px on touch devices.

### Low-contrast secondary text on /login and /demo
- PAGE: `/login` ("or with email", "Staff need the link their owner sent"). `/demo` (uppercase eyebrow labels such as "A MESSAGE" and "BECOMES WORK", plus timestamps).
- PERSONA: Staff members with older phones or dim screens outdoors, and older owners.
- PROBLEM: Text colour `text-ink-400` #8c877c on #faf8f3 gives 3.36:1 (13 px). `--s-faint` #8e91a8 on #fff gives 3.1:1 (11 px), and 2.9:1 for 11.5 px tabular timestamps. The line on `/login` that tells staff to use their owner's link is exactly the one that is too faint.
- WHY IT MATTERS: Fails WCAG 1.4.3 (4.5:1 needed for small text). The staff hint on `/login` is the only guidance for invited staff who reach the wrong page.
- SCREENSHOT/OBSERVATION: Lighthouse `/login` mobile and desktop: Accessibility 95, `color-contrast` failed on 2 nodes (3.36). Lighthouse `/demo`: Accessibility 91, `color-contrast` failed (3.1 and 2.9). This is the same token already reported for the landing page.
- PROPOSED FIX: Darken `ink-400` to about #736e63 (≈4.6:1 on #faf8f3) and `--s-faint` to about #6b6e85. Alternatively, use `ink-500` for any text under 14 px. Also move the staff hint up above the sign-in buttons.

### /login has no `<main>` landmark; /demo has no `<h1>` and repeats the brand in its title
- PAGE: `/login`, `/demo`
- PERSONA: Screen-reader users.
- PROBLEM: `/login` fails `landmark-one-main`. The only heading on `/demo` is an H2 ("The new era of business communication."), with no H1. The `/demo` title is "Waakya — Product demonstration · Waakya", with the brand twice.
- WHY IT MATTERS: Landmark and heading navigation is how screen-reader users find the form and the page purpose. A duplicated title looks sloppy in tabs and search results.
- SCREENSHOT/OBSERVATION: Lighthouse `/login`: `landmark-one-main` failed ("Document does not have a main landmark"). evaluate_script on `/demo`: headings = `["H2:The new era of business communication."]`, title as quoted.
- PROPOSED FIX: Wrap the login card in `<main>`. Make the demo hero heading an `<h1>`. Set the demo `metadata.title` to "Product demo", so the template produces "Product demo · Waakya".

### /demo is `noindex, nofollow`
- PAGE: `/demo`
- PERSONA: A prospective owner searching for the product.
- PROBLEM: `<meta name="robots" content="noindex, nofollow"/>` is set on the public product demo.
- WHY IT MATTERS: If unintentional, the best explanation of the product can't be found in search. Lighthouse SEO for `/demo` is 60.
- SCREENSHOT/OBSERVATION: Lighthouse `/demo` mobile and desktop: SEO 60, `is-crawlable` failed. `curl` confirms the meta tag.
- PROPOSED FIX: Confirm whether this is intended. If the demo is marketing, remove `robots: { index:false }` from its metadata. If it's intentionally hidden, leave it but keep it out of any sitemap.

### Invalid or expired invite page is a dead end, English-only, and indexable
- PAGE: `/join/00000000000000000000000000000000`
- PERSONA: A staff member (often Hindi-first) tapping an old WhatsApp invite.
- PROBLEM: The page shows only the logo and a red box reading "This link no longer works. Ask the owner for a new one." It has no heading, no language toggle, and no link to `/` or `/login`. It returns HTTP 200 without a `noindex` robots meta. The first cold request had a TTFB of 704–846 ms (a later one: 210 ms).
- WHY IT MATTERS: Staff can't read the message in Hindi or Hinglish and have nowhere to go. Token URLs should never be indexed. The slow cold TTFB is visible on first taps from WhatsApp.
- SCREENSHOT/OBSERVATION: Mobile screenshot shows the logo, a pink alert and blank space. evaluate_script: `h: []`, `links: []`, `robots: []`. curl: 200, 11.8 KB. Three curls gave TTFB 0.846 s, 0.218 s and 0.211 s.
- PROPOSED FIX: Add `robots: { index:false, follow:false }` to `/join/[token]` metadata and a `Referrer-Policy: no-referrer` header. Render the language toggle and an H1, plus a secondary "I already have an account → Sign in" link. Consider returning 410 for revoked tokens. Keep the Supabase lookup warm, or make the invite lookup a single indexed RPC.

### Auth redirect drops the return path
- PAGE: `/aaj`, `/settings` (logged out)
- PERSONA: An owner opening a deep link (for example a task link from a notification) while signed out.
- PROBLEM: `307 Location: /login` has no `next` or `redirectTo` parameter. `/aaj?foo=1` redirects to plain `/login` as well.
- WHY IT MATTERS: After signing in, the user probably lands on the default page instead of the task they tapped. The post-login step couldn't be tested without signing in, so this is inferred from the redirect URL alone.
- SCREENSHOT/OBSERVATION: The redirect itself is fast: 80 ms (Navigation Timing `redirectEnd-redirectStart`), 1 hop, curl TTFB 135–150 ms, then `/login` FCP 312 ms at 1440px. curl `-w %{redirect_url}` returned `https://waakya.com/login` for `/aaj`, `/settings` and `/aaj?foo=1`.
- PROPOSED FIX: In middleware, redirect to `/login?next=<encoded path+query>` and have the sign-in flow return to `next` (same-origin paths only).

### Public marketing pages are rendered dynamically with `no-store`
- PAGE: `/`, `/privacy`, `/demo`, `/login`
- PERSONA: Visitors, especially first visits from a cold edge.
- PROBLEM: Every document returns `cache-control: private, no-cache, no-store, max-age=0, must-revalidate` and `x-vercel-cache: MISS`, even the static-looking `/` (101 KB HTML) and `/privacy`. This most likely happens because middleware or the layout reads cookies (locale or session).
- WHY IT MATTERS: Each visit pays for a function run (curl TTFB 127–218 ms from India, and more for users far from bom1). Back/forward cache and CDN caching can't help.
- SCREENSHOT/OBSERVATION: curl on `/`: ttfb 0.218 s, 101,584 B, MISS. `/privacy`: 0.127 s, MISS. `/demo`: 0.151 s, MISS. Static assets are correctly `public,max-age=31536000,immutable` with `HIT`.
- PROPOSED FIX: Read the locale on the client, or put it in the path (`/hi`), so `/`, `/privacy` and `/demo` can be statically generated or ISR. Exclude these paths from the auth middleware matcher.

### Smaller hygiene items
- PAGE: All pages
- PERSONA: Everyone, with little user-visible impact.
- PROBLEM: (a) The trace flags 14.4 KB of legacy JS polyfills (`LegacyJavaScript` insight on `/login` and `/demo`). (b) The `/demo` trace shows 305 ms of unattributed forced reflow at 4x CPU, though only one long task (60 ms at 670 ms) and TBT of about 10 ms. (c) The manifest has `lang: "hi-IN"` and `description: "Bolo. Ho jayega."`, while the HTML is `lang="en"` and the landing tagline is "Every conversation. A clear next step." (d) `/brand/logo/logo-stacked.svg` is served with `max-age=0, must-revalidate` (11.5 KB decoded) and revalidated on every visit. (e) `/robots.txt` and `/sitemap.xml` return the 404 page.
- WHY IT MATTERS: These cost a little speed and SEO and make the brand text inconsistent. None of them is urgent.
- SCREENSHOT/OBSERVATION: Performance insights as listed. curl of the manifest and SVG headers as quoted.
- PROPOSED FIX: (a) Set a modern `browserslist`. (b) Batch layout reads in the demo's measuring effect (use `ResizeObserver` or read in `requestAnimationFrame` before writing). (c) Align manifest `lang` and description with the current positioning. (d) Serve the brand SVGs from a hashed path or give them `max-age=86400, stale-while-revalidate`. (e) Add `app/robots.ts` and `app/sitemap.ts`.

## What is healthy (measured)
- **Core Web Vitals (lab, mobile 4x CPU, Fast 4G):** `/login` LCP 436 ms, CLS 0. `/demo` LCP 615 ms (text, all render delay), CLS 0, TBT ≈10 ms. Landing LCP 747 ms, CLS 0 (earlier run). All well inside "good".
- **Console:** 0 errors and 0 warnings on `/`, `/login`, `/demo`, `/privacy`, `/join/*`. The only warnings seen were the unused-font-preload warnings on the 404 page.
- **Network:** no 4xx or 5xx responses among page subresources, no third-party requests (no analytics, tag managers or CDNs), no `<img>` rasters (the landing uses 38 inline SVGs). Hashed JS, CSS and fonts get `public,max-age=31536000,immutable`, brotli and h2.
- **JS weight is moderate:** landing 10 scripts, 171 KB transferred (547 KB decoded). `/login` 11 scripts, about 203 KB transferred. The largest chunk is 73 KB transferred (229 KB decoded).
- **Fonts:** `font-display: swap` with metric-matched "Inter Fallback" and "Baloo 2 Fallback" faces, so swapping fonts causes no visible layout shift (CLS 0). Baloo 2 is preloaded (both subsets).
- **Redirect:** `/aaj` returns a single 307 to `/login` in 80–150 ms, with no chains.
- **PWA:** `manifest.webmanifest` is valid (id, start_url, scope, display standalone, theme_color #3541C4, 192 and 512 icons including maskable, all returning 200). `apple-touch-icon` and `favicon.ico`/`favicon.svg` are present. `sw.js` is registered and controls `/`. The site meets the installability criteria.
- **Document basics:** `<html lang="en">` everywhere. Viewport allows zoom (`maximum-scale=5`). The landing has a single H1 followed by H2s in order, with header, nav ×2, main and footer landmarks. `/privacy` has an H1 then H2s, a main landmark, and a visible "updated: 4 September 2026" date.
- **Reduced motion:** a global `@media (prefers-reduced-motion: reduce)` rule sets animation and transition duration to 0.01 ms. The demo doesn't auto-advance (no change after 9 s idle).
- **Layout:** 0 px horizontal overflow on `/demo`, `/privacy` and `/` at both 390 and 1440 px. The demo's fixed control bar doesn't cover the last content when scrolled to the end.
- **Lighthouse Best Practices:** 100 on every audited page.

## Measurements

| Page | Viewport | LCP | CLS | TBT/long tasks | Requests | Transfer | Fonts | JS (xfer/decoded) | Cold TTFB (curl) | LH A11y | LH BP | LH SEO | Console |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `/` | mobile 4x/Fast4G | 747 ms (prior run) | 0 | — | — | — | — | — | 218 ms | 96 | 100 | 100 | 0 |
| `/` | desktop 1440 | FCP 284 ms, load 270 ms | 0 | — | 20 | 521 KB | 4 files, 319 KB | 171 KB / 547 KB (10 files) | 218 ms | 96 | 100 | 100 (Agentic 50) | 0 |
| `/login` | mobile 4x/Fast4G | 436 ms (TTFB 34 / load delay 152 / load 169 / render 80) | 0 | — | 21 | 548 KB | 4 files, 319 KB (Baloo 148 KB unused) | ≈203 KB / ≈636 KB (11 files) | 137 ms | 95 | 100 | 100 | 0 |
| `/login` | desktop | — | — | — | — | — | — | — | — | 95 | 100 | 100 | 0 |
| `/demo` | mobile 4x/Fast4G | 615 ms (render delay 590) | 0 | 1 task 60 ms, TBT ≈10 ms; forced reflow 305 ms | 18 (+fonts from cache) | 203 KB excl. fonts | Inter + Baloo 2 loaded | 180 KB / 603 KB | 151 ms | 91 | 100 | 60 (noindex) | 0 |
| `/demo` | desktop | — | — | — | — | — | — | — | — | 91 | 100 | 60 | 0 |
| `/privacy` | mobile | FCP 308 ms | — | — | 17 | 25 KB (warm fonts) | — | — | 127 ms | — | — | — | 0 |
| `/join/000…` | mobile | — | — | — | — | 11.8 KB doc | — | — | 704–846 ms cold, 210 ms warm | — | — | — | 0 |
| `/aaj` → `/login` | desktop | redirect 80 ms, FCP 312 ms | — | — | 1 hop 307 | 9.5 KB | — | — | 135–150 ms | — | — | — | 0 |
| `/does-not-exist` | mobile | — | — | — | — | 10.5 KB doc + 319 KB unused fonts | 0 used | — | 135 ms (404) | — | — | — | 4 preload warnings |

## Authenticated runtime evidence (`before/index.json`, 100 captures)
- Personas and viewports: owner 18+18, member 16+16, newowner 10+10, visitor 6+6 (desktop+mobile).
- **Status:** 100/100 returned HTTP 200. **Console errors: 0. Failed requests: 0. Horizontal overflow: 0 px** on every capture.
- Expected redirects: visitor `/aaj` → `/login` (both viewports), newowner `/aaj` → `/setup`.
- Time to network idle: median 1,196 ms, p90 1,463 ms, min 668 ms. By persona medians: visitor 955, member 1,199, newowner 1,192, owner 1,237 ms.
- Slowest: member desktop `/projects/<id>` 2,357 ms; member mobile `/hazri` 2,033 ms; owner mobile `/projects` 2,019 ms; newowner desktop `/aaj` 1,944 ms; member mobile `/approvals` 1,716 ms; owner desktop `/kaam/<id>` 1,661 ms; newowner desktop `/documents` 1,656 ms. Project detail, attendance (`/hazri`) and the projects list are the best places to look for waterfall and query consolidation (these numbers are time to network idle, not LCP).
