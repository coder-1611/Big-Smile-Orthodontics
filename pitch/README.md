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

## Two accuracy rules this deck must keep

1. **The Pew figure is national.** There is no Round Rock–specific survey of AI use.
   Slide 2 says so explicitly and labels the local step as an inference. Do not
   convert it into a local statistic.
2. **No password or credential is exposed** on the current site, and there is no
   evidence of a breach. What is public is the admin *username* plus a reachable
   login page. Slide 8 states this limit in as many words. Do not strengthen it.
