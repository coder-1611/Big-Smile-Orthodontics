# One-off generator: builds blog/<slug>.html + blog/index.html from captured WP posts.
# Rerun any time: python3 archive/blog-capture/generate.py  (from repo root)
import html as htmlmod
import json
import os
import re
import urllib.request
from datetime import datetime
from typing import Optional

CAP = "archive/blog-capture"
SITE = "https://www.bigsmileorthodontics.com"
os.makedirs("blog", exist_ok=True)
os.makedirs("assets/blog", exist_ok=True)


def balanced_div(html: str, marker: str) -> str:
    i = html.find(marker)
    if i == -1:
        return ""
    start = html.rfind("<div", 0, i)
    depth = 0
    for m in re.finditer(r"<div\b|</div>", html[start:]):
        depth += 1 if m.group(0) == "<div" else -1
        if depth == 0:
            return html[start:start + m.end()]
    return ""


def meta_content(html: str, pattern: str) -> Optional[str]:
    m = re.search(pattern, html)
    return htmlmod.unescape(m.group(1)) if m else None


def original_image_url(src: str) -> str:
    # WP size suffix like -300x200 before extension -> strip for full-size
    return re.sub(r"-\d+x\d+(\.\w+)$", r"\1", src)


downloaded = {}


def fetch_image(url: str, slug: str, n: int) -> Optional[str]:
    url = original_image_url(url)
    if url in downloaded:
        return downloaded[url]
    ext = os.path.splitext(url.split("?")[0])[1] or ".jpg"
    local = f"assets/blog/{slug}-{n}{ext}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        data = urllib.request.urlopen(req, timeout=30).read()
        if len(data) < 500:
            return None
        with open(local, "wb") as f:
            f.write(data)
        downloaded[url] = "/" + local
        return "/" + local
    except Exception as e:
        print(f"  IMG FAIL {url}: {e}")
        return None


def clean_body(body: str, slug: str):
    # strip outer storycontent wrapper
    body = re.sub(r"^<div[^>]*>", "", body.strip())
    body = re.sub(r"</div>$", "", body.strip())
    body = re.sub(r'<span id="more-\d+"></span>', "", body)

    first_image_local = [None]
    counter = [0]

    def img_repl(m):
        tag = m.group(0)
        srcm = re.search(r'src="([^"]+)"', tag)
        if not srcm:
            return tag
        counter[0] += 1
        local = fetch_image(srcm.group(1), slug, counter[0])
        if not local:
            return ""  # drop broken image
        alt = re.search(r'alt="([^"]*)"', tag)
        altv = alt.group(1) if alt else ""
        lazy = ' loading="lazy"' if counter[0] > 1 else ""
        if first_image_local[0] is None:
            first_image_local[0] = local
        return f'<img src="{local}" alt="{altv}"{lazy} />'

    body = re.sub(r"<img[^>]*>", img_repl, body)
    # own-domain links -> root-relative (site 301 map handles legacy targets)
    body = body.replace(f"{SITE}/blog/wp-content", "/assets/blog-missing")  # safety, shouldn't remain
    body = re.sub(rf'href="{re.escape(SITE)}/blog/([^"/]+)/?"', r'href="/blog/\1"', body)
    body = re.sub(rf'href="{re.escape(SITE)}/?"', 'href="/"', body)
    body = re.sub(rf'href="{re.escape(SITE)}/([^"]+)"', r'href="/\1"', body)
    # collapse 3+ newlines
    body = re.sub(r"\n{3,}", "\n\n", body).strip()
    return body, first_image_local[0]


PAGE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<link rel="icon" href="/assets/tooth.png" type="image/png">
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>{title} | Big Smile Orthodontics Blog</title>
<meta name="description" content="{desc}" />
<link rel="canonical" href="{canon}" />
<meta property="og:type" content="article" />
<meta property="og:url" content="{canon}" />
<meta property="og:title" content="{title} | Big Smile Orthodontics Blog" />
<meta property="og:description" content="{desc}" />
<meta property="og:image" content="{ogimg}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{title}" />
<meta name="twitter:description" content="{desc}" />
<meta name="twitter:image" content="{ogimg}" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="/assets/site.css" />
<link rel="stylesheet" href="/assets/subpage.css" />
<link rel="stylesheet" href="/assets/blog.css" />
<script type="application/ld+json">
{ldjson}
</script>
</head>
<body>
<div class="scroll-bar"></div>
<div class="cursor-dot"></div>
<div id="nav-mount"></div>

<section class="page-hero blog-hero" id="top">
  <div class="page-hero__grid"></div>
  <div class="page-hero__inner">
    <div>
      <div class="page-hero__crumbs"><a href="/">Home</a><span class="sep">&#9656;</span><a href="/blog">Blog</a><span class="sep">&#9656;</span><span class="current">Article</span></div>
      <h1 data-reveal>{title_html}</h1>
      <div class="post-meta" data-reveal data-reveal-delay="1">{date_h} &middot; Big Smile Orthodontics</div>
    </div>
  </div>
</section>

<section class="section section--light">
  <div class="post-wrap">
    <div class="post-body">
{body}
    </div>
    <div class="post-cta">
      <h3>Ready for your <em>best smile?</em></h3>
      <a href="/contact.html#book" class="btn btn--warm" data-hover>Book free consult
        <svg class="arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
      </a>
    </div>
    <a class="post-backlink" href="/blog">&larr; Back to all articles</a>
  </div>
