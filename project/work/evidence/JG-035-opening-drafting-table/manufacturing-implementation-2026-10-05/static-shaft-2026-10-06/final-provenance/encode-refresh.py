"""Parameterized copy of ../encode-stills.py for a possible final-source refresh.

Only difference from the original: explicit --capture / --dest / --manifest arguments (the
original hardcoded the sibling completed-render-capture dir, public/inspection/shaft, and
raster-manifest.json). Encoding semantics preserved verbatim: same luminance bounds + 24 px
pad, shared union crop for the support pair, LANCZOS ImageOps.pad into 960x600 / 600x600,
WEBP quality 90 method 6, post-write decode check, identical manifest fields. Requires a
complete telemetry-verified capture report. No drawing, synthesis, CAD or source-image edits.

Usage:
  python encode-refresh.py --capture <dir-with-capture-report.json> --dest <webp-dir> --manifest <manifest.json>
"""
import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageOps

here = Path(__file__).resolve().parent
root = next(parent for parent in here.parents if (parent / 'package.json').exists())
parser = argparse.ArgumentParser(description='Parameterized copy of encode-stills.py')
parser.add_argument('--capture', required=True, help='directory containing capture-report.json')
parser.add_argument('--dest', required=True, help='directory that receives the 16 WEBPs')
parser.add_argument('--manifest', required=True, help='path of the raster manifest JSON to write')
args = parser.parse_args()
capture = Path(args.capture)
if not capture.is_absolute():
    capture = root / capture
destination = Path(args.dest)
if not destination.is_absolute():
    destination = root / destination
manifest_path = Path(args.manifest)
if not manifest_path.is_absolute():
    manifest_path = root / manifest_path

report = json.loads((capture / 'capture-report.json').read_text())
if report['failures'] or len(report['cases']) != 2 or not all(case.get('pass') for case in report['cases']):
    raise RuntimeError('Only a complete telemetry-verified capture may be published')
destination.mkdir(parents=True, exist_ok=True)
manifest_path.parent.mkdir(parents=True, exist_ok=True)
manifest = {'captureReport': str((capture / 'capture-report.json').relative_to(root)),
            'method': 'Crop empty dark canvas margins, fit into a real raster WEBP without changing aspect ratio. Support pair shares one union crop and one output transform.',
            'assets': []}

def bounds(image):
    # The main geometry is luminous metal; omit only empty near-black canvas margins.
    mask = image.convert('L').point(lambda value: 255 if value > 22 else 0)
    box = mask.getbbox()
    if box is None:
        raise RuntimeError('Empty source render')
    pad = 24
    return (max(0, box[0]-pad), max(0, box[1]-pad), min(image.width, box[2]+pad), min(image.height, box[3]+pad))

for case in report['cases']:
    layout = case['name']
    images = {shot['id']: Image.open(capture / shot['file']).convert('RGB') for shot in case['shots']}
    crops = {key: bounds(image) for key, image in images.items()}
    support = [crops['support-before'], crops['support-after']]
    union = (min(box[0] for box in support), min(box[1] for box in support), max(box[2] for box in support), max(box[3] for box in support))
    crops['support-before'] = crops['support-after'] = union
    for shot in case['shots']:
        image = images[shot['id']]
        size = (960, 600) if layout == 'desktop' else (600, 600)
        cropped = image.crop(crops[shot['id']])
        output = ImageOps.pad(cropped, size, method=Image.Resampling.LANCZOS, color=(5,10,16), centering=(0.5,0.5))
        file = destination / f"{shot['id']}-{layout}.webp"
        output.save(file, format='WEBP', quality=90, method=6)
        with Image.open(file) as decoded:
            if decoded.format != 'WEBP' or decoded.size != size:
                raise RuntimeError(f'Invalid raster: {file}')
        manifest['assets'].append({'file':str(file.relative_to(root)), 'source':str((capture/shot['file']).relative_to(root)),
            'sourceSha256':shot['sha256'], 'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),
            'sourcePixels':[image.width,image.height], 'crop':crops[shot['id']], 'pixels':size,
            'bytes':file.stat().st_size, 'sampleTime':shot['t'], 'session':shot['post']['session'],
            'entryElapsed':shot['post']['entryElapsed'], 'camera':shot['post']['camera'], 'projection':shot['post']['projection']})
manifest_path.write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({'assets':len(manifest['assets']), 'bytes':sum(asset['bytes'] for asset in manifest['assets']), 'dest':str(destination), 'manifest':str(manifest_path)}))
