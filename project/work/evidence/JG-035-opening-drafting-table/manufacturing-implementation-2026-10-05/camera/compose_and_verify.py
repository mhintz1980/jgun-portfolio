"""Compose evidence overlays and verify measured projected regions/pixels.

Run using the bundled Python/Pillow after blockout.py finishes.
"""
import hashlib
import json
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageStat

OUT = Path(__file__).resolve().parent
data = json.loads((OUT / 'blockout.json').read_text())
FONT = r'C:\Windows\Fonts\segoeui.ttf'
BOLD = r'C:\Windows\Fonts\segoeuib.ttf'
BG = (18, 22, 26)
FG = (229, 234, 237)
MUTED = (170, 184, 190)
CYAN = (107, 209, 202)
GOLD = (226, 170, 90)

def font(size, bold=False):
    return ImageFont.truetype(BOLD if bold else FONT, size)

def text(draw, xy, value, size, fill=FG, bold=False):
    draw.text(xy, value, font=font(size, bold), fill=fill)

def lines(draw, xy, values, size, fill=MUTED):
    for i, value in enumerate(values):
        text(draw, (xy[0], xy[1] + i * (size + 7)), value, size, fill)

def luma(color):
    values = [v / 255 for v in color]
    values = [v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in values]
    return sum(v * w for v, w in zip(values, (.2126, .7152, .0722)))

contrast = (luma(FG) + .05) / (luma(BG) + .05)
assert contrast >= 4.5
checks = []
for render in data['renders']:
    layout = render['layout_css_px']
    vw, vh = layout['viewport']
    x, y, w, h = layout['action_rect']
    cx, cy, cw, ch = layout['card_rect']
    mobile = render['layout'] == 'mobile'
    cad = Image.open(OUT / render['cad_png']).convert('RGB')
    assert cad.size == (w, h)
    image = Image.new('RGB', (vw, vh), BG)
    image.paste(cad, (x, y))
    draw = ImageDraw.Draw(image)
    text(draw, (32 if mobile else 70, 30), 'P001835 INPUT SHAFT', 22 if mobile else 30, bold=True)
    text(draw, (32 if mobile else 70, 69), render['shot'].replace('-', ' ').upper(), 17 if mobile else 20, CYAN)
    text(draw, (32 if mobile else 70, 101), 'CAD blockout / illustrative tooling', 14 if mobile else 17)
    draw.rectangle((x, y, x + w - 1, y + h - 1), outline=(68, 82, 90))
    roi = render['critical_roi']
    roi_stats = None
    if roi:
        (rx0, ry0), (rx1, ry1) = roi['bounds_css_px']
        assert x <= rx0 < rx1 <= x + w, (render['shot'], roi)
        assert y <= ry0 < ry1 <= y + h, (render['shot'], roi)
        draw.rectangle((rx0, ry0, rx1, ry1), outline=CYAN, width=2)
        bounds = (math.floor(rx0 - x), math.floor(ry0 - y), math.ceil(rx1 - x), math.ceil(ry1 - y))
        crop = cad.crop(bounds)
        bright = sum(1 for r, g, b in crop.get_flattened_data() if max(r, g, b) > 100)
        assert bright > 20, (render['shot'], 'Blank critical region')
        roi_stats = {'bounds_in_cad_px': bounds, 'pixels_above_100': bright,
                     'total_pixels': crop.width * crop.height,
                     'channel_mean': ImageStat.Stat(crop).mean,
                     'meaning': 'Nonblank region only; no cutter contact, chip or clearance acceptance'}
        assert min(rx0 / vw, (vw - rx1) / vw, ry0 / vh, (vh - ry1) / vh) >= .08
    # Card area is fixed between all chapters and separated from raster action.
    assert x + w <= cx or y + h <= cy
    card_bg = (25, 30, 34)
    draw.rectangle((cx, cy, cx + cw - 1, cy + ch - 1), fill=card_bg)
    draw.line((cx, cy, cx + cw, cy), fill=CYAN, width=2)
    px, py = cx + 16, cy + 14
    text(draw, (px, py), 'FIXED CARD REGION', 13, CYAN, True)
    title = 'AISI 4340 (H.T. 48-50 HRC)' if render['shot'] in ('hobbing', 'runout-withdrawn', 'support-before', 'support-after') else 'AISI 4140 (40-45 HRC)'
    title_font = 19 if mobile else 21
    while draw.textbbox((0, 0), title, font=font(title_font, True))[2] > cw - 32:
        title_font -= 1
    assert title_font >= 16
    text(draw, (px, py + 28), title, title_font, FG, True)
    detail = ['Owner account / study caption', 'No load or FEA result implied']
    if render['shot'].startswith('support-'):
        detail = ['Legacy -> approved placement', '+2.750 mm local Y / applied once']
    elif render['shot'] == 'cutter-exit':
        detail = ['Face / edge / relief ROI', 'Tool compatibility unresolved']
    elif render['shot'] == 'hobbing':
        detail = ['RH, one start / candidate only', 'Swept clearance unresolved']
    lines(draw, (px, py + 62), detail, 14 if mobile else 17)
    text(draw, (px, py + (125 if mobile else 165)), 'CLEARANCE: UNRESOLVED', 13 if mobile else 17, GOLD, True)
    ux, uy, uw, uh = layout['controls_rect']
    draw.line((ux, uy - 10, ux + uw, uy - 10), fill=(68, 82, 90))
    text(draw, (ux, uy + 2), 'Play / Pause     Seek     Return', 16 if mobile else 20)
    text(draw, (ux, uy + 34), 'G0 evidence only', 13 if mobile else 15, MUTED)
    output = OUT / (render['layout'] + '-' + render['shot'] + '.png')
    image.save(output)
    checks.append({'layout': render['layout'], 'shot': render['shot'],
                   'png': output.name, 'png_sha256': hashlib.sha256(output.read_bytes()).hexdigest(),
                   'viewport_px': list(image.size), 'card_font_px': title_font,
                   'card_geometry_disjoint': True, 'critical_roi_pixels': roi_stats,
                   'action_geometry_nonblank_pixels': sum(1 for p in cad.get_flattened_data() if max(p) > 100)})
    assert checks[-1]['action_geometry_nonblank_pixels'] > 100
    (ax0, ay0), (ax1, ay1) = render['projected_axis']['bounds_css_px']
    assert abs(ay1 - ay0) < .01, 'Projected shaft axis must stay horizontal'
    checks[-1]['projected_shaft_axis_vertical_drift_px'] = ay1 - ay0

