"""Geometry comparison: generated clip frames vs the real render.

usage: geom_compare.py <real.png> <frames_dir> <out_dir> <tag>
frames_dir holds start.png / mid.png / end.png extracted from the generated clip.
The real render is registered to each generated frame by silhouette bbox
(uniform-in-x / uniform-in-y scale + translate), so a camera push-in is removed
and what remains is shape change. Reports bbox aspect change and silhouette IoU.
"""
import sys, json
import numpy as np
from PIL import Image, ImageFilter, ImageDraw

real_p, fdir, out, tag = sys.argv[1:5]
W, H = 1920, 1080


def load(p):
    return Image.open(p).convert("RGB").resize((W, H), Image.LANCZOS)


def mask(img):
    a = np.asarray(img).astype(np.float32)
    corners = np.concatenate([a[:40, :40].reshape(-1, 3), a[:40, -40:].reshape(-1, 3),
                              a[-40:, :40].reshape(-1, 3), a[-40:, -40:].reshape(-1, 3)])
    bg = np.median(corners, axis=0)
    d = np.abs(a - bg).max(axis=2)
    m = d > 26
    # drop specks: keep rows/cols with enough support
    im = Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(7))
    return np.asarray(im) > 127


def bbox(m):
    ys, xs = np.where(m)
    cols = np.bincount(xs, minlength=W); rows = np.bincount(ys, minlength=H)
    xs_ok = np.where(cols > 3)[0]; ys_ok = np.where(rows > 3)[0]
    return int(xs_ok[0]), int(ys_ok[0]), int(xs_ok[-1]), int(ys_ok[-1])


def edges(img):
    g = img.convert("L").filter(ImageFilter.GaussianBlur(1.2)).filter(ImageFilter.FIND_EDGES)
    e = np.asarray(g).astype(np.float32)
    e[:2] = 0; e[-2:] = 0; e[:, :2] = 0; e[:, -2:] = 0
    return e > 22


real = load(real_p)
rm = mask(real); rb = bbox(rm)
report = {"real_bbox": rb, "real_aspect": round((rb[2] - rb[0]) / (rb[3] - rb[1]), 4), "frames": {}}

for name in ("start", "mid", "end"):
    gen = load(f"{fdir}/{name}.png")
    # generated object is dark metal on a light wall with a soft cast shadow:
    # segment by darkness so the shadow is not counted as the part
    gl = np.asarray(gen.convert("L").filter(ImageFilter.MedianFilter(5)))
    gm = gl < 88 if name != "start" else mask(gen)
    gb = bbox(gm)
    sx = (gb[2] - gb[0]) / (rb[2] - rb[0]); sy = (gb[3] - gb[1]) / (rb[3] - rb[1])
    # register real -> generated with a single uniform scale (mean), anchored on bbox centre
    s = (sx + sy) / 2
    cxr, cyr = (rb[0] + rb[2]) / 2, (rb[1] + rb[3]) / 2
    cxg, cyg = (gb[0] + gb[2]) / 2, (gb[1] + gb[3]) / 2
    # affine maps output(gen) coords -> input(real) coords
    coeff = (1 / s, 0, cxr - cxg / s, 0, 1 / s, cyr - cyg / s)
    real_w = real.transform((W, H), Image.AFFINE, coeff, Image.BICUBIC, fillcolor=(244, 241, 234))
    rwm = mask(real_w)
    iou = float((rwm & gm).sum() / max(1, (rwm | gm).sum()))
    er, eg = edges(real_w), edges(gen)
    ov = np.full((H, W, 3), 18, np.uint8)
    ov[er] = (0, 220, 255)          # real = cyan
    ov[eg] = (255, 70, 60)          # generated = red
    ov[er & eg] = (255, 255, 255)   # agree = white
    ovi = Image.fromarray(ov)
    diff = np.abs(np.asarray(real_w.convert("L")).astype(np.int16) - np.asarray(gen.convert("L")).astype(np.int16))
    sheet = Image.new("RGB", (W * 2, H * 2), (18, 18, 18))
    sheet.paste(real_w, (0, 0)); sheet.paste(gen, (W, 0)); sheet.paste(ovi, (0, H))
    sheet.paste(Image.fromarray(np.clip(diff * 2, 0, 255).astype(np.uint8)).convert("RGB"), (W, H))
    d = ImageDraw.Draw(sheet)
    for xy, t in (((20, 14), "REAL render (registered)"), ((W + 20, 14), f"GENERATED {tag} {name}"),
                  ((20, H + 14), "EDGES  cyan=real  red=generated  white=agree"), ((W + 20, H + 14), "ABS DIFFERENCE x2")):
        d.rectangle([xy[0] - 8, xy[1] - 6, xy[0] + 620, xy[1] + 30], fill=(0, 0, 0)); d.text(xy, t, fill=(255, 255, 255))
    sheet = sheet.resize((W, H), Image.LANCZOS)
    sheet.save(f"{out}/{tag}-geom-{name}.jpg", quality=90)
    ovi.crop((max(0, gb[0] - 40), max(0, gb[1] - 40), min(W, gb[2] + 40), min(H, gb[3] + 40))).save(f"{out}/{tag}-edges-{name}.png")
    report["frames"][name] = {"gen_bbox": gb, "gen_aspect": round((gb[2] - gb[0]) / (gb[3] - gb[1]), 4),
                              "scale_x": round(sx, 4), "scale_y": round(sy, 4),
                              "aspect_change_pct": round((sx / sy - 1) * 100, 2), "silhouette_iou": round(iou, 4),
                              "edge_agree_pct_of_real": round(float((er & eg).sum() / max(1, er.sum()) * 100), 1)}

json.dump(report, open(f"{out}/{tag}-geom-report.json", "w"), indent=1)
print(json.dumps(report, indent=1))
