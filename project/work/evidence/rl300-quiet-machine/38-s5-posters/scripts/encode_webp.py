"""Encode the 7 final poster renders to the two WebP sizes the page serves.
<pipeline venv python> encode_webp.py <repo root>
Sources: 38-s5-posters/final/poster-0N.png (beat 4 = poster-04-v3.png). Output: public/images/rl300-shot-0N-poster[-960].webp
"""
import os, sys
from PIL import Image

root = sys.argv[1]
src_dir = os.path.join(root, 'project', 'work', 'evidence', 'rl300-quiet-machine', '38-s5-posters', 'final')
out_dir = os.path.join(root, 'public', 'images')
Q, METHOD = 90, 6
total = 0
for n in range(1, 8):
    name = 'poster-04-v3.png' if n == 4 else f'poster-0{n}.png'
    im = Image.open(os.path.join(src_dir, name)).convert('RGB')
    assert im.size == (1920, 1080), (name, im.size)
    for suffix, size in (('', (1920, 1080)), ('-960', (960, 540))):
        out = os.path.join(out_dir, f'rl300-shot-0{n}-poster{suffix}.webp')
        (im if size == im.size else im.resize(size, Image.LANCZOS)).save(out, 'WEBP', quality=Q, method=METHOD)
        kb = os.path.getsize(out) / 1024
        total += kb
        print(f'{os.path.basename(out)} {size[0]}x{size[1]} {kb:.0f} KB')
print(f'TOTAL {total:.0f} KB')
