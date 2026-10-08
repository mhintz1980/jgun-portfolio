from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
base=Path(__file__).resolve().parent
repo=base.parents[4]
sources=[
repo/"project/work/evidence/JG-035-opening-drafting-table/blue-trace-tunnel-2026-10-03/verified-roster/desktop-forward-35-0.116400.png",
repo/"project/work/evidence/jg029-ring-switch-knurl/extracted-train-0.50.png",
]
canvas=Image.new("RGB",(1920,2300),"#171b20")
draw=ImageDraw.Draw(canvas)
font=ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf",34)
for src,y,label in zip(sources,[60,1200],["A: ACTUAL JGUN - PISTOL HANDLE, LEFT SQUARE DRIVE, BLACK BARREL","B: ACTUAL INTERNAL GEAR TRAIN - COAXIAL CARRIERS"]):
    draw.text((28,y-45),label,font=font,fill="white")
    with Image.open(src) as im:
        im=im.convert("RGB"); im.thumbnail((1920,1080))
        canvas.paste(im,((1920-im.width)//2,y))
canvas.save(base/"02-real-cad-reference-board.jpg",quality=95)
print("reference board saved")

