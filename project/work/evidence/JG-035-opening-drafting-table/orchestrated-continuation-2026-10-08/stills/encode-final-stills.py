"""Encode final shaft still candidates into an evidence-local publication-shaped tree.

Usage:
  python encode-final-stills.py --capture <capture-dir> --dest <candidate-webp-dir> --manifest <manifest.json>

The destination is deliberately not public/. The parent must approve the exact sixteen-file asset list first.
"""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageOps

parser = argparse.ArgumentParser()
parser.add_argument('--capture', required=True)
parser.add_argument('--dest', required=True)
parser.add_argument('--manifest', required=True)
args = parser.parse_args()
here = Path(__file__).resolve().parent
root = next(parent for parent in here.parents if (parent / 'package.json').exists())

def resolve(value):
    path = Path(value)
    return path if path.is_absolute() else root / path

capture = resolve(args.capture)
destination = resolve(args.dest)
manifest_path = resolve(args.manifest)
report = json.loads((capture / 'capture-report.json').read_text())
expected_ids = ['cutter-exit', 'material-attempts', 'revised-blank', 'hobbed', 'cool-stress', 'support-before', 'support-after', 'assembled-finale']
expected_dimensions = {'desktop': (1440, 900), 'narrow': (390, 844)}
if report.get('schema') != 'final-shaft-still-capture-v2':
    raise RuntimeError('Unexpected capture schema')
if report.get('failures') or len(report.get('cases', [])) != 2 or not all(item.get('pass') for item in report['cases']):
    raise RuntimeError('Only a complete final-build capture may be encoded')
for item in report['cases']:
    name = item['name']
    if [shot['id'] for shot in item['shots']] != expected_ids:
        raise RuntimeError(name + ': publication IDs differ')
    if any(shot.get('format') != 'PNG' or tuple(shot.get('pixels', [])) != expected_dimensions[name] for shot in item['shots']):
        raise RuntimeError(name + ': source format/dimensions differ')

destination.mkdir(parents=True, exist_ok=True)
manifest_path.parent.mkdir(parents=True, exist_ok=True)
manifest = {
    'schema': 'final-shaft-still-encode-v2',
    'captureReport': str((capture / 'capture-report.json').relative_to(root)),
    'candidateDest': str(destination.relative_to(root)),
    'publicDestAfterApproval': 'public/inspection/shaft',
    'qualityLock': report.get('qualityLock', False),
    'evidenceClass': report.get('evidenceClass'),
    'method': 'Crop empty dark margins, fit without aspect-ratio change, and preserve live DOM FOS panels already present in the composited source. Support pair shares one union crop.',
    'assets': [],
}

def bounds(image):
    mask = image.convert('L').point(lambda value: 255 if value > 22 else 0)
    box = mask.getbbox()
    if box is None:
        raise RuntimeError('Empty source render')
    pad = 24
    return (max(0, box[0] - pad), max(0, box[1] - pad), min(image.width, box[2] + pad), min(image.height, box[3] + pad))

for item in report['cases']:
    name = item['name']
    images = {}
    for shot in item['shots']:
        source = capture / shot['file']
        expected_sha256 = shot.get('sha256')
        actual_sha256 = hashlib.sha256(source.read_bytes()).hexdigest()
        if not expected_sha256 or actual_sha256 != expected_sha256:
            raise RuntimeError(name + '/' + shot['id'] + ': source PNG SHA-256 mismatch')
        images[shot['id']] = Image.open(source).convert('RGB')
    crops = {key: bounds(image) for key, image in images.items()}
    support = [crops['support-before'], crops['support-after']]
    crops['support-before'] = crops['support-after'] = (
        min(box[0] for box in support), min(box[1] for box in support),
        max(box[2] for box in support), max(box[3] for box in support),
    )
    for shot in item['shots']:
        image = images[shot['id']]
        size = (960, 600) if name == 'desktop' else (600, 600)
        cropped = image.crop(crops[shot['id']])
        output = ImageOps.pad(cropped, size, method=Image.Resampling.LANCZOS, color=(5, 10, 16), centering=(0.5, 0.5))
        file = destination / (shot['id'] + '-' + name + '.webp')
        output.save(file, format='WEBP', quality=90, method=6)
        with Image.open(file) as decoded:
            if decoded.format != 'WEBP' or decoded.size != size:
                raise RuntimeError('Invalid raster: ' + str(file))
        manifest['assets'].append({
            'file': str(file.relative_to(root)),
            'publicDestination': 'public/inspection/shaft/' + shot['id'] + '-' + name + '.webp',
            'source': str((capture / shot['file']).relative_to(root)),
            'sourceSha256': shot['sha256'],
            'sha256': hashlib.sha256(file.read_bytes()).hexdigest(),
            'sourcePixels': [image.width, image.height],
            'crop': crops[shot['id']], 'pixels': size, 'format': 'WEBP', 'quality': 90,
            'bytes': file.stat().st_size, 'sampleTime': shot['time'], 'session': shot['session'],
            'sampleStamp': shot['sampleStamp'], 'camera': shot['camera'], 'projection': shot['projection'],
            'fosOverlay': shot.get('overlay', []),
        })

manifest['assets'].sort(key=lambda asset: asset['publicDestination'])
manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')
print(json.dumps({'assets': len(manifest['assets']), 'dest': str(destination), 'manifest': str(manifest_path)}, indent=2))

