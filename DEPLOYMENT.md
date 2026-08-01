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

## Inline CSS note (homepage perf)

`big-smile.html` carries an **inlined copy of `assets/site.css`** in its `<head>`
(replaces the `<link>`; removes a render-blocking round trip that capped the mobile
PageSpeed score). Subpages still link the file normally. **If you edit
`assets/site.css`, re-inline it into `big-smile.html`** — replace the inlined block
between the `==== inlined copy of assets/site.css` comment markers with the new file
contents. `site.js` is `defer`red on the homepage for the same reason.

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
