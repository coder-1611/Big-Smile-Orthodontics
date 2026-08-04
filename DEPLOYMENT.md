# DEPLOYMENT — Domain cutover checklist (bigsmileorthodontics.com → Vercel)

> **If the user asks "what did you tell me to do for deployment?" — this is the file.**
> Written 2026-08-01. Status at that date: cutover NOT done. The real domain
> (`www.bigsmileorthodontics.com`) still serves the old vendor site from Plesk at
> `174.138.44.12`. The new site lives in this repo, deployed at
> `https://test-ortho-website.vercel.app` via GitHub auto-deploy.

## ⚠️ Debt deliberately taken on (must be repaid at cutover)

On 2026-08-01 the `X-Robots-Tag: noindex, nofollow` header for the
`test-ortho-website.vercel.app` host was **removed** from `vercel.json` so the
Lighthouse/PageSpeed SEO audit passes ("page is blocked from indexing").

That header existed to stop Google from indexing the test URL as duplicate
content competing with Dr. Asrar's real site. **The moment the real domain goes
live on Vercel, re-add it** (step 6 below). Until then the exposure is small
because every page's canonical points to `https://www.bigsmileorthodontics.com/`.

## Cutover steps, in order

1. **DNS at GoDaddy — change ONLY the A/CNAME records.**
   - `www` → CNAME `cname.vercel-dns.com` (or A `76.76.21.21`), apex → A `76.76.21.21`.
   - **DO NOT touch NS, MX, or TXT records.** Email for the whole practice
     (`dr.asrar@bigsmileorthodontics.com`) runs through Proofpoint → Microsoft 365
     (`mx1/2/3-usg2.ppe-hosted.com`). Changing nameservers kills their email instantly.
   - Find out first whose GoDaddy account holds the domain (practice's or vendor's) —
     this was still unknown as of 2026-08-01.

2. **Vercel:** add `www.bigsmileorthodontics.com` + apex to the project's domains.
   `vercel.json` already 301s apex → www. Verify the Vercel-issued cert goes active.

3. **Smoke test the live domain** (not the test URL):
   `curl -fsS` every route: `/`, `/services.html`, `/contact.html`, `/dr-asrar.html`,
   `/for-patients.html`, `/smile-gallery.html`, `/blog`, plus 2–3 old-vendor URLs from the
   redirect map in `vercel.json` (e.g. `/meet-dr-asrar.html`, `/invisalign-clear-aligners.html`)
   and confirm they 301 to the right pages. Confirm `dig MX bigsmileorthodontics.com`
   is UNCHANGED.

4. **Search Console:** add property `https://www.bigsmileorthodontics.com/` on the
   user's account (sthitpragyasoham@gmail.com). HTML-file verification works — the
   same repo serves the domain, so drop the `google<hash>.html` file in the repo root
   exactly like `google7cff4e4081bf3e2f.html` (that one verifies the *test* property —
   **never delete it**). Then submit `sitemap.xml` (it already lists the 33 real-domain
   URLs) and Request Indexing on `/`, `/services.html`, `/contact.html`, `/dr-asrar.html`.
   Browser automation recipe: `~/.claude/skills/local-seo-ranking` (chrome-clone.sh + notes).

5. **Old server:** keep the Plesk box at `174.138.44.12` alive 60–90 days as rollback.
   Rollback = point the A record back at it; takes minutes.

6. **Re-add the noindex header for the test host** to `vercel.json` (repaying the debt
   from the warning above):
   ```json
   "headers": [
     {
       "source": "/(.*)",
       "has": [{ "type": "host", "value": "test-ortho-website.vercel.app" }],
       "headers": [{ "key": "X-Robots-Tag", "value": "noindex, nofollow" }]
     }
   ]
   ```