</section>

<div id="footer-mount"></div>
<script src="/assets/chrome.js"></script>
<script src="/assets/site.js"></script>
</body>
</html>
"""

posts = []
urls = [u.strip() for u in open(f"{CAP}/urls.txt") if u.strip()]
for url in urls:
    slug = url.rstrip("/").split("/")[-1]
    raw = open(f"{CAP}/{slug}.html").read()
    title_m = re.search(r"<h1[^>]*>(.*?)</h1>", raw, re.S)
    title = htmlmod.unescape(re.sub(r"<[^>]+>", "", title_m.group(1))).strip()
    desc = meta_content(raw, r'<meta name="description" content="([^"]*)"') or ""
    pub = meta_content(raw, r'property="article:published_time" content="([^"]*)"')
    mod = meta_content(raw, r'property="article:modified_time" content="([^"]*)"') or pub
    story = balanced_div(raw, 'class="storycontent"')
    if not story:
        print(f"NO BODY: {slug}")
        continue
    body, first_img = clean_body(story, slug)
    dt = datetime.fromisoformat(pub.replace("Z", "+00:00")) if pub else None
    date_h = dt.strftime("%B %-d, %Y") if dt else ""
    canon = f"{SITE}/blog/{slug}"
    ogimg = f"{SITE}{first_img}" if first_img else f"{SITE}/assets/index-banner.webp"
    ld = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": title,
        "description": desc,
        "url": canon,
        "mainEntityOfPage": canon,
        "image": ogimg,
        "author": {"@type": "Organization", "name": "Big Smile Orthodontics"},
        "publisher": {
            "@type": "Organization",
            "name": "Big Smile Orthodontics",
            "logo": {"@type": "ImageObject", "url": f"{SITE}/assets/logo.png"},
        },
    }
    if pub:
        ld["datePublished"] = pub
    if mod:
        ld["dateModified"] = mod
    esc = lambda s: s.replace('"', "&quot;")
    page = PAGE.format(
        title=esc(title), title_html=title, desc=esc(desc), canon=canon, ogimg=ogimg,
        ldjson=json.dumps(ld, indent=2), date_h=date_h, body=body,
    )
    open(f"blog/{slug}.html", "w").write(page)
    posts.append({"slug": slug, "title": title, "desc": desc, "date": pub or "", "date_h": date_h})
    print(f"OK {slug} ({len(body)} chars, img={bool(first_img)})")

# ---- index page ----
posts.sort(key=lambda p: p["date"], reverse=True)
cards = "\n".join(
    f'''    <a class="blog-card" href="/blog/{p['slug']}" data-hover>
      <div class="blog-card__date">{p['date_h']}</div>
      <h2>{p['title']}</h2>
      <p>{p['desc']}</p>
      <span class="blog-card__more">Read article &rarr;</span>
    </a>''' for p in posts
)
index_ld = json.dumps({
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "Big Smile Orthodontics Blog",
    "url": f"{SITE}/blog",
    "description": "Orthodontic tips and advice from Big Smile Orthodontics in Round Rock, TX — braces, Invisalign, retainers, and healthy smiles.",
}, indent=2)
index = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<link rel="icon" href="/assets/tooth.png" type="image/png">
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Blog | Braces & Invisalign Tips | Big Smile Orthodontics Round Rock, TX</title>
<meta name="description" content="Orthodontic tips and advice from Big Smile Orthodontics in Round Rock, TX — Invisalign care, braces, retainers, kids' orthodontics, and more from Dr. Saba Asrar's team." />
<link rel="canonical" href="{site}/blog" />
<meta property="og:type" content="website" />
<meta property="og:url" content="{site}/blog" />
<meta property="og:title" content="Blog | Big Smile Orthodontics" />
<meta property="og:description" content="Orthodontic tips and advice from Big Smile Orthodontics in Round Rock, TX." />
<meta property="og:image" content="{site}/assets/index-banner.webp" />
<meta name="twitter:card" content="summary_large_image" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="/assets/site.css" />
<link rel="stylesheet" href="/assets/subpage.css" />
<link rel="stylesheet" href="/assets/blog.css" />
<script type="application/ld+json">
{ld}
</script>
</head>
<body>
<div class="scroll-bar"></div>
<div class="cursor-dot"></div>
<div id="nav-mount"></div>

<section class="page-hero blog-hero" id="top">
  <div class="page-hero__grid"></div>
  <div class="page-hero__inner">
    <div>
      <div class="page-hero__crumbs"><a href="/">Home</a><span class="sep">&#9656;</span><span class="current">Blog</span></div>
      <h1 data-reveal>Smile <i>wisdom.</i></h1>
      <p class="subtitle" data-reveal data-reveal-delay="1">Tips, answers, and honest advice on braces, Invisalign, and healthy smiles — from the Big Smile team.</p>
    </div>
  </div>
</section>

<section class="section section--light">
  <div class="blog-grid">
{cards}
  </div>
</section>

<div id="footer-mount"></div>
<script src="/assets/chrome.js"></script>
<script src="/assets/site.js"></script>
</body>
</html>
""".format(site=SITE, ld=index_ld, cards=cards)
open("blog/index.html", "w").write(index)
print(f"\nINDEX with {len(posts)} cards. Images downloaded: {len(downloaded)}")
