"""Independent rerun of the producer's UNMODIFIED scripts/manufacturing/measure_g0.py.

Executes the producer script text as-is (same __file__, so its own source hash matches),
passes --out geometry/reviewer-rerun under the producer's original output guard.
Run: blender -b --factory-startup --python-exit-code 1 --python rerun_g0.py
"""
import hashlib
import sys
from pathlib import Path

REVIEW = Path(__file__).resolve().parent
ROOT = REVIEW.parents[5]
PRODUCER = ROOT / 'scripts/manufacturing/measure_g0.py'
OUT = REVIEW.parent / 'geometry/reviewer-rerun'
text = PRODUCER.read_bytes()
print('PRODUCER_SCRIPT_SHA256 ' + hashlib.sha256(text).hexdigest(), flush=True)
ns = {'__file__': str(PRODUCER), '__name__': 'measure_g0_rerun'}
exec(compile(text.decode('utf-8'), str(PRODUCER), 'exec'), ns)
sys.argv = [sys.argv[0], '--', '--out', str(OUT)]
ns['main']()
