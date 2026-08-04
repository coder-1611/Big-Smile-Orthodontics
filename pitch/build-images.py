"""Resize the evidence screenshots and emit them as base64 data URIs."""
import base64
import io
import json
import os

from PIL import Image

SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'evidence')
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'imgs.json')


def load(name):
    return Image.open(os.path.join(SRC, name))


def enc(im, width, quality=84, fmt='JPEG', crop=None):
    if crop:
        im = im.crop(crop)
    if im.mode in ('RGBA', 'P', 'LA'):
        bg = Image.new('RGB', im.size, (11, 18, 32))
        bg.paste(im.convert('RGBA'), mask=im.convert('RGBA').split()[-1])
        im = bg
    w, h = im.size
    if w > width:
        im = im.resize((width, max(1, round(h * width / w))), Image.LANCZOS)
    buf = io.BytesIO()
    if fmt == 'WEBP':
        im.save(buf, 'WEBP', quality=quality, method=6)
        mime = 'image/webp'
    else:
        im.save(buf, 'JPEG', quality=quality, optimize=True, progressive=True)
        mime = 'image/jpeg'
    b = buf.getvalue()
    return f'data:{mime};base64,' + base64.b64encode(b).decode(), len(b)


out = {}
sizes = {}

# PSI score strips — text must stay crisp, webp handles this well
# gauge content measured at columns 441-1572, rows 68-216 of the 1988x292 strips
PSI_CROP = (410, 46, 1604, 238)
for key, fn in [('oursM', 'ours-mobile.png'), ('oursD', 'ours-desktop.png'),
                ('theirsM', 'theirs-mobile.png'), ('theirsD', 'theirs-desktop.png')]:
    uri, n = enc(load(fn), 1080, quality=88, fmt='WEBP', crop=PSI_CROP)
    out[key] = uri
    sizes[key] = n

# Pew chart
# keep headline + bars + year labels; full source is stated in the figcaption
pw = load('pew-chart.png')
uri, n = enc(pw, 620, quality=90, fmt='WEBP', crop=(0, 0, pw.size[0], 770))
out['pew'] = uri
sizes['pew'] = n

# Exposed WordPress users endpoint
# text lines measured at y=70-96 and 100-125; take those two so the crop actually
# contains "name":"admin" and the author/tntadmin link rather than gravatar noise
uri, n = enc(load('wp-users.png'), 1200, quality=92, fmt='WEBP', crop=(0, 62, 2800, 130))
out['wpUsers'] = uri
sizes['wpUsers'] = n

# First impression: both captured at an identical 1400x820 viewport, viewport-only,
# animations paused, then cropped to the same height so the comparison is like-for-like.
# Cut just above the rebuild's ticker so a mid-scroll marquee doesn't read as a glitch.
FIRST_CROP = (0, 0, 2800, 1465)
uri, n = enc(load('theirs-first.png'), 680, quality=82, fmt='WEBP', crop=FIRST_CROP)
out['theirsTop'] = uri
sizes['theirsTop'] = n
uri, n = enc(load('ours-first.png'), 680, quality=82, fmt='WEBP', crop=FIRST_CROP)
out['oursTop'] = uri
sizes['oursTop'] = n

with open(OUT, 'w') as f:
    json.dump(out, f)

total = sum(sizes.values())
for k, v in sorted(sizes.items(), key=lambda kv: -kv[1]):
    print(f'  {k:12} {v/1024:8.1f} KB')
print(f'  {"TOTAL":12} {total/1024:8.1f} KB raw  ->  ~{total*1.34/1024:.0f} KB as base64')