# Support endpoints use one camera, so motion is not suggested by a framing change.
for layout_name in ('desktop', 'mobile'):
    before, after = [r for r in data['renders'] if r['layout'] == layout_name and r['shot'].startswith('support-')]
    assert before['camera'] == after['camera']

# Check signed generating velocities in the explicitly illustrated pitch frame.
work_r, cutter_r, normal_module, hob_pitch_r = .005, .010, .001, .0035
cutter_rate = 1.0
work_rate = -2.0
work_contact_velocity = work_r * work_rate
cutter_contact_velocity = -cutter_r * cutter_rate
shaper_residual = work_contact_velocity - cutter_contact_velocity
hob_rate = 1.0
hob_work_rate = -.1
gamma = math.asin(normal_module / (2 * hob_pitch_r))
hob_crest_x_velocity = -hob_pitch_r * math.sin(gamma) * hob_rate
hob_work_x_velocity = work_r * hob_work_rate
hob_residual = hob_crest_x_velocity - hob_work_x_velocity
assert abs(shaper_residual) < 1e-12
assert abs(hob_residual) < 1e-12
result = {'status': 'PASS blockout checks; machining acceptance BLOCKED',
          'renders': checks, 'text_contrast_ratio': contrast,
          'signed_convention_checks': {'shaper_pitch_velocity_residual_m_s': shaper_residual,
                                      'hob_phase_velocity_residual_m_s': hob_residual,
                                      'numerical_tolerance_m_s': 1e-12,
                                      'status': 'analytic illustrative pitch-frame check, not actual CAD-flank contact'},
          'clearance_status': data['clearance'],
          'limitations': ['PNG nonblank pixels do not prove tool/face contact or chip visibility.',
                          'Orthographic static blockout does not prove camera motion continuity.',
                          'No runtime draw-call, GPU, machining stroke or strobing proof.']}
(OUT / 'verification.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'status': result['status'], 'renders': len(checks), 'text_contrast_ratio': contrast,
                  'signed_convention_checks': result['signed_convention_checks']}, indent=2))

html = ['<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width">',
        '<title>JG-035 CAD camera blockout</title><style>body{background:#12161a;color:#e5eaed;font:16px Segoe UI,sans-serif;margin:24px}a{color:#6bd1ca}section{margin:32px 0}img{max-width:100%;height:auto}p{max-width:900px}</style>',
        '<h1>P001835 camera blockout</h1><p>Actual approved and legacy CAD. Tool props and pitch dimensions are illustrative candidates. Full swept clearance and production compatibility remain unresolved. Orthographic framing is a G0 proposal, not runtime acceptance.</p>',
        '<p><a href="blockout.json">Camera and source registry</a> | <a href="verification.json">Checks</a> | <a href="tool-conventions.md">Tool conventions</a></p>']
for check in checks:
    label = check['layout'] + ' / ' + check['shot']
    html.append(f'<section><h2>{label}</h2><img src="{check["png"]}" alt="{label}: CAD geometry with separate card and control regions; clearance unresolved."></section>')
html.append('</html>')
(OUT / 'index.html').write_text('\n'.join(html) + '\n', encoding='utf-8')
