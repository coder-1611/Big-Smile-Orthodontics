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
uri, n = enc(load('wp-users.png'), 1160, quality=88, fmt='WEBP', crop=(0, 0, 2800, 260))
out['wpUsers'] = uri
sizes['wpUsers'] = n

# First-impression crops: the top of each homepage
th = load('theirs-home.png')          # 2800 wide, dsf 2 -> CSS 1400
uri, n = enc(th, 660, quality=80, fmt='WEBP', crop=(0, 0, 2800, 2000))
out['theirsTop'] = uri
sizes['theirsTop'] = n

oh = load('ours-home.png')            # 1400 wide, dsf 1
uri, n = enc(oh, 660, quality=80, fmt='WEBP', crop=(0, 0, 1400, 1000))
out['oursTop'] = uri
sizes['oursTop'] = n

with open(OUT, 'w') as f:
    json.dump(out, f)

total = sum(sizes.values())
for k, v in sorted(sizes.items(), key=lambda kv: -kv[1]):
    print(f'  {k:12} {v/1024:8.1f} KB')
print(f'  {"TOTAL":12} {total/1024:8.1f} KB raw  ->  ~{total*1.34/1024:.0f} KB as base64')
