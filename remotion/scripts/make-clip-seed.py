"""Seed frame for Higgsfield clip A: carbine shade + line on paper, no text."""
import sys
from PIL import Image, ImageChops

src, out = sys.argv[1], sys.argv[2]
idx = sys.argv[3] if len(sys.argv) > 3 else "0000"
paper = Image.new("RGB", (1920, 1080), (244, 241, 234))
shade = Image.open(f"{src}/shade/f{idx}.webp").convert("RGBA")
line = Image.open(f"{src}/line/f{idx}.webp").convert("RGB")
base = paper.copy()
base.paste(shade, (0, 0), shade)
base = ImageChops.multiply(base, line)
base.save(out)
print(out, base.size)
