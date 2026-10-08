"""Encode genuine DOM-hidden renders. No drawing, synthesis, CAD or source-image edits."""
from pathlib import Path
import hashlib
import json
from PIL import Image, ImageOps

here = Path(__file__).resolve().parent
root = next(parent for parent in here.parents if (parent / 'package.json').exists())
capture = here / 'completed-render-capture'
destination = root / 'public/inspection/shaft'
report = json.loads((capture / 'capture-report.json').read_text())
if report['failures'] or len(report['cases']) != 2 or not all(case.get('pass') for case in report['cases']):
    raise RuntimeError('Only a complete telemetry-verified capture may be published')
destination.mkdir(parents=True, exist_ok=True)
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
(here / 'raster-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({'assets':len(manifest['assets']), 'bytes':sum(asset['bytes'] for asset in manifest['assets'])}))
