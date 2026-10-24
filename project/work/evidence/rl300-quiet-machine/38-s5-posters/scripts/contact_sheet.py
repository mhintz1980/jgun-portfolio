import bpy, sys, os
import array
a = sys.argv[sys.argv.index('--') + 1:]
d, out = a[0], a[1]
frames = list(range(581, 588))
TW, TH = 640, 360
cols, rows = 4, 2
W, H = TW * cols, TH * rows
buf = [0.1] * (W * H * 4)
for i, f in enumerate(frames):
    img = bpy.data.images.load(os.path.join(d, f'poster-f{f}.png'))
    img.scale(TW, TH)
    px = list(img.pixels)
    c, r = i % cols, rows - 1 - (i // cols)
    for y in range(TH):
        s = y * TW * 4
        o = ((r * TH + y) * W + c * TW) * 4
        buf[o:o + TW * 4] = px[s:s + TW * 4]
sheet = bpy.data.images.new('sheet', W, H, alpha=True)
sheet.pixels = buf
sheet.filepath_raw = out
sheet.file_format = 'PNG'
sheet.save()
print('SHEET', out)
