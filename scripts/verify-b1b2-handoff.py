"""Compare the cyan line mask at B2's exact same-frame handoff captures."""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageChops


root = Path(__file__).resolve().parents[1] / "project" / "work" / "evidence" / "b1-b2-captures"
lines = Image.open(root / "handoff-lines.png").convert("RGB")
registered = Image.open(root / "handoff-registered.png").convert("RGB")

if lines.size != registered.size:
    raise SystemExit(f"Capture dimensions differ: {lines.size} != {registered.size}")

def cyan_mask(image: Image.Image) -> Image.Image:
    return image.point(lambda _: 0).convert("L").point(
        lambda _: 0,
    ) if False else Image.eval(
        Image.merge("L", (image.getchannel("R"), image.getchannel("G"), image.getchannel("B"))),
        lambda _: 0,
    )

pixels = list(lines.getdata())
registered_pixels = list(registered.getdata())
line_mask = Image.new("L", lines.size)
registered_mask = Image.new("L", registered.size)
line_mask.putdata([255 if b > 150 and g > 125 and r < 150 else 0 for r, g, b in pixels])
registered_mask.putdata([255 if b > 150 and g > 125 and r < 150 else 0 for r, g, b in registered_pixels])

mask_diff = ImageChops.difference(line_mask, registered_mask)
mask_diff.save(root / "handoff-cyan-mask-diff.png")
raw_diff = ImageChops.difference(lines, registered)
raw_diff.save(root / "handoff-raw-pixel-diff.png")

payload = {
    "capture_size": list(lines.size),
    "same_scroll_checkpoint": 0.083984375,
    "raw_changed_pixels": sum(1 for value in raw_diff.getdata() if value != (0, 0, 0)),
    "cyan_edge_mask_changed_pixels": sum(1 for value in mask_diff.getdata() if value != 0),
}
(root / "handoff-pixel-diff.json").write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
print(json.dumps(payload))
