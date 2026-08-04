#!/usr/bin/env python3
"""Inline the render-blocking CSS on subpages, the way big-smile.html already does.

Why: subpages linked assets/site.css + assets/subpage.css (+ blog.css) as
render-blocking <link>s and pulled the Google Fonts CSS from fonts.googleapis.com.
On the PSI mobile probe that cost ~2.9s FCP / 3.3s LCP and capped mobile
performance at 87. The homepage avoids all of it by inlining its CSS and shipping
the @font-face rules in an inline <style media="print"> that a script flips to
media="all" (synchronously on desktop, on window.load on mobile) — see
DEPLOYMENT.md. This script applies the same treatment to the other pages.

RUN THIS AFTER ANY EDIT TO assets/site.css, assets/subpage.css OR assets/blog.css.
It is idempotent: it replaces its own previous output between markers.

    python3 tools/inline-subpage-css.py            # all subpages
    python3 tools/inline-subpage-css.py a.html b.html
"""
import glob
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BEGIN = '<!-- BEGIN inlined-css (tools/inline-subpage-css.py) -->'
END = '<!-- END inlined-css -->'

# Pages that manage their own critical CSS / must not be touched.
SKIP = {'big-smile.html', 'google7cff4e4081bf3e2f.html', 'seo-auditor.html'}

FONT_LINK_PATTERNS = [
    r'[ \t]*<link rel="preconnect" href="https://fonts\.googleapis\.com"[^>]*>\n',
    r'[ \t]*<link rel="preload" as="style" href="https://fonts\.googleapis\.com[^>]*>\n',
    r'[ \t]*<link href="https://fonts\.googleapis\.com[^>]*rel="stylesheet"[^>]*>\n',
    r'[ \t]*<noscript><link href="https://fonts\.googleapis\.com[^>]*></noscript>\n',
]
CSS_LINK = re.compile(r'[ \t]*<link rel="stylesheet" href="/?assets/(site|subpage|blog)\.css"[^>]*>\n')


def read(p):
    with open(os.path.join(ROOT, p), encoding='utf-8') as f:
        return f.read()


def font_block():
    """The @font-face <style media=print> + activation script, lifted verbatim
    from big-smile.html so there is exactly one source of truth."""
    h = read('big-smile.html')
    i = h.find('<style id="ff-inline" media="print">')
    j = h.find('</style>', i) + len('</style>')
    ff = h[i:j]
    k = h.find('<script>', j)
    m = h.find('</script>', k) + len('</script>')
    return ff + '\n' + h[k:m]


def build(page, css_files):
    parts = [BEGIN,
             '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />',
             font_block()]
    for c in css_files:
        parts.append(f'<style>/* inlined assets/{c} — re-run tools/inline-subpage-css.py after editing it */')
        parts.append(read(f'assets/{c}').strip())
        parts.append('</style>')
    parts.append(END)
    return '\n'.join(parts) + '\n'


def process(page):
    h = read(page)
    if '<head>' not in h:
        return f'{page}: no <head>, skipped'

    # Which stylesheets did this page link?
    linked = [m.group(1) + '.css' for m in CSS_LINK.finditer(h)]
    if not linked and BEGIN not in h:
        return f'{page}: no assets CSS links, skipped'

    if BEGIN in h:
        # idempotent refresh: reuse the set recorded in the existing block
        prev = h[h.index(BEGIN):h.index(END) + len(END)]
        linked = re.findall(r'inlined assets/(\S+?\.css)', prev)
        h = h.replace(prev + '\n', '', 1).replace(prev, '', 1)

    order = [c for c in ('site.css', 'subpage.css', 'blog.css') if c in linked]
    if not order:
        return f'{page}: nothing to inline'

    # strip the render-blocking links
    for pat in FONT_LINK_PATTERNS:
        h = re.sub(pat, '', h)
    h = CSS_LINK.sub('', h)

    block = build(page, order)
    h = h.replace('</head>', block + '</head>', 1)

    with open(os.path.join(ROOT, page), 'w', encoding='utf-8') as f:
        f.write(h)

    # verify nothing render-blocking survived
    bad = []
    if re.search(r'<link[^>]+assets/(site|subpage|blog)\.css', h):
        bad.append('css link remains')
    if re.search(r'<link[^>]+fonts\.googleapis\.com', h):
        bad.append('font link remains')
    return f'{page}: inlined {", ".join(order)}' + (('  !! ' + '; '.join(bad)) if bad else '')


def main():
    targets = sys.argv[1:]
    if not targets:
        targets = [os.path.relpath(p, ROOT) for p in
                   sorted(glob.glob(os.path.join(ROOT, '*.html')))
                   + sorted(glob.glob(os.path.join(ROOT, 'blog', '*.html')))]
    for t in targets:
        if os.path.basename(t) in SKIP:
            continue
        print(process(t))


if __name__ == '__main__':
    main()
