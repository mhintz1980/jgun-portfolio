"""Blur dimension text on homepage drawings (JG-039, Mark 2026-11-02).

Finds small character-sized ink blobs, groups them into words, and blurs every word whose
letters are at most normal callout height. Large view labels (SECTION A-A, DETAIL B) stay sharp.
RGBA drawings are ghost masks (ink in alpha); RGB drawings are dark ink on light paper.

    python3 scripts/blur-dimensions.py SRC.webp OUT.webp [--region x0,y0,x1,y1]  (fractions)
"""
import sys
import cv2
import numpy as np
from PIL import Image


def blur_text(path, out, region=(0, 0, 1, 1)):
    im = Image.open(path)
    rgba = im.mode == 'RGBA'
    arr = np.array(im)
    ink = arr[:, :, 3] if rgba else 255 - cv2.cvtColor(arr[:, :, :3], cv2.COLOR_RGB2GRAY)
    H, W = ink.shape
    x0, y0, x1, y1 = int(region[0] * W), int(region[1] * H), int(region[2] * W), int(region[3] * H)
    binary = (ink > 90).astype(np.uint8)
    n, _, stats, _ = cv2.connectedComponentsWithStats(binary, 8)
    chars = []
    for i in range(1, n):
        x, y, w, h, a = stats[i]
        if 3 <= h <= max(14, H * 0.03) and w <= h * 1.6 and a >= 3 and x >= x0 and y >= y0 and x + w <= x1 and y + h <= y1:
            chars.append((x, y, w, h))
    if not chars:
        Image.fromarray(arr).save(out, quality=88)
        return 0
    med = float(np.median([c[3] for c in chars]))
    mask = np.zeros_like(binary)
    for x, y, w, h in chars:
        if h <= med * 1.3:
            mask[y:y + h, x:x + w] = 1
    gap = max(3, int(med * 0.9))
    mask = cv2.dilate(mask, np.ones((max(1, int(med * 0.3)), gap), np.uint8))
    m, _, boxes, _ = cv2.connectedComponentsWithStats(mask, 8)
    count = 0
    for i in range(1, m):
        x, y, w, h, _ = boxes[i]
        if w < med * 1.5:  # a lone glyph (balloon digit, datum letter): leave it
            continue
        pad = max(2, int(med * 0.3))
        xa, ya, xb, yb = max(0, x - pad), max(0, y - pad), min(W, x + w + pad), min(H, y + h + pad)
        k = int(med * 1.2) | 1
        arr[ya:yb, xa:xb] = cv2.GaussianBlur(arr[ya:yb, xa:xb], (k * 2 + 1, k * 2 + 1), med * 0.8)
        count += 1
    Image.fromarray(arr).save(out, quality=88, lossless=False)
    return count


if __name__ == '__main__':
    region = (0, 0, 1, 1)
    if '--region' in sys.argv:
        region = tuple(float(v) for v in sys.argv[sys.argv.index('--region') + 1].split(','))
    print(sys.argv[1], blur_text(sys.argv[1], sys.argv[2], region), 'words blurred')
