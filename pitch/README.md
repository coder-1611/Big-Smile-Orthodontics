# Pitch deck — "What the Machines See"

A 9-slide deck for Dr. Asrar arguing that AI assistants are now a patient-discovery
channel, that the current site fails Google's agentic-browsing check 1/6 while this
rebuild passes 6/6, and that the rest of the report card follows the same pattern.

- `what-the-machines-see.html` — the built deck. Self-contained: every screenshot is
  an embedded WebP data URI, no external requests (it is published as an Artifact,
  which blocks them). Content-only; the host wraps it in a doctype/head/body.
- `what-the-machines-see.src.html` — the same file with `__IMG_key__` placeholders
  instead of the data URIs. **Edit this one.**
- `build-images.py` — re-crops and re-encodes the evidence screenshots, writing
  `imgs.json`. Expects the raw captures in a sibling `evidence/` directory.

To rebuild after editing the source:

```bash
python3 build-images.py                      # -> imgs.json
python3 - <<'PY'
import json, re
imgs = json.load(open('imgs.json'))
src = open('what-the-machines-see.src.html', encoding='utf-8').read()
for k, v in imgs.items():
    src = src.replace('__IMG_%s__' % k, v)
assert not re.findall(r'__IMG_\w+__', src)
open('what-the-machines-see.html', 'w', encoding='utf-8').write(src)
PY
```

## Every number in the deck, and where it came from

All measured 4 August 2026.

| Claim | Source |
|---|---|
| Rebuild 100/100/100/100 + Agentic 3/3, both form factors | PageSpeed Insights, two consecutive clean runs |
| Current site mobile 57/92/100/100 + Agentic 1/3 | PageSpeed Insights |
| Current site desktop 71/88/96/100 + Agentic 0/3 | PageSpeed Insights |
| 11.6s LCP | Their `/traditional-orthodontics.html`, mobile — that one page only |
| 49% of U.S. adults use AI chatbots, ~1 in 4 daily | Pew Research Center, "Americans and AI 2026", n=5,119, fielded 17–23 Feb 2026 |
| `tntadmin` username public | `GET /blog/wp-json/wp/v2/users` returns 200 with the slug |
| Login page reachable | `GET /blog/wp-login.php` returns 200 |
| No security headers | No HSTS / CSP / X-Frame-Options / Referrer-Policy on any response |
| 44 images, 1 lazy-loaded | Their homepage markup |

## What the two Opus reviews changed

A design review and an adversarial fact-check were run over the first draft. The
fact-check found two problems that were **defects in the site, not the deck**, and
both are now fixed: `privacy-policy.html` and `request-an-appointment.html` were
live and indexed on the current site but 404'd on the rebuild, and the deck
criticised the current site for missing security headers while the rebuild set only
HSTS — and the current site sets `X-Content-Type-Options`, which the rebuild did
not. See the commit history.

Claims corrected in the deck itself:

| Was | Now | Why |
|---|---|---|
| "Half your patients now ask a machine first" | "Your next patient may ask a machine before they ask you" | Pew measures adults who *ever* use a chatbot, not patients, not "first" |
| "Pew finds chatbot use rises with [income and education]" | attributed to U.S. Census, with a note that Pew's report has no such breakdown | The cited Pew report breaks down by age, gender and race only |
| Slide 4's description of the three agentic checks | the real check names, read out of the PSI report | The original description was invented; the actual checks are accessibility-tree form, CLS, and `llms.txt` |
| "Every page you have today still works" | "Every address Google knows still resolves" | Two pages 404'd until they were built/redirected |
| "you will get these same five scores" | "Performance moves a few points run to run; the gap does not" | PSI is variable |
| "their treatment pages … 11.6 seconds" | names `traditional-orthodontics.html`, mobile | Measured on one page only |
| "350+ five-star Google reviews" | "a 5.0 average across hundreds of Google reviews" | Their own site says 300+, so the deck contradicted its own screenshot |
| "The login page is wide open" / "Everything competes, so nothing wins" | softened | Alarmist, and a gratuitous swipe at another designer |
| four header acronyms | one plain-English sentence | The audience is a non-technical doctor |

Fairness additions: the open `wp-json` endpoint is now noted as WordPress's default
behaviour rather than vendor negligence; their Best Practices 100 on mobile and the
one security header they set are both credited; and slide 8 makes clear that only
`/blog` runs WordPress, not her whole site.

## Two accuracy rules this deck must keep

1. **The Pew figure is national.** There is no Round Rock–specific survey of AI use.
   Slide 2 says so explicitly and labels the local step as an inference. Do not
   convert it into a local statistic.
2. **No password or credential is exposed** on the current site, and there is no
   evidence of a breach. What is public is the admin *username* plus a reachable
   login page. Slide 8 states this limit in as many words. Do not strengthen it.

## Still outstanding before this is presented

- **Dr. Asrar must confirm her board-certification wording.** Eleven places on the
  rebuild say "board-certified"; the old homepage copy said "board-eligible". These
  are different credentials and only she can settle it. The lone "board-eligible"
  was removed rather than guessed at, but the eleven "board-certified" mentions are
  still live and need her sign-off.
- The deck has no price, scope or launch date on the closing slide. Add them before
  presenting, or be ready to say them out loud.
- Fonts are system stacks (Avenir Next / Charter / SF Mono). Presented from a Mac
  this is the intended design; on Windows or Android it degrades to Trebuchet MS
  and Georgia, which looks noticeably more generic. Present it from your own laptop.
