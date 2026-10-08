from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
base = Path(__file__).resolve().parent
canvas = Image.new("RGB", (2840, 1560), "#13171b")
draw = ImageDraw.Draw(canvas)
font_path = Path("C:/Windows/Fonts/segoeui.ttf")
font = ImageFont.truetype(str(font_path), 25)
title_font = ImageFont.truetype(str(font_path), 39)
draw.text((36, 20), "MARK HINTZ / CONCEPT PRESENTATION", font=title_font, fill="#eeeeea")
draw.text((38, 75), "Authorship. Manufacturing decisions. Finish. Curiosity.", font=font, fill="#aeb8bc")
frames = [
    ("01-authored-vellum.png", "01  An authored drawing", (36, 137, 1080, 611)),
    ("02-packaging-story-v3.png", "02  The decision behind the detail", (1140, 137, 1080, 611)),
    ("03-ring-finish.png", "03  Built to feel right", (36, 827, 1080, 611)),
    ("04-planet-inspection-v3.png", "04  Proposed inspection / illustrative", (1140, 827, 1080, 611)),
    ("05-mobile-inspection.png", "05  Mobile inspection", (2244, 137, 560, 1295)),
]
for name, label, (x, y, width, height) in frames:
    with Image.open(base / name) as source:
        source = source.convert("RGB")
        source.thumbnail((width, height), Image.Resampling.LANCZOS)
        canvas.paste(source, (x + (width-source.width)//2, y + (height-source.height)//2))
    draw.text((x, y + height + 13), label, font=font, fill="#eeeeea")
draw.text((38, 1514), "Appearance studies only. Technical drawings and actual inspection practice remain authoritative.", font=font, fill="#aeb8bc")
canvas.save(base / "contact-sheet.jpg", quality=93, subsampling=0)
print("contact-sheet.jpg | 2840 x 1560")