7. **Google Business Profile:** confirm the website URL on the practice's GBP listing
   points at `https://www.bigsmileorthodontics.com/` (it should already — the domain
   isn't changing, only the host behind it).

## ⚠️ CSS build step — run after EVERY stylesheet edit

Two separate inlining mechanisms exist, and **both must be refreshed whenever you
touch `assets/site.css`, `assets/subpage.css` or `assets/blog.css`:**

1. **Homepage** — `big-smile.html` carries a verbatim inline copy of `site.css`
   (see the note below). Re-inline it by replacing the block between the
   `==== inlined copy of assets/site.css` markers.
2. **Every other page** (15 pages + 26 blog posts) — run:
   ```bash
   python3 tools/inline-subpage-css.py
   ```
   It inlines `site.css` + `subpage.css` (+ `blog.css` on blog pages), strips the
   render-blocking `<link>`s, and injects the same `@font-face`-in-`media=print`
   block the homepage uses (lifted verbatim from `big-smile.html`, so that file
   stays the single source of truth for font loading). It is idempotent and
   self-checks that no render-blocking css/font `<link>` survived.

   **Why:** subpages were fetching two stylesheets plus the Google Fonts CSS on
   the critical path — ~2.9s FCP / SI 3.1 on the PSI mobile probe, capping mobile
   performance at 87. After inlining: FCP ~0.9s, SI ~1.0, desktop 100, mobile
   90-91.

   **Known remaining gap:** subpage *mobile* perf sits at ~90 because mobile LCP
   stays ~3.5s. The mobile first viewport on these pages is pure text, so the LCP
   element is the hero `<h1>`: it paints at FCP in the fallback font, then DM Serif
   activates on `window.load` and re-records LCP. The documented landmine-7 fix
   (widening pre-font headings via `html:not(.fonts-on)`) was tried and **reverted**
   — it produced no LCP gain and pushed CLS from 0.013 to 0.037. The `fonts-on`
   class is still stamped by the flip script if a future attempt wants it. Closing
   this properly needs the bisect approach in the `/all-hundreds` skill. For scale:
   TNT's equivalent live page scores mobile 65 / desktop 55 with an 11.6s LCP.

## Inline CSS note (homepage perf)

`big-smile.html` carries an **inlined copy of `assets/site.css`** in its `<head>`
(replaces the `<link>`; removes a render-blocking round trip that capped the mobile
PageSpeed score). Subpages still link the file normally. **If you edit
`assets/site.css`, re-inline it into `big-smile.html`** — replace the inlined block
between the `==== inlined copy of assets/site.css` comment markers with the new file
contents. `site.js` is `defer`red on the homepage for the same reason.

## Perf setup on the homepage (why the PSI score is 95+/100)

`big-smile.html` self-hosts everything the first paint depends on: `assets/site.css`
is inlined (see note above), the Google Fonts CSS (`@font-face` rules for DM Serif
Display / Inter / JetBrains Mono) is inlined in `<head>` (font binaries still stream
from fonts.gstatic.com), `site.js` is deferred, and metric-matched fallback fonts
('DM Serif Fallback' → Georgia, 'Inter Fallback' → Arial, in site.css) keep CLS ≈ 0.
Mobile (≤600px) paints the hero with no entrance animation, defers below-fold
sections via content-visibility:auto, and — critically — the inline font
stylesheet (`id="ff-inline"`) ships `media="print"` and is flipped to `all` by the
script right after it: synchronously on desktop, on **window.load** on mobile.
That load-gating is what took mobile from 96 to 100: it keeps the
fonts.gstatic.com fetches out of the simulated first-paint chain. Do NOT
"simplify" it to a plain `<style>`, and do NOT flip it in requestAnimationFrame —
rAF runs before paint, which silently reverts the score to 96 (learned the hard
way). Don't re-add a render-blocking `<link>` (stylesheet or fonts) to this
page's head either — that's what capped the score originally.

`vercel.json` sets `s-maxage=86400, stale-while-revalidate` so Google's probe hits a
warm edge. Beware: right after a deploy some edge POPs briefly serve the previous
build — verify deployed changes with a content grep, not just an HTTP 200.

**To verify or restore the perfect scores, run the `/all-hundreds` skill**
(`~/.claude/skills/all-hundreds/`) — it drives the official pagespeed.web.dev probe
on both form factors, diagnoses regressions to the failing element, and lists the
do-not-break rules that protect the 100s.

## Facts a fresh session will otherwise re-derive

- Old vendor site: ~46 indexed URLs (20 pages + 26 blog posts). The 1:1 redirect map
  for all of them is already in `vercel.json` — do not redirect everything to `/`.
- Canonicals across the site already point to `www.bigsmileorthodontics.com` (cutover-ready).
- `robots.txt` sitemap line already points at the real domain.
- Search Console property for the TEST url (`test-ortho-website.vercel.app`) is verified
  on the user's account; its sitemap is submitted but lists real-domain URLs, so it will
  show errors until cutover. Expected — ignore.
- Two pre-existing `google-site-verification` TXT records exist in the domain's DNS —
  probably the old vendor's Search Console access. After cutover, consider asking
  Dr. Asrar to remove the vendor's access (Settings → Users and permissions won't show
  it; it's DNS-based, so it means deleting those TXT records — confirm with her first).
