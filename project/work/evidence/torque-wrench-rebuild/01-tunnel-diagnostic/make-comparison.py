"""Evidence presentation only: preserve aspect ratios and original pixel appearance."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

here = Path(__file__).resolve().parent
root = here.parents[4]
sources = [
    ('Owner target (concept + markup)', root / 'project/work/evidence/JG-035-opening-drafting-table/blue-trace-tunnel-2026-10-03/concept-media/03-deep-tunnel-feedback.png'),
    ('Historical software GL, t=.90', root / 'project/work/evidence/JG-035-opening-drafting-table/owner-revisions-2026-10-07/after-o1b/opening-desktop-t0p9.png'),
    ('Current AMD 780M / full, t=.90', here / 'full/opening-desktop-t0p9.png'),
]
font_path = Path('C:/Windows/Fonts/segoeui.ttf')
font = ImageFont.truetype(str(font_path), 30) if font_path.exists() else ImageFont.load_default()
small = ImageFont.truetype(str(font_path), 22) if font_path.exists() else ImageFont.load_default()
board = Image.new('RGB', (2880, 760), '#15171a')
draw = ImageDraw.Draw(board)
for i, (label, source) in enumerate(sources):
    im = Image.open(source).convert('RGB')
    original = im.size
    im.thumbnail((940, 630), Image.Resampling.LANCZOS)
    x = i * 960 + (960 - im.width) // 2
    y = 80 + (630 - im.height) // 2
    board.paste(im, (x, y))
    draw.text((i * 960 + 16, 15), label, fill='#eeeeee', font=font)
    draw.text((i * 960 + 16, 720), f'Original {original[0]}x{original[1]}; no brightness changes', fill='#aaaaaa', font=small)
board.save(here / 'tunnel-comparison.png')
print(here / 'tunnel-comparison.png')
